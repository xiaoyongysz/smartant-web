"use client";

import { ChatInput } from "@/components/chat/chat-input";
import { AnalyticsStreamInput } from "@/components/analytics/analytics-stream-input";

interface AnalyticsInputPanelProps {
  disabled?: boolean;
  streaming?: boolean;
  onSend: (message: string) => void | Promise<void>;
  onStreamSend: (message: string) => void | Promise<void>;
}

export function AnalyticsInputPanel({
  disabled,
  streaming,
  onSend,
  onStreamSend,
}: AnalyticsInputPanelProps) {
  return (
    <div className="border-t border-border bg-background px-6 pb-6 pt-3 lg:px-10">
      <div className="mx-auto w-full max-w-[888px] space-y-4">
        <ChatInput
          embedded
          showUpload={false}
          disabled={disabled || streaming}
          placeholder="给 smartant 发送消息（普通查询）"
          footerHint=""
          onSend={onSend}
        />
        <AnalyticsStreamInput
          disabled={disabled}
          streaming={streaming}
          onSend={onStreamSend}
        />
        <p className="text-center text-xs text-muted-foreground">
          上方：普通查询（一次性返回）；下方：流式查询（仅文字逐字输出）。
          含图表/仪表盘时，图形在流式结束后一次性渲染，两种模式展示一致。
        </p>
      </div>
    </div>
  );
}
