"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartantLogo } from "@/components/chat/smartant-logo";
import type { AuthUser } from "@/lib/auth-storage";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onLogin: (user: AuthUser) => void;
}

export function LoginDialog({ open, onClose, onLogin }: LoginDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onLogin({
      id: crypto.randomUUID(),
      name: trimmed,
    });
    onClose();
  };

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
        aria-labelledby="login-title"
        className="relative w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-accent"
        >
          <X className="size-4" />
        </button>

        <div className="mb-6 flex justify-center">
          <SmartantLogo size="lg" showText />
        </div>

        <h2 id="login-title" className="mb-1 text-center text-lg font-medium">
          登录 smartant
        </h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          登录后可同步头像，使用知识库问答与文档上传
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入昵称"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            autoFocus
          />
          <Button type="submit" className="w-full rounded-xl" disabled={!name.trim()}>
            登录
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          演示环境：输入昵称即可登录，后续可对接企业 SSO
        </p>
      </div>
    </div>
  );
}
