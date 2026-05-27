"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { SourceSegments } from "@/components/chat/source-segments";
import { AssistantAvatar } from "@/components/chat/assistant-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/auth-storage";
import type { ChatMessage } from "@/types/api";

interface ChatMessagesProps {
  messages: ChatMessage[];
  user: AuthUser | null;
  isLoading?: boolean;
}

function UserMessageAvatar({ user }: { user: AuthUser | null }) {
  if (user?.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={user.name}
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  if (user) {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white">
        {user.name.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
      访
    </div>
  );
}

export function ChatMessages({ messages, user, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 lg:px-10">
        <Image
          src="/smartant-mascot.png"
          alt="智蚁"
          width={120}
          height={120}
          className="mb-6 rounded-2xl object-contain"
          priority
        />
        <h1 className="max-w-2xl text-center text-2xl font-medium leading-relaxed tracking-tight text-foreground">
          HI 我是智蚁，建筑知识百晓通，你有什么想说的么？
        </h1>
        <p className="mt-4 max-w-xl text-center text-sm text-muted-foreground">
          点击输入框左侧「+」上传 PDF、Word、Markdown 或 TXT，基于知识库向 smartant 提问。
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto w-full max-w-[888px] space-y-6 px-6 py-8 lg:px-10">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-4",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            {message.role === "assistant" && <AssistantAvatar size={32} />}
            <div
              className={cn(
                "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.role === "assistant" && message.sourceSegments && (
                <SourceSegments
                  segments={message.sourceSegments}
                  lowestScore={message.lowestScore}
                />
              )}
            </div>
            {message.role === "user" && <UserMessageAvatar user={user} />}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-4">
            <AssistantAvatar size={32} />
            <div className="rounded-2xl bg-muted px-4 py-3">
              <span className="inline-flex gap-1">
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
