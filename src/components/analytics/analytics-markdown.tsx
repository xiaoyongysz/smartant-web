"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsMarkdownProps {
  content: string;
  defaultExpanded?: boolean;
  collapsible?: boolean;
  title?: string;
  className?: string;
}

/** 轻量 Markdown：标题、列表、段落（无需额外依赖） */
function renderMarkdownBlock(text: string) {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={`ul-${key++}`} className="my-2 list-disc space-y-1 pl-5 text-sm">
        {listItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }
    if (trimmed === "---") {
      flushList();
      nodes.push(<hr key={`hr-${key++}`} className="my-3 border-border" />);
      continue;
    }
    if (trimmed.startsWith("#### ")) {
      flushList();
      nodes.push(
        <h4 key={`h4-${key++}`} className="mt-3 text-sm font-semibold text-foreground">
          {trimmed.slice(5)}
        </h4>,
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      nodes.push(
        <h2 key={`h2-${key++}`} className="mt-4 text-lg font-semibold text-foreground first:mt-0">
          {trimmed.slice(3)}
        </h2>,
      );
      continue;
    }
    if (trimmed.startsWith("### ")) {
      flushList();
      nodes.push(
        <h3 key={`h3-${key++}`} className="mt-4 text-base font-semibold text-foreground">
          {trimmed.slice(4)}
        </h3>,
      );
      continue;
    }
    if (trimmed.startsWith("- **") || trimmed.startsWith("- ")) {
      listItems.push(
        trimmed
          .replace(/^- /, "")
          .replace(/\*\*(.*?)\*\*/g, "$1"),
      );
      continue;
    }
    flushList();
    const paragraph = trimmed.replace(/\*\*(.*?)\*\*/g, "$1");
    nodes.push(
      <p key={`p-${key++}`} className="my-1.5 text-sm leading-relaxed text-foreground/90">
        {paragraph}
      </p>,
    );
  }
  flushList();
  return nodes;
}

export function AnalyticsMarkdown({
  content,
  defaultExpanded = false,
  collapsible = true,
  title = "详细分析报告",
  className,
}: AnalyticsMarkdownProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const body = useMemo(() => renderMarkdownBlock(content), [content]);

  if (!content.trim()) return null;

  if (!collapsible) {
    return (
      <div className={cn("space-y-1", className)}>
        {title ? (
          <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
        ) : null}
        {body}
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border bg-background", className)}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50"
      >
        {title}
        {expanded ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      <div
        className={cn(
          "overflow-hidden border-t border-border px-4 transition-all",
          expanded ? "max-h-[2000px] py-3 opacity-100" : "max-h-0 border-t-0 py-0 opacity-0",
        )}
      >
        {body}
      </div>
    </div>
  );
}
