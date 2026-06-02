import type { EChartsOption } from "echarts";

const CHART_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

function shortMonthLabel(month: string): string {
  const d = month.slice(0, 7);
  return d.replace("-", "/");
}

export function buildMonthlyTrendOption(
  rows: Array<{
    month: string;
    order_count?: number;
    total_sales?: number;
    active_users?: number;
  }>,
): EChartsOption {
  const months = rows.map((r) => shortMonthLabel(r.month));
  return {
    color: CHART_COLORS,
    tooltip: { trigger: "axis" },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 48, right: 24, top: 32, bottom: 48 },
    xAxis: { type: "category", data: months, axisLabel: { rotate: 35, fontSize: 10 } },
    yAxis: [
      { type: "value", name: "销售额", axisLabel: { fontSize: 10 } },
      { type: "value", name: "订单", axisLabel: { fontSize: 10 } },
    ],
    series: [
      {
        name: "销售额",
        type: "line",
        smooth: true,
        yAxisIndex: 0,
        data: rows.map((r) => r.total_sales ?? 0),
        areaStyle: { opacity: 0.08 },
      },
      {
        name: "订单量",
        type: "bar",
        yAxisIndex: 1,
        data: rows.map((r) => r.order_count ?? 0),
        barMaxWidth: 20,
      },
    ],
  };
}

export function buildRegionalSalesOption(
  rows: Array<{
    region: string;
    total_sales?: number;
    order_count?: number;
  }>,
): EChartsOption {
  const sorted = [...rows].sort(
    (a, b) => (b.total_sales ?? 0) - (a.total_sales ?? 0),
  );
  return {
    color: [CHART_COLORS[0]],
    tooltip: { trigger: "axis" },
    grid: { left: 56, right: 24, top: 24, bottom: 32 },
    xAxis: {
      type: "category",
      data: sorted.map((r) => r.region),
      axisLabel: { fontSize: 11 },
    },
    yAxis: { type: "value", name: "销售额", axisLabel: { fontSize: 10 } },
    series: [
      {
        type: "bar",
        data: sorted.map((r) => r.total_sales ?? 0),
        barMaxWidth: 36,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
    ],
  };
}

export function buildReturnReasonsOption(
  rows: Array<{
    return_reason: string;
    return_count?: number;
    total_refund?: number;
  }>,
): EChartsOption {
  return {
    color: CHART_COLORS,
    tooltip: { trigger: "item", formatter: "{b}: {c} 次 ({d}%)" },
    legend: { orient: "vertical", right: 8, top: "center", textStyle: { fontSize: 10 } },
    series: [
      {
        type: "pie",
        radius: ["42%", "68%"],
        center: ["38%", "50%"],
        data: rows.map((r) => ({
          name: r.return_reason,
          value: r.return_count ?? 0,
        })),
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 11 },
        },
      },
    ],
  };
}

export type { EChartsOption };
