"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { LoginDialog } from "@/components/chat/login-dialog";
import { SmartantLogo } from "@/components/chat/smartant-logo";
import { sessionChat, uploadDocument } from "@/lib/api";
import {
  clearAuthUser,
  getAuthUser,
  setAuthUser,
  type AuthUser,
} from "@/lib/auth-storage";
import { filterSessionsByQuery } from "@/lib/session-search";
import {
  createSession,
  deleteSession,
  getSession,
  listSessions,
  saveSession,
} from "@/lib/session-storage";
import { generateId } from "@/lib/utils";
import type { ChatMessage, ChatSession } from "@/types/api";

export function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const filteredSessions = useMemo(
    () => filterSessionsByQuery(sessions, searchQuery),
    [sessions, searchQuery],
  );

  const currentSession =
    sessions.find((s) => s.id === currentSessionId) ??
    (currentSessionId ? getSession(currentSessionId) : undefined);

  const refreshSessions = useCallback(() => {
    setSessions(listSessions());
  }, []);

  useEffect(() => {
    const all = listSessions();
    setSessions(all);
    setUser(getAuthUser());
    if (all.length > 0) {
      setCurrentSessionId(all[0].id);
    } else {
      const created = createSession();
      setSessions([created]);
      setCurrentSessionId(created.id);
    }
    setHydrated(true);
  }, []);

  const persistSession = useCallback(
    (session: ChatSession) => {
      saveSession(session);
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

  const handleNewChat = () => {
    const session = createSession();
    refreshSessions();
    setCurrentSessionId(session.id);
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    const remaining = listSessions();
    setSessions(remaining);
    if (currentSessionId === id) {
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
      } else {
        const created = createSession();
        setSessions([created]);
        setCurrentSessionId(created.id);
      }
    }
    toast.success("已删除对话");
  };

  const handleUpload = async (file: File) => {
    if (!requireLogin()) return;
    setIsUploading(true);
    try {
      const result = await uploadDocument(file);
      toast.success(`文档已上传：${result || file.name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "上传失败";
      toast.error(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async (text: string) => {
    if (!requireLogin()) return;
    if (!currentSessionId || !currentSession) {
      toast.error("请先创建对话");
      return;
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    const withUser: ChatSession = {
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
      const answer = await sessionChat({
        sessionId: currentSessionId,
        message: text,
      });

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: answer.answer,
        sourceSegments: answer.sourceSegments,
        lowestScore: answer.lowestScore,
        createdAt: Date.now(),
      };

      persistSession({
        ...withUser,
        messages: [...withUser.messages, assistantMessage],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "问答失败";
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

        <ChatMessages
          messages={currentSession?.messages ?? []}
          user={user}
          isLoading={isLoading}
        />

        <ChatInput
          disabled={isLoading || !currentSessionId}
          uploading={isUploading}
          onSend={handleSend}
          onUpload={handleUpload}
        />
      </main>

      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}
