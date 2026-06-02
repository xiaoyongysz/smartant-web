import type { AnalyticsQueryRequest, HumanAction } from "@/types/analytics";

interface BuildAnalyticsQueryParams {
  sessionId: string;
  query: string;
  userId: string;
  traceId?: string;
  humanAction?: HumanAction;
  humanFeedback?: string;
}

/** 组装下游请求体，省略 undefined 字段 */
export function buildAnalyticsQueryRequest(
  params: BuildAnalyticsQueryParams,
): AnalyticsQueryRequest {
  const query = params.query.trim();
  if (!query) {
    throw new Error("查询内容不能为空");
  }

  const body: AnalyticsQueryRequest = {
    sessionId: params.sessionId,
    query,
    userId: params.userId,
  };

  if (params.traceId) body.traceId = params.traceId;
  if (params.humanAction) body.humanAction = params.humanAction;
  if (params.humanFeedback?.trim()) {
    body.humanFeedback = params.humanFeedback.trim();
  }

  return body;
}
