"use client";

import { useCallback, useEffect, useRef } from "react";

/** 聊天区原生滚动：流式贴底用 scrollTop，避免 scrollIntoView 引发布局抖动 */
export function useChatScroll(options?: {
  streaming?: boolean;
  messageCount?: number;
  isLoading?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const streamingRef = useRef(options?.streaming ?? false);
  const scrollRafRef = useRef<number | null>(null);
  streamingRef.current = options?.streaming ?? false;

  const scrollToBottom = useCallback((smooth = false) => {
    const el = containerRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, []);

  const stickToBottomInstant = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      scrollToBottom(false);
    });
  }, [scrollToBottom]);

  useEffect(() => {
    if (streamingRef.current) return;
    scrollToBottom(true);
  }, [options?.messageCount, options?.isLoading, scrollToBottom]);

  useEffect(
    () => () => {
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    },
    [],
  );

  return { containerRef, scrollToBottom, stickToBottomInstant };
}
