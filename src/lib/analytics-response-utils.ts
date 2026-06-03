import type { AnalyticsChatMessage, AnalyticsQueryResponse } from "@/types/analytics";
import {
  buildStreamFinalMessage,
  isVisualIntent,
} from "@/lib/analytics-display";
import { generateId } from "@/lib/utils";

export { isVisualIntent };

/** 是否包含图表 / 仪表盘等可视化（不可流式渲染） */
export function hasVisualOutput(data: AnalyticsQueryResponse): boolean {
  const dashboardKeys =
    data.dashboard && typeof data.dashboard === "object"
      ? Object.keys(data.dashboard).length
      : 0;
  return Boolean(data.chart?.option || dashboardKeys > 0);
}

/** 普通查询与流式结束共用：生成助手消息 */
export function buildAssistantFromResponse(
  data: AnalyticsQueryResponse,
  options?: {
    id?: string;
    streamedText?: string;
    streaming?: boolean;
  },
): AnalyticsChatMessage {
  const streamed = options?.streamedText?.trim() ?? "";
  const backendMessage = data.message?.trim() ?? "";

  // 含图表/仪表盘：最终文案优先用后端 message，不用流式进度拼接
  const hasVisual = hasVisualOutput(data) || isVisualIntent(data.intent);
  const content = hasVisual
    ? buildStreamFinalMessage(data, streamed) || data.errorMessage || ""
    : backendMessage || streamed || data.errorMessage || "";

  const analytics: AnalyticsQueryResponse = {
    ...data,
    message: content || data.message,
  };

  return {
    id: options?.id ?? generateId(),
    role: "assistant",
    content,
    analytics,
    streaming: options?.streaming ?? false,
    createdAt: Date.now(),
  };
}

/** 流式结束后合并助手气泡（与普通查询展示一致） */
export function finalizeStreamAssistantMessage(
  assistantId: string,
  streamedText: string,
  data: AnalyticsQueryResponse,
): AnalyticsChatMessage {
  return buildAssistantFromResponse(data, {
    id: assistantId,
    streamedText,
    streaming: false,
  });
}

/** 流式结束后去掉进度字段（避免显式赋 undefined） */
export function omitMessageProgressHint(
  message: AnalyticsChatMessage,
): AnalyticsChatMessage {
  if (message.progressHint == null) return message;
  const { progressHint: _progressHint, ...rest } = message;
  return rest;
}

/** 是否允许作为纯文本增量（禁止 JSON / 图表片段流式输出） */
export function isPlainTextStreamDelta(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") {
        if ("chart" in parsed || "dashboard" in parsed) return false;
        if (isVisualIntent(String(parsed.intent ?? ""))) return false;
        if (
          "workflowStatus" in parsed ||
          "humanCheckpoint" in parsed
        ) {
          return false;
        }
      }
    } catch {
      /* 非完整 JSON，可能是文本里含括号，仍允许 */
    }
  }
  return true;
}
