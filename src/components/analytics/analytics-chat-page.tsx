"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatInput } from "@/components/chat/chat-input";
import { LoginDialog } from "@/components/chat/login-dialog";
import { SmartantLogo } from "@/components/chat/smartant-logo";
import { AnalyticsChatMessages } from "@/components/analytics/analytics-chat-messages";
import { HumanCheckpointDialog } from "@/components/analytics/human-checkpoint-dialog";
import { analyticsQuery } from "@/lib/analytics-api";
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

function buildAssistantMessage(data: AnalyticsQueryResponse): AnalyticsChatMessage {
  return {
    id: generateId(),
    role: "assistant",
    content: data.message ?? data.errorMessage ?? "",
    analytics: data,
    createdAt: Date.now(),
  };
}

export function AnalyticsChatPage() {
  const [sessions, setSessions] = useState<AnalyticsChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [checkpointOpen, setCheckpointOpen] = useState(false);
  const [pendingCheckpoint, setPendingCheckpoint] =
    useState<AnalyticsHumanCheckpointVO | null>(null);
  const [pendingTraceId, setPendingTraceId] = useState<string | null>(null);

  const filteredSessions = useMemo(
    () => filterSessionsByQuery(sessions, searchQuery),
    [sessions, searchQuery],
  );

  const currentSession =
    sessions.find((s) => s.id === currentSessionId) ??
    (currentSessionId ? getAnalyticsSession(currentSessionId) : undefined);

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

  const applyAnalyticsResponse = (
    data: AnalyticsQueryResponse,
    baseSession?: AnalyticsChatSession,
  ) => {
    const base =
      baseSession ??
      (currentSessionId ? getAnalyticsSession(currentSessionId) : undefined);
    if (!base) return;

    const assistantMessage = buildAssistantMessage(data);
    const nextSession: AnalyticsChatSession = {
      ...base,
      messages: [...base.messages, assistantMessage],
      pendingTraceId: data.traceId,
    };

    if (
      data.workflowStatus === "AWAITING_HUMAN" &&
      data.humanCheckpoint &&
      data.traceId
    ) {
      setPendingTraceId(data.traceId);
      setPendingCheckpoint(data.humanCheckpoint);
      setCheckpointOpen(true);
    }

    persistSession(nextSession);
  };

  const handleNewChat = () => {
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
          isLoading={isLoading}
        />

        <ChatInput
          showUpload={false}
          disabled={isLoading || !currentSessionId || checkpointOpen}
          placeholder="给 smartant 发送消息"
          footerHint="数据分析由 Agent 生成，含图表时将自动渲染 ECharts。"
          onSend={handleSend}
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
        loading={isLoading}
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
