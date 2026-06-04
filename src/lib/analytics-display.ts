import type { AnalyticsQueryResponse } from "@/types/analytics";
import { asArray, asNumber, isRecord } from "@/lib/dashboard-format";

export function isReasoningIntent(intent?: string): boolean {
  return intent === "REASONING";
}

/** 需要展示 dashboard 区块的 intent */
export function hasDashboardLayout(intent?: string): boolean {
  return (
    intent === "DASHBOARD" ||
    intent === "COMPOSITE" ||
    intent === "ANALYSIS" ||
    intent === "REPORT" ||
    intent === "REASONING"
  );
}

export function isCompositeLike(intent?: string): boolean {
  return intent === "COMPOSITE" || intent === "ANALYSIS";
}

/** 含可视化输出的 intent（流式阶段 dashboard/chart 不可逐字渲染） */
export function isVisualIntent(intent?: string): boolean {
  return (
    intent === "CHART" ||
    intent === "DASHBOARD" ||
    intent === "COMPOSITE" ||
    intent === "ANALYSIS" ||
    intent === "REPORT" ||
    intent === "REASONING"
  );
}

/** REASONING：仅展示摘要 + KPI，正文建议单独展示 */
export function shouldUseCompactDashboard(intent?: string): boolean {
  return isReasoningIntent(intent);
}

export function hasStructuredDashboard(dashboard: Record<string, unknown>): boolean {
  if (asNumber(dashboard.gmv_30d) != null) return true;
  if (asNumber(dashboard.orders_30d) != null) return true;
  if (asArray(dashboard.monthly_trend).length > 0) return true;
  if (asArray(dashboard.top_products).length > 0) return true;
  if (asArray(dashboard.regional_sales).length > 0) return true;
  if (isRecord(dashboard.overview_12m)) return true;
  return false;
}

export function shouldShowDashboard(
  dashboard: Record<string, unknown> | undefined,
  intent?: string,
): boolean {
  if (!dashboard || Object.keys(dashboard).length === 0) return false;
  if (hasDashboardLayout(intent)) return true;
  return hasStructuredDashboard(dashboard);
}

/** 顶部一句摘要：优先 dashboard.summary，兜底从 message 的「数据摘要」段提取 */
export function extractDashboardSummary(
  dashboard?: Record<string, unknown>,
  message?: string,
): string | undefined {
  if (dashboard && typeof dashboard.summary === "string" && dashboard.summary.trim()) {
    return dashboard.summary.trim();
  }
  if (!message) return undefined;

  const section = message.match(
    /##\s*数据摘要\s*\n+([\s\S]*?)(?=\n##\s|\n---|\n\n##|$)/,
  );
  if (!section?.[1]) return undefined;

  const firstParagraph = section[1]
    .trim()
    .split(/\n\n/)[0]
    ?.replace(/^[-*]\s*/, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .trim();

  return firstParagraph || undefined;
}

export interface ReportDisplayOptions {
  collapsible: boolean;
  defaultExpanded: boolean;
  title: string;
}

/** 按 intent 决定文字报告区展示方式 */
export function getReportDisplayOptions(intent?: string): ReportDisplayOptions {
  if (isCompositeLike(intent)) {
    return {
      collapsible: true,
      defaultExpanded: true,
      title: "数据分析报告",
    };
  }
  if (intent === "DASHBOARD") {
    return {
      collapsible: true,
      defaultExpanded: true,
      title: "完整销售大盘报告",
    };
  }
  if (intent === "REPORT") {
    return {
      collapsible: true,
      defaultExpanded: true,
      title: "完整文字报告",
    };
  }
  if (intent === "REASONING") {
    return {
      collapsible: false,
      defaultExpanded: true,
      title: "运营建议",
    };
  }
  if (intent === "CHART") {
    return {
      collapsible: false,
      defaultExpanded: true,
      title: "图表说明",
    };
  }
  return {
    collapsible: false,
    defaultExpanded: true,
    title: "详细说明",
  };
}

/** COMPOSITE：先出 dashboard/chart，message 仍由 SSE 增量推送 */
export function shouldKeepStreamingAfterResult(data: AnalyticsQueryResponse): boolean {
  if (!isCompositeLike(data.intent)) return false;
  const hasVisual =
    Boolean(data.chart?.option) ||
    (data.dashboard != null && Object.keys(data.dashboard).length > 0);
  if (!hasVisual) return false;
  const backendMessage = data.message?.trim() ?? "";
  return backendMessage.length === 0;
}

export function buildStreamFinalMessage(
  data: AnalyticsQueryResponse,
  streamedText: string,
): string {
  const backend = data.message?.trim() ?? "";
  const streamed = streamedText.trim();
  if (isCompositeLike(data.intent) || hasDashboardLayout(data.intent)) {
    return backend || streamed;
  }
  return backend || streamed;
}
