export function formatCurrency(value: number): string {
  return `¥${value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercent(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}

export function formatInteger(value: number): string {
  return value.toLocaleString("zh-CN");
}

export const DASHBOARD_KPI_LABELS: Record<string, string> = {
  gmv_30d: "GMV（近30天）",
  orders_30d: "订单量（近30天）",
  aov_30d: "客单价（近30天）",
  return_rate_30d: "退货率（近30天）",
};

export const OVERVIEW_12M_LABELS: Record<string, string> = {
  order_count: "订单量",
  total_sales: "总销售额",
  avg_order_value: "客单价",
  active_users: "活跃用户",
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  return undefined;
}
