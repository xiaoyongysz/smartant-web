"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { LoginDialog } from "@/components/chat/login-dialog";
import { SmartantLogo } from "@/components/chat/smartant-logo";
import { AnalyticsChatMessages } from "@/components/analytics/analytics-chat-messages";
import { AnalyticsInputPanel } from "@/components/analytics/analytics-input-panel";
import { HumanCheckpointDialog } from "@/components/analytics/human-checkpoint-dialog";
import type { StreamSink } from "@/components/analytics/streaming-message-body";
import { analyticsQuery } from "@/lib/analytics-api";
import { analyticsQueryStream } from "@/lib/analytics-stream-api";
import { buildAnalyticsQueryRequest } from "@/lib/analytics-request";
import {
  createAnalyticsSession,
  deleteAnalyticsSession,
  getAnalyticsSession,
  listAnalyticsSessions,
  saveAnalyticsSession,
} from "@/lib/analytics-session-storage";
import {
  clearAuthUser,
  getAuthUser,
  setAuthUser,
  type AuthUser,
} from "@/lib/auth-storage";
import { filterSessionsByQuery } from "@/lib/session-search";
import { generateId } from "@/lib/utils";
import type {
  AnalyticsChatMessage,
  AnalyticsChatSession,
  AnalyticsHumanCheckpointVO,
  AnalyticsQueryResponse,
} from "@/types/analytics";

import {
  buildAssistantFromResponse,
  finalizeStreamAssistantMessage,
  isPlainTextStreamDelta,
  omitMessageProgressHint,
} from "@/lib/analytics-response-utils";
import { shouldKeepStreamingAfterResult } from "@/lib/analytics-display";

