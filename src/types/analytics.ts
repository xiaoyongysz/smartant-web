/** 人机协同动作 */
export type HumanAction = "CONFIRM" | "CANCEL" | "MODIFY";

/** 数据分析 Agent 查询请求（与后端入参对齐） */
export interface AnalyticsQueryRequest {
  /** 会话 ID，可为时间戳 */
  sessionId: string;
  /** 查询内容（必填） */
  query: string;
  /** 用户 ID */
  userId: string;
  /** Trace ID（人机协同恢复时回传） */
  traceId?: string;
  /** 人机协同动作 */
  humanAction?: HumanAction;
  /** 人机协同反馈 */
  humanFeedback?: string;
}

export interface AnalyticsChartVO {
  option?: Record<string, unknown>;
  chartType?: string;
  description?: string;
}

export interface AnalyticsHumanCheckpointVO {
  prompt?: string;
  pendingSql?: string;
}

/** 数据分析 Agent 查询响应 */
export interface AnalyticsQueryResponse {
  traceId?: string;
  sessionId?: string;
  workflowStatus?: string;
  intent?: string;
  message?: string;
  chart?: AnalyticsChartVO;
  dashboard?: Record<string, unknown>;
  humanCheckpoint?: AnalyticsHumanCheckpointVO;
  errorMessage?: string;
}

export type AnalyticsMessageRole = "user" | "assistant";

export interface AnalyticsChatMessage {
  id: string;
  role: AnalyticsMessageRole;
  content: string;
  createdAt: number;
  analytics?: AnalyticsQueryResponse;
  /** 流式输出进行中 */
  streaming?: boolean;
  /** 流式阶段的进度提示（不写入最终正文） */
  progressHint?: string;
}

export interface AnalyticsChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: AnalyticsChatMessage[];
  pendingTraceId?: string;
}
