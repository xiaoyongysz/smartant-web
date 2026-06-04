"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

export interface StreamSink {
  setText: (text: string) => void;
  setProgressHint: (hint: string) => void;
}

interface StreamingMessageBodyProps {
  sinkRef: MutableRefObject<StreamSink | null>;
  onReady?: () => void;
  onContentGrow?: () => void;
}

/** 流式正文：直接写 DOM，不走 React 逐字 setState，避免闪跳 */
export function StreamingMessageBody({
  sinkRef,
  onReady,
  onContentGrow,
}: StreamingMessageBodyProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const onContentGrowRef = useRef(onContentGrow);
  onContentGrowRef.current = onContentGrow;

  useEffect(() => {
    sinkRef.current = {
      setText: (text) => {
        const el = textRef.current;
        if (!el || el.textContent === text) return;
        el.textContent = text;
        onContentGrowRef.current?.();
      },
      setProgressHint: (hint) => {
        const el = hintRef.current;
        if (!el) return;
        const next = hint || "\u00A0";
        if (el.textContent === next) return;
        el.textContent = next;
      },
    };
    onReady?.();

    return () => {
      sinkRef.current = null;
    };
  }, [sinkRef, onReady]);

  return (
    <div className="min-w-0">
      <p
        ref={hintRef}
        className="mb-2 min-h-[1.125rem] truncate text-xs leading-[1.125rem] text-muted-foreground"
        aria-live="polite"
      >
        {"\u00A0"}
      </p>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">
        <span ref={textRef} />
        <span
          aria-hidden
          className="ml-px inline-block w-0.5 bg-foreground/70 align-text-bottom"
          style={{ height: "1em" }}
        />
      </p>
    </div>
  );
}
