import type { ChatSession } from "@/types/api";
import { generateId } from "@/lib/utils";

const STORAGE_KEY = "smartant-chat-sessions";

function readAll(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatSession[];
  } catch {
    return [];
  }
}

function writeAll(sessions: ChatSession[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function listSessions(): ChatSession[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getSession(id: string): ChatSession | undefined {
  return readAll().find((s) => s.id === id);
}

export function createSession(): ChatSession {
  const now = Date.now();
  const session: ChatSession = {
    id: generateId(),
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

export function saveSession(session: ChatSession): void {
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

export function deleteSession(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}

export function renameSession(id: string, title: string): void {
  const sessions = readAll();
  const session = sessions.find((s) => s.id === id);
  if (!session) return;
  session.title = title.trim() || "新对话";
  session.updatedAt = Date.now();
  writeAll(sessions);
}
