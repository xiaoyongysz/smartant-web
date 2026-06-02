"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalyticsHumanCheckpointVO } from "@/types/analytics";

interface HumanCheckpointDialogProps {
  open: boolean;
  checkpoint: AnalyticsHumanCheckpointVO | null;
  pendingSql?: string;
  loading?: boolean;
  onConfirm: () => void;
  onReject: () => void;
  onClose: () => void;
}

export function HumanCheckpointDialog({
  open,
  checkpoint,
  pendingSql,
  loading,
  onConfirm,
  onReject,
  onClose,
}: HumanCheckpointDialogProps) {
  if (!open || !checkpoint) return null;

  const sql = checkpoint.pendingSql ?? pendingSql;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="关闭"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-accent"
        >
          <X className="size-4" />
        </button>

        <h2 className="mb-2 text-lg font-medium">需要您的确认</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {checkpoint.prompt ?? "请确认是否执行以下 SQL"}
        </p>

        {sql && (
          <pre className="mb-6 max-h-48 overflow-auto rounded-xl bg-muted p-3 text-xs leading-relaxed">
            {sql}
          </pre>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            disabled={loading}
            onClick={onReject}
          >
            拒绝
          </Button>
          <Button
            className="flex-1 rounded-xl"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "提交中…" : "确认执行"}
          </Button>
        </div>
      </div>
    </div>
  );
}
