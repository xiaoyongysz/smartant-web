import { AnalyticsEchart } from "@/components/analytics/analytics-echart";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { AnalyticsMarkdown } from "@/components/analytics/analytics-markdown";
import type { AnalyticsQueryResponse } from "@/types/analytics";

interface AnalyticsMessageBodyProps {
  analytics: AnalyticsQueryResponse;
}

export function AnalyticsMessageBody({ analytics }: AnalyticsMessageBodyProps) {
  const text =
    analytics.message ||
    analytics.errorMessage ||
    "";
  const isDashboard = analytics.intent === "DASHBOARD" && analytics.dashboard;
  const hasChart = Boolean(analytics.chart?.option);

  return (
    <div>
      {analytics.intent && (
        <p className="mb-2 text-[10px] text-muted-foreground">
          意图：{analytics.intent}
          {analytics.workflowStatus ? ` · 状态：${analytics.workflowStatus}` : ""}
        </p>
      )}

      {/* DASHBOARD：先图表与 KPI，长文报告折叠 */}
      {isDashboard && analytics.dashboard && (
        <AnalyticsDashboard dashboard={analytics.dashboard} />
      )}

      {hasChart && analytics.chart && (
        <AnalyticsEchart chart={analytics.chart} />
      )}

      {!isDashboard && text && (
        <p className="whitespace-pre-wrap">{text}</p>
      )}

      {isDashboard && text && (
        <AnalyticsMarkdown
          content={text}
          collapsible
          defaultExpanded={false}
          title="查看完整文字报告"
        />
      )}

      {!text && !isDashboard && !hasChart && (
        <p className="text-muted-foreground">（无展示内容）</p>
      )}
    </div>
  );
}
