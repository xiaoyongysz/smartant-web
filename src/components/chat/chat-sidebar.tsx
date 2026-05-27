"use client";

import { MessageSquarePlus, PanelLeftClose, PanelLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarHeader } from "@/components/chat/sidebar-header";
import { SidebarUser } from "@/components/chat/sidebar-user";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/auth-storage";
import type { ChatSession } from "@/types/api";

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  collapsed: boolean;
  searchOpen: boolean;
  searchQuery: string;
  user: AuthUser | null;
  onSearchOpenChange: (open: boolean) => void;
  onSearchQueryChange: (query: string) => void;
  onToggleCollapse: () => void;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onLoginClick: () => void;
  onLogout: () => void;
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  collapsed,
  searchOpen,
  searchQuery,
  user,
  onSearchOpenChange,
  onSearchQueryChange,
  onToggleCollapse,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onLoginClick,
  onLogout,
}: ChatSidebarProps) {
  if (collapsed) {
    return (
      <aside className="flex w-14 flex-col items-center gap-2 border-r border-border bg-sidebar py-3">
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} title="展开侧栏">
          <PanelLeft className="size-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onNewChat} title="新对话">
          <MessageSquarePlus className="size-5" />
        </Button>
        <button
          type="button"
          onClick={user ? undefined : onLoginClick}
          className="mt-auto flex size-9 items-center justify-center rounded-full bg-muted"
          title={user ? user.name : "点击登录"}
        >
          {user ? (
            <span className="text-xs font-medium text-emerald-700">
              {user.name.slice(0, 1)}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">登录</span>
          )}
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <SidebarHeader
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        onSearchOpenChange={onSearchOpenChange}
        onSearchQueryChange={onSearchQueryChange}
      />

      <div className="flex items-center gap-1 px-2 pb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="shrink-0"
          title="收起侧栏"
        >
          <PanelLeftClose className="size-5" />
        </Button>
        <Button
          variant="outline"
          className="flex-1 justify-start gap-2 rounded-xl border-border"
          onClick={onNewChat}
        >
          <MessageSquarePlus className="size-4" />
          新对话
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 pb-4">
          {sessions.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {searchQuery ? "未找到匹配的对话" : "暂无历史对话"}
            </p>
          )}
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group flex items-center gap-1 rounded-lg pr-1",
                currentSessionId === session.id && "bg-accent",
              )}
            >
              <button
                type="button"
                onClick={() => onSelectSession(session.id)}
                className="min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-sm hover:bg-accent/80"
                title={session.title}
              >
                {session.title}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 opacity-0 group-hover:opacity-100"
                onClick={() => onDeleteSession(session.id)}
                title="删除对话"
              >
                <Trash2 className="size-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-3">
        <SidebarUser
          user={user}
          onLoginClick={onLoginClick}
          onLogout={onLogout}
        />
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          smartant · 建筑知识百晓通
        </p>
      </div>
    </aside>
  );
}
