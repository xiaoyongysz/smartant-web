import { AnalyticsEchart } from "@/components/analytics/analytics-echart";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { AnalyticsMarkdown } from "@/components/analytics/analytics-markdown";
import {
  extractDashboardSummary,
  getReportDisplayOptions,
  shouldShowDashboard,
  shouldUseCompactDashboard,
} from "@/lib/analytics-display";
import type { AnalyticsQueryResponse } from "@/types/analytics";

interface AnalyticsMessageBodyProps {
  analytics: AnalyticsQueryResponse;
  /** 流式阶段：只展示 KPI/图表，正文由 StreamingMessageBody 负责 */
  visualOnly?: boolean;
}

export function AnalyticsMessageBody({
  analytics,
  visualOnly = false,
}: AnalyticsMessageBodyProps) {
  const intent = analytics.intent;
  const dashboard = analytics.dashboard;
  const chart = analytics.chart;
  const text = analytics.message || analytics.errorMessage || "";

  const showDashboard = shouldShowDashboard(dashboard, intent);
  const compactDashboard = shouldUseCompactDashboard(intent);
  const hasBackendChart = Boolean(chart?.option);
  const summary = extractDashboardSummary(dashboard, text);
  const reportOpts = getReportDisplayOptions(intent);

  /** 有 message 就展示（REASONING 等 intent 此前因 showDashboard=true 被误隐藏） */
  const showReport = !visualOnly && Boolean(text.trim());

  const chartTitle =
    chart?.description ||
    (showDashboard && !compactDashboard ? "月度销售趋势" : undefined);

  return (
    <div className="space-y-1">
      {intent && (
        <p className="mb-2 text-[10px] text-muted-foreground">
          意图：{intent}
          {analytics.workflowStatus ? ` · 状态：${analytics.workflowStatus}` : ""}
        </p>
      )}

      {showDashboard && dashboard && (
        <AnalyticsDashboard
          dashboard={dashboard}
          summaryOverride={summary}
          hideMonthlyTrend={hasBackendChart}
          compact={compactDashboard}
        />
      )}

      {hasBackendChart && chart && !compactDashboard && (
        <AnalyticsEchart chart={chart} title={chartTitle} />
      )}

      {showReport && (
        <AnalyticsMarkdown
          content={text}
          {...reportOpts}
          className={showDashboard ? "mt-4" : undefined}
        />
      )}

      {!showDashboard && !hasBackendChart && !showReport && (
        <p className="text-muted-foreground">（无展示内容）</p>
      )}
    </div>
  );
}
