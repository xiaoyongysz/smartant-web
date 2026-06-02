"use client";

import { useRef, useState } from "react";
import { ArrowUp, Loader2, Paperclip, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { isAcceptedFile } from "@/lib/api";

const ACCEPT =
  ".pdf,.doc,.docx,.md,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain";

interface ChatInputProps {
  disabled?: boolean;
  uploading?: boolean;
  showUpload?: boolean;
  placeholder?: string;
  footerHint?: string;
  onSend: (message: string) => void;
  onUpload?: (file: File) => Promise<void>;
}

export function ChatInput({
  disabled,
  uploading,
  showUpload = true,
  placeholder = "给 smartant 发送消息",
  footerHint = "知识库问答基于已上传文档，回答可能引用原文片段。",
  onSend,
  onUpload,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!isAcceptedFile(file)) {
      toast.error("仅支持 PDF、Word、Markdown、TXT 文件");
      return;
    }

    if (!onUpload) return;
    try {
      await onUpload(file);
    } catch {
      /* 错误由上层 toast */
    }
  };

  return (
    <div className="border-t border-border bg-background px-6 pb-6 pt-3 lg:px-10">
      <div className="mx-auto w-full max-w-[888px]">
        <div
          className={cn(
            "flex items-end gap-2 rounded-3xl border border-input bg-background px-3 py-2 shadow-sm",
            "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleFileChange}
          />

          {showUpload && onUpload && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full"
                  disabled={disabled || uploading}
                >
                  {uploading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Plus className="size-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56">
                <DropdownMenuItem
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Paperclip className="size-4" />
                  添加照片和文件
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={disabled}
            className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />

          <Button
            type="button"
            size="icon"
            className="shrink-0 rounded-full"
            disabled={disabled || !value.trim()}
            onClick={handleSubmit}
          >
            <ArrowUp className="size-5" />
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {footerHint}
        </p>
      </div>
    </div>
  );
}
