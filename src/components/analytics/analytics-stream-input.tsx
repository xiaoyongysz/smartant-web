"use client";

import { useRef, useState } from "react";
import { ArrowUp, Loader2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnalyticsStreamInputProps {
  disabled?: boolean;
  streaming?: boolean;
  onSend: (message: string) => void | Promise<void>;
}

export function AnalyticsStreamInput({
  disabled,
  streaming,
  onSend,
}: AnalyticsStreamInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = async () => {
    const text = value.trim();
    if (!text || disabled || streaming) return;
    setValue("");
    await onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="mx-auto w-full max-w-[888px]">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-blue-600">
        <Radio className="size-3.5" />
        流式输入
      </p>
      <div
        className={cn(
          "flex items-end gap-2 rounded-3xl border border-blue-200 bg-blue-50/30 px-3 py-2 shadow-sm",
          "focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-200/60",
        )}
      >
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="流式提问，回答将逐字输出…"
          rows={1}
          disabled={disabled || streaming}
          className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />
        <Button
          type="button"
          size="icon"
          className="shrink-0 rounded-full bg-blue-600 hover:bg-blue-700"
          disabled={disabled || streaming || !value.trim()}
          onClick={() => void handleSubmit()}
        >
          {streaming ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ArrowUp className="size-5" />
          )}
        </Button>
      </div>
      <p className="mt-1.5 text-center text-xs text-muted-foreground">
        流式模式仅输出纯文本；图表与 KPI 在 SSE 结束事件一次性展示
      </p>
    </div>
  );
}
