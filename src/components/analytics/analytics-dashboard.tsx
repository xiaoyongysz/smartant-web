"use client";

import type { ReactNode } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { EchartView } from "@/components/analytics/echart-view";
import {
  buildMonthlyTrendOption,
  buildRegionalSalesOption,
  buildReturnReasonsOption,
} from "@/lib/dashboard-charts";
import {
  asArray,
  asNumber,
  DASHBOARD_KPI_LABELS,
  formatCurrency,
  formatInteger,
  formatPercent,
  isRecord,
  OVERVIEW_12M_LABELS,
} from "@/lib/dashboard-format";

interface AnalyticsDashboardProps {
  dashboard: Record<string, unknown>;
  /** 覆盖 dashboard.summary */
  summaryOverride?: string;
  /** 后端已返回 chart.option 时，避免重复绘制 monthly_trend */
  hideMonthlyTrend?: boolean;
  /** REASONING 等场景：仅摘要 + KPI，不展示图表/表格 */
  compact?: boolean;
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function ChartPanel({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-background shadow-sm ${className ?? ""}`}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        {icon}
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

export function AnalyticsDashboard({
  dashboard,
  summaryOverride,
  hideMonthlyTrend = false,
  compact = false,
}: AnalyticsDashboardProps) {
  const gmv = asNumber(dashboard.gmv_30d);
  const orders = asNumber(dashboard.orders_30d);
  const aov = asNumber(dashboard.aov_30d);
  const returnRate = asNumber(dashboard.return_rate_30d);
  const summary =
    summaryOverride ??
    (typeof dashboard.summary === "string" ? dashboard.summary : undefined);

  const monthlyTrend = asArray<{
    month: string;
    order_count?: number;
    total_sales?: number;
    active_users?: number;
  }>(dashboard.monthly_trend);

  const regionalSales = asArray<{
    region: string;
    order_count?: number;
    total_sales?: number;
    user_count?: number;
  }>(dashboard.regional_sales);

  const returnReasons = asArray<{
    return_reason: string;
    return_count?: number;
    total_refund?: number;
  }>(dashboard.return_reasons);

  const topProducts = asArray<{
    name: string;
    category?: string;
    total_sold?: number;
    total_revenue?: number;
    order_count?: number;
  }>(dashboard.top_products);

  const overview12m = isRecord(dashboard.overview_12m)
    ? dashboard.overview_12m
    : null;

  const hasStructured =
    gmv != null ||
    monthlyTrend.length > 0 ||
    regionalSales.length > 0;

  if (!hasStructured) {
    return <LegacyDashboard dashboard={dashboard} />;
  }

  return (
    <div className="space-y-4">
      {summary && (
        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
            数据摘要
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
            {summary}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {gmv != null && (
          <KpiCard label={DASHBOARD_KPI_LABELS.gmv_30d} value={formatCurrency(gmv)} />
        )}
        {orders != null && (
          <KpiCard
            label={DASHBOARD_KPI_LABELS.orders_30d}
            value={formatInteger(orders)}
          />
        )}
        {aov != null && (
          <KpiCard label={DASHBOARD_KPI_LABELS.aov_30d} value={formatCurrency(aov)} />
        )}
        {returnRate != null && (
          <KpiCard
            label={DASHBOARD_KPI_LABELS.return_rate_30d}
            value={formatPercent(returnRate)}
          />
        )}
      </div>

      {!compact && (
      <div className="grid gap-4 lg:grid-cols-2">
        {monthlyTrend.length > 0 && !hideMonthlyTrend && (
          <ChartPanel
            title="月度销售趋势"
            icon={<TrendingUp className="size-4 text-emerald-600" />}
            className="lg:col-span-2"
          >
            <EchartView option={buildMonthlyTrendOption(monthlyTrend)} height={300} />
          </ChartPanel>
        )}

        {regionalSales.length > 0 && (
          <ChartPanel
            title="区域销售分布"
            icon={<BarChart3 className="size-4 text-blue-600" />}
          >
            <EchartView option={buildRegionalSalesOption(regionalSales)} height={260} />
          </ChartPanel>
        )}

        {returnReasons.length > 0 && (
          <ChartPanel title="退货原因分布">
            <EchartView option={buildReturnReasonsOption(returnReasons)} height={260} />
          </ChartPanel>
        )}
      </div>
      )}

      {!compact && topProducts.length > 0 && (
        <ChartPanel title="热销产品">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">产品</th>
                  <th className="pb-2 pr-4 font-medium">品类</th>
                  <th className="pb-2 pr-4 font-medium">销量</th>
                  <th className="pb-2 pr-4 font-medium">销售额</th>
                  <th className="pb-2 font-medium">订单</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-4 font-medium">{p.name}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {p.category ?? "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      {p.total_sold != null ? formatInteger(p.total_sold) : "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      {p.total_revenue != null
                        ? formatCurrency(p.total_revenue)
                        : "—"}
                    </td>
                    <td className="py-2.5">
                      {p.order_count != null ? formatInteger(p.order_count) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartPanel>
      )}

      {!compact && overview12m && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(overview12m).map(([key, raw]) => {
            const num = asNumber(raw);
            const label = OVERVIEW_12M_LABELS[key] ?? key;
            let display = String(raw ?? "—");
            if (num != null) {
              if (key.includes("sales") || key.includes("value")) {
                display = formatCurrency(num);
              } else if (key.includes("rate")) {
                display = formatPercent(num);
              } else {
                display = formatInteger(num);
              }
            }
            return <KpiCard key={key} label={`近12月 · ${label}`} value={display} />;
          })}
        </div>
      )}
    </div>
  );
}

/** 未知结构的 dashboard 降级展示 */
function LegacyDashboard({ dashboard }: { dashboard: Record<string, unknown> }) {
  const skip = new Set(["instruction"]);
  const entries = Object.entries(dashboard).filter(([k]) => !skip.has(k));

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="rounded-lg border border-border bg-background px-3 py-2"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {key}
          </p>
          <p className="mt-1 break-all text-sm text-foreground">
            {typeof value === "object"
              ? JSON.stringify(value, null, 2)
              : String(value)}
          </p>
        </div>
      ))}
    </div>
  );
}
