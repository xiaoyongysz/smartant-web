import type { ApiResponse } from "@/types/api";
import type {
  AnalyticsQueryRequest,
  AnalyticsQueryResponse,
} from "@/types/analytics";
import { resolveApiUrl } from "@/lib/api-config";

async function parseApiResponse<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.message || body.showMessage || `请求失败 (${res.status})`);
  }
  return body.data;
}

export async function analyticsQuery(
  request: AnalyticsQueryRequest,
): Promise<AnalyticsQueryResponse> {
  const res = await fetch(resolveApiUrl("analyticsQuery"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  return parseApiResponse<AnalyticsQueryResponse>(res);
}
