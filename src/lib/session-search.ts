import type { ChatSession } from "@/types/api";

/** 按对话标题与消息正文搜索 */
export function filterSessionsByQuery(
  sessions: ChatSession[],
  query: string,
): ChatSession[] {
  const q = query.trim().toLowerCase();
  if (!q) return sessions;

  return sessions.filter((session) => {
    if (session.title.toLowerCase().includes(q)) return true;
    return session.messages.some((m) =>
      m.content.toLowerCase().includes(q),
    );
  });
}
