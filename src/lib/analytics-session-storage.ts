import type { AnalyticsChatSession } from "@/types/analytics";

const STORAGE_KEY = "smartant-analytics-sessions";

function readAll(): AnalyticsChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AnalyticsChatSession[];
  } catch {
    return [];
  }
}

function writeAll(sessions: AnalyticsChatSession[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function listAnalyticsSessions(): AnalyticsChatSession[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getAnalyticsSession(id: string): AnalyticsChatSession | undefined {
  return readAll().find((s) => s.id === id);
}

export function createAnalyticsSession(): AnalyticsChatSession {
  const now = Date.now();
  const session: AnalyticsChatSession = {
    id: String(now),
    title: "新对话",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  const sessions = readAll();
  sessions.unshift(session);
  writeAll(sessions);
  return session;
}

export function saveAnalyticsSession(session: AnalyticsChatSession): void {
  const sessions = readAll();
  const index = sessions.findIndex((s) => s.id === session.id);
  const next = { ...session, updatedAt: Date.now() };
  if (index >= 0) {
    sessions[index] = next;
  } else {
    sessions.unshift(next);
  }
  writeAll(sessions);
}

export function deleteAnalyticsSession(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}
