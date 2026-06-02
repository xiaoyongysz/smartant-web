"use client";

import Link from "next/link";
import { Building2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartantLogo } from "@/components/chat/smartant-logo";
import { cn } from "@/lib/utils";

interface SidebarHeaderProps {
  searchOpen: boolean;
  searchQuery: string;
  companyHref: string;
  companyTitle: string;
  onSearchOpenChange: (open: boolean) => void;
  onSearchQueryChange: (query: string) => void;
}

export function SidebarHeader({
  searchOpen,
  searchQuery,
  companyHref,
  companyTitle,
  onSearchOpenChange,
  onSearchQueryChange,
}: SidebarHeaderProps) {
  return (
    <div className="space-y-2 border-b border-border p-3">
      <div className="flex items-center gap-1">
        <SmartantLogo size="sm" />
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-8 shrink-0"
          title={companyTitle}
          asChild
        >
          <Link href={companyHref} aria-label={companyTitle}>
            <Building2 className="size-4 text-emerald-600" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          title="搜索消息"
          onClick={() => onSearchOpenChange(!searchOpen)}
        >
          <Search className="size-4" />
        </Button>
      </div>

      <p className="px-1 text-center text-xs tracking-wide text-muted-foreground">
        智策匠心，蚁力筑梦
      </p>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          searchOpen ? "max-h-12 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="搜索对话与消息…"
            className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-8 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-accent"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
