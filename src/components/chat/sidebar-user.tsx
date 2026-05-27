"use client";

import Image from "next/image";
import { LogIn, LogOut, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthUser } from "@/lib/auth-storage";

interface SidebarUserProps {
  user: AuthUser | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

function UserAvatar({ user }: { user: AuthUser }) {
  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={user.name}
        width={32}
        height={32}
        className="size-8 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white">
      {user.name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function SidebarUser({ user, onLoginClick, onLogout }: SidebarUserProps) {
  if (!user) {
    return (
      <button
        type="button"
        onClick={onLoginClick}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border px-3 py-2.5 text-left transition-colors hover:bg-accent"
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-muted">
          <LogIn className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">未登录</p>
          <p className="text-xs text-muted-foreground">点击登录以使用完整功能</p>
        </div>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-accent/60">
      <UserAvatar user={user} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{user.name}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 shrink-0">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onLogout}>
            <LogOut className="size-4" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
