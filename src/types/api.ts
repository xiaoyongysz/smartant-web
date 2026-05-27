/** 与后端 ApiResponse 对齐 */
export interface ApiResponse<T> {
  code: string;
  success: boolean;
  data: T;
  message: string;
  showMessage?: string;
}

/** 知识库多轮对话请求 */
export interface SessionChatRequest {
  sessionId: string;
  message: string;
  requestId?: number;
}

/** 知识库问答响应 */
export interface AnswerResponse {
  answer: string;
  sourceSegments: string[];
  lowestScore?: number;
}

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sourceSegments?: string[];
  lowestScore?: number;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}
