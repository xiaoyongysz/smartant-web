"use client";

import { memo, type MutableRefObject } from "react";
import Image from "next/image";
import { AssistantAvatar } from "@/components/chat/assistant-avatar";
import { AnalyticsMessageBody } from "@/components/analytics/analytics-message-body";
import { StreamingMessageBody } from "@/components/analytics/streaming-message-body";
import { cn } from "@/lib/utils";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import type { StreamSink } from "@/components/analytics/streaming-message-body";
import type { AuthUser } from "@/lib/auth-storage";
import type { AnalyticsChatMessage } from "@/types/analytics";

interface AnalyticsChatMessagesProps {
  messages: AnalyticsChatMessage[];
  user: AuthUser | null;
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingMessageId?: string | null;
  streamSinkRef?: MutableRefObject<StreamSink | null>;
  onStreamSinkReady?: () => void;
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

const AssistantMessageBubble = memo(function AssistantMessageBubble({
  message,
  isLiveStream,
  streamSinkRef,
  onStreamSinkReady,
  onContentGrow,
}: {
  message: AnalyticsChatMessage;
  isLiveStream: boolean;
  streamSinkRef?: MutableRefObject<StreamSink | null>;
  onStreamSinkReady?: () => void;
  onContentGrow?: () => void;
}) {
  if (message.analytics && !message.streaming) {
    return <AnalyticsMessageBody analytics={message.analytics} />;
  }

  const hasPartialVisual =
    message.analytics &&
    (message.analytics.dashboard != null ||
      Boolean(message.analytics.chart?.option));

  if (message.streaming && isLiveStream && streamSinkRef) {
    return (
      <div className="space-y-4">
        {hasPartialVisual && message.analytics && (
          <AnalyticsMessageBody analytics={message.analytics} visualOnly />
        )}
        <StreamingMessageBody
          sinkRef={streamSinkRef}
          onReady={onStreamSinkReady}
          onContentGrow={onContentGrow}
        />
      </div>
    );
  }

  if (message.analytics) {
    return <AnalyticsMessageBody analytics={message.analytics} />;
  }

  return (
    <div className="min-w-0">
      {message.progressHint ? (
        <p className="mb-2 min-h-[1.125rem] truncate text-xs text-muted-foreground">
          {message.progressHint}
        </p>
      ) : null}
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">
        {message.content}
      </p>
    </div>
  );
});

const AnalyticsMessageRow = memo(function AnalyticsMessageRow({
  message,
  user,
  isLiveStream,
  streamSinkRef,
  onStreamSinkReady,
  onContentGrow,
}: {
  message: AnalyticsChatMessage;
  user: AuthUser | null;
  isLiveStream: boolean;
  streamSinkRef?: MutableRefObject<StreamSink | null>;
  onStreamSinkReady?: () => void;
  onContentGrow?: () => void;
}) {
  return (
    <div
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
        {message.role === "user" ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <AssistantMessageBubble
            message={message}
            isLiveStream={isLiveStream}
            streamSinkRef={streamSinkRef}
            onStreamSinkReady={onStreamSinkReady}
            onContentGrow={onContentGrow}
          />
        )}
      </div>
      {message.role === "user" && <UserMessageAvatar user={user} />}
    </div>
  );
});

export function AnalyticsChatMessages({
  messages,
  user,
  isLoading,
  isStreaming = false,
  streamingMessageId = null,
  streamSinkRef,
  onStreamSinkReady,
}: AnalyticsChatMessagesProps) {
  const { containerRef, stickToBottomInstant } = useChatScroll({
    streaming: isStreaming,
    messageCount: messages.length,
    isLoading,
  });

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
          在此进行数据查询、图表分析与报表解读，直接向 smartant 提问即可。
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
    >
      <div className="mx-auto w-full max-w-[888px] space-y-6 px-6 py-8 lg:px-10">
        {messages.map((message) => (
          <AnalyticsMessageRow
            key={message.id}
            message={message}
            user={user}
            isLiveStream={isStreaming && message.id === streamingMessageId}
            streamSinkRef={streamSinkRef}
            onStreamSinkReady={onStreamSinkReady}
            onContentGrow={stickToBottomInstant}
          />
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
      </div>
    </div>
  );
}