export function AnalyticsChatPage() {
  const [sessions, setSessions] = useState<AnalyticsChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamAbortRef = useRef<AbortController | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [checkpointOpen, setCheckpointOpen] = useState(false);
  const [pendingCheckpoint, setPendingCheckpoint] =
    useState<AnalyticsHumanCheckpointVO | null>(null);
  const [pendingTraceId, setPendingTraceId] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const streamSinkRef = useRef<StreamSink | null>(null);
  const streamDraftRef = useRef<{ body: string; hint?: string }>({ body: "" });

  const filteredSessions = useMemo(
    () => filterSessionsByQuery(sessions, searchQuery),
    [sessions, searchQuery],
  );

  const currentSession =
    sessions.find((s) => s.id === currentSessionId) ??
    (currentSessionId ? getAnalyticsSession(currentSessionId) : undefined);

  const flushStreamToSink = useCallback(() => {
    const sink = streamSinkRef.current;
    if (!sink) return;
    sink.setText(streamDraftRef.current.body);
    if (streamDraftRef.current.hint) {
      sink.setProgressHint(streamDraftRef.current.hint);
    }
  }, []);

  const handleStreamSinkReady = useCallback(() => {
    flushStreamToSink();
  }, [flushStreamToSink]);

  const refreshSessions = useCallback(() => {
    setSessions(listAnalyticsSessions());
  }, []);

  useEffect(() => {
    const all = listAnalyticsSessions();
    setSessions(all);
    setUser(getAuthUser());
    if (all.length > 0) {
      setCurrentSessionId(all[0].id);
    } else {
      const created = createAnalyticsSession();
      setSessions([created]);
      setCurrentSessionId(created.id);
    }
    setHydrated(true);
  }, []);

  const persistSession = useCallback(
    (session: AnalyticsChatSession) => {
      saveAnalyticsSession(session);
      refreshSessions();
      setCurrentSessionId(session.id);
    },
    [refreshSessions],
  );

  const handleLogin = (authUser: AuthUser) => {
    setAuthUser(authUser);
    setUser(authUser);
    toast.success(`欢迎回来，${authUser.name}`);
  };

  const handleLogout = () => {
    clearAuthUser();
    setUser(null);
    toast.success("已退出登录");
  };

  const requireLogin = (): boolean => {
    if (user) return true;
    toast.info("请先登录后再操作");
    setLoginOpen(true);
    return false;
  };

  const handleHumanResponse = async (confirmed: boolean) => {
    if (!requireLogin() || !user) return;
    if (!currentSessionId || !pendingTraceId) return;
    setIsLoading(true);
    try {
      const data = await analyticsQuery(
        buildAnalyticsQueryRequest({
          sessionId: currentSessionId,
          query: confirmed ? "确认执行" : "取消执行",
          userId: user.id,
          traceId: pendingTraceId,
          humanAction: confirmed ? "CONFIRM" : "CANCEL",
          humanFeedback: confirmed ? "用户确认执行 SQL" : "用户取消执行",
        }),
      );
      applyAnalyticsResponse(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "提交失败";
      toast.error(message);
    } finally {
      setIsLoading(false);
      setCheckpointOpen(false);
      setPendingCheckpoint(null);
      setPendingTraceId(null);
    }
  };

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  const handleHumanCheckpoint = (data: AnalyticsQueryResponse) => {
    if (
      data.workflowStatus === "AWAITING_HUMAN" &&
      data.humanCheckpoint &&
      data.traceId
    ) {
      setPendingTraceId(data.traceId);
      setPendingCheckpoint(data.humanCheckpoint);
      setCheckpointOpen(true);
    }
  };

  const applyAnalyticsResponse = (
    data: AnalyticsQueryResponse,
    baseSession?: AnalyticsChatSession,
  ) => {
    const base =
      baseSession ??
      (currentSessionId ? getAnalyticsSession(currentSessionId) : undefined);
    if (!base) return;

    const assistantMessage = buildAssistantFromResponse(data);
    const nextSession: AnalyticsChatSession = {
      ...base,
      messages: [...base.messages, assistantMessage],
      pendingTraceId: data.traceId,
    };

    handleHumanCheckpoint(data);
    persistSession(nextSession);
  };

  const updateSessionMessages = (
    base: AnalyticsChatSession,
    messages: AnalyticsChatMessage[],
    extra?: Partial<AnalyticsChatSession>,
  ) => {
    const next: AnalyticsChatSession = {
      ...base,
      ...extra,
      messages,
    };
    saveAnalyticsSession(next);
    setSessions(listAnalyticsSessions());
    setCurrentSessionId(next.id);
  };

  const handleStreamSend = async (text: string) => {
    if (!requireLogin() || !user) return;
    if (!currentSessionId || !currentSession) {
      toast.error("请先创建对话");
      return;
    }

    streamAbortRef.current?.abort();
    const abort = new AbortController();
    streamAbortRef.current = abort;

    const userMessage: AnalyticsChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    const assistantId = generateId();
    const assistantPlaceholder: AnalyticsChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      streaming: true,
      createdAt: Date.now(),
    };

    /** 流式正文（不含进度） */
    let streamBody = "";
    let streamHint: string | undefined;
    let gotResult = false;

    streamDraftRef.current = { body: "", hint: undefined };
    setStreamingMessageId(assistantId);

    let workingSession: AnalyticsChatSession = {
      ...currentSession,
      title:
        currentSession.messages.length === 0
          ? text.slice(0, 24)
          : currentSession.title,
      messages: [
        ...currentSession.messages,
        userMessage,
        assistantPlaceholder,
      ],
    };
    updateSessionMessages(workingSession, workingSession.messages);
    setIsStreaming(true);

    try {
      await analyticsQueryStream(
        buildAnalyticsQueryRequest({
          sessionId: currentSessionId,
          query: text,
          userId: user.id,
        }),
        {
          onDelta: (chunk) => {
            if (!isPlainTextStreamDelta(chunk)) return;
            streamBody += chunk;
            streamDraftRef.current.body = streamBody;
            streamSinkRef.current?.setText(streamBody);
          },
          onProgress: (hint) => {
            streamHint = hint;
            streamDraftRef.current.hint = hint;
            streamSinkRef.current?.setProgressHint(hint);
          },
          onResult: (data) => {
            if (shouldKeepStreamingAfterResult(data)) {
              workingSession = {
                ...workingSession,
                pendingTraceId: data.traceId,
                messages: workingSession.messages.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        analytics: data,
                        streaming: true,
                        content: streamBody,
                      }
                    : m,
                ),
              };
              updateSessionMessages(workingSession, workingSession.messages);
              handleHumanCheckpoint(data);
              return;
            }

            gotResult = true;
            setStreamingMessageId(null);
            streamDraftRef.current = { body: "", hint: undefined };
            const finalized = finalizeStreamAssistantMessage(
              assistantId,
              streamBody,
              data,
            );
            workingSession = {
              ...workingSession,
              pendingTraceId: data.traceId,
              messages: workingSession.messages.map((m) =>
                m.id === assistantId ? finalized : m,
              ),
            };
            updateSessionMessages(workingSession, workingSession.messages);
            handleHumanCheckpoint(data);
          },
          onError: (message) => {
            toast.error(message);
            setStreamingMessageId(null);
            streamDraftRef.current = { body: "", hint: undefined };
            workingSession = {
              ...workingSession,
              messages: workingSession.messages.map((m) =>
                m.id === assistantId
                  ? omitMessageProgressHint({
                      ...m,
                      streaming: false,
                      content: streamBody || `错误：${message}`,
                    })
                  : m,
              ),
            };
            updateSessionMessages(workingSession, workingSession.messages);
          },
          onDone: () => {
            if (!gotResult) {
              const current = workingSession.messages.find(
                (m) => m.id === assistantId,
              );
              if (current?.analytics) {
                const finalized = buildAssistantFromResponse(
                  {
                    ...current.analytics,
                    message: streamBody || current.analytics.message || "",
                  },
                  {
                    id: assistantId,
                    streamedText: streamBody,
                    streaming: false,
                  },
                );
                workingSession = {
                  ...workingSession,
                  messages: workingSession.messages.map((m) =>
                    m.id === assistantId ? finalized : m,
                  ),
                };
              } else {
                workingSession = {
                  ...workingSession,
                  messages: workingSession.messages.map((m) =>
                    m.id === assistantId
                      ? omitMessageProgressHint({
                          ...m,
                          streaming: false,
                          content: streamBody || m.content,
                        })
                      : m,
                  ),
                };
              }
              updateSessionMessages(workingSession, workingSession.messages);
            }
            setStreamingMessageId(null);
            streamDraftRef.current = { body: "", hint: undefined };
            setIsStreaming(false);
          },
        },
        abort.signal,
      );
    } catch (err) {
      if (!abort.signal.aborted) {
        const message = err instanceof Error ? err.message : "流式查询失败";
        toast.error(message);
      }
      setStreamingMessageId(null);
      streamDraftRef.current = { body: "", hint: undefined };
      setIsStreaming(false);
    }
  };

  const handleNewChat = () => {
    streamAbortRef.current?.abort();
    setStreamingMessageId(null);
    streamDraftRef.current = { body: "", hint: undefined };
    setIsStreaming(false);
    const session = createAnalyticsSession();
    refreshSessions();
    setCurrentSessionId(session.id);
    setCheckpointOpen(false);
    setPendingCheckpoint(null);
    setPendingTraceId(null);
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setCheckpointOpen(false);
    setPendingCheckpoint(null);
    setPendingTraceId(null);
  };

  const handleDeleteSession = (id: string) => {
    deleteAnalyticsSession(id);
    const remaining = listAnalyticsSessions();
    setSessions(remaining);
    if (currentSessionId === id) {
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
      } else {
        const created = createAnalyticsSession();
        setSessions([created]);
        setCurrentSessionId(created.id);
      }
    }
    toast.success("已删除对话");
  };

  const handleSend = async (text: string) => {
    if (!requireLogin() || !user) return;
    if (isStreaming) return;
    if (!currentSessionId || !currentSession) {
      toast.error("请先创建对话");
      return;
    }

    const userMessage: AnalyticsChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    const withUser: AnalyticsChatSession = {
      ...currentSession,
      title:
        currentSession.messages.length === 0
          ? text.slice(0, 24)
          : currentSession.title,
      messages: [...currentSession.messages, userMessage],
    };
    persistSession(withUser);
    setIsLoading(true);

    try {
      const data = await analyticsQuery(
        buildAnalyticsQueryRequest({
          sessionId: currentSessionId,
          query: text,
          userId: user.id,
        }),
      );
      applyAnalyticsResponse(data, withUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : "查询失败";
      toast.error(message);
      persistSession(withUser);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        加载中…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <ChatSidebar
        sessions={filteredSessions}
        currentSessionId={currentSessionId}
        collapsed={sidebarCollapsed}
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        user={user}
        companyHref="/"
        companyTitle="知识库问答"
        footerTagline="smartant · 数据分析"
        onSearchOpenChange={setSearchOpen}
        onSearchQueryChange={setSearchQuery}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onLoginClick={() => setLoginOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="flex h-12 shrink-0 items-center justify-center border-b border-border px-4">
          <SmartantLogo size="sm" />
        </header>

        <AnalyticsChatMessages
          messages={currentSession?.messages ?? []}
          user={user}
          isLoading={isLoading && !isStreaming}
          isStreaming={isStreaming}
          streamingMessageId={streamingMessageId}
          streamSinkRef={streamSinkRef}
          onStreamSinkReady={handleStreamSinkReady}
        />

        <AnalyticsInputPanel
          disabled={isLoading || isStreaming || !currentSessionId || checkpointOpen}
          streaming={isStreaming}
          onSend={handleSend}
          onStreamSend={handleStreamSend}
        />
      </main>

      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={handleLogin}
      />

      <HumanCheckpointDialog
        open={checkpointOpen}
        checkpoint={pendingCheckpoint}
        loading={isLoading || isStreaming}
        onConfirm={() => handleHumanResponse(true)}
        onReject={() => handleHumanResponse(false)}
        onClose={() => {
          setCheckpointOpen(false);
          setPendingCheckpoint(null);
        }}
      />
    </div>
  );
}
