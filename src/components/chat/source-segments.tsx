"use client";

import { BookOpen } from "lucide-react";

interface SourceSegmentsProps {
  segments: string[];
  lowestScore?: number;
}

export function SourceSegments({ segments, lowestScore }: SourceSegmentsProps) {
  if (!segments?.length) return null;

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
        {segments.map((segment, index) => (
          <li
            key={`${index}-${segment.slice(0, 24)}`}
            className="rounded-lg bg-background px-3 py-2 text-xs leading-relaxed text-muted-foreground"
          >
            {segment}
          </li>
        ))}
      </ul>
    </div>
  );
}
