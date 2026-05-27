"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceSegmentsProps {
  segments: string[];
  lowestScore?: number;
}

function SourceItem({ segment }: { segment: string }) {
  return (
    <li className="rounded-lg bg-background px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      {segment}
    </li>
  );
}

export function SourceSegments({ segments, lowestScore }: SourceSegmentsProps) {
  const [expanded, setExpanded] = useState(false);

  if (!segments?.length) return null;

  const [first, ...rest] = segments;
  const hasMore = rest.length > 0;

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <BookOpen className="size-3.5" />
        引用来源
        {lowestScore != null && (
          <span className="ml-auto font-mono text-[10px]">
            相似度 {lowestScore.toFixed(4)}
          </span>
        )}
      </div>

      <ul className="space-y-2">
        <SourceItem segment={first} />
        {hasMore && expanded && rest.map((segment, index) => (
          <SourceItem key={`${index + 1}-${segment.slice(0, 24)}`} segment={segment} />
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs text-muted-foreground",
            "transition-colors hover:bg-background hover:text-foreground",
          )}
        >
          {expanded ? (
            <>
              <ChevronUp className="size-3.5" />
              收起其余 {rest.length} 条来源
            </>
          ) : (
            <>
              <ChevronDown className="size-3.5" />
              展开其余 {rest.length} 条来源
            </>
          )}
        </button>
      )}
    </div>
  );
}
