type SearchableSession = {
  title: string;
  messages: { content: string }[];
};

/** 按对话标题与消息正文搜索 */
export function filterSessionsByQuery<T extends SearchableSession>(
  sessions: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return sessions;

  return sessions.filter((session) => {
    if (session.title.toLowerCase().includes(q)) return true;
    return session.messages.some((m) =>
      m.content.toLowerCase().includes(q),
    );
  });
}
