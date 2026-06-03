import type { AnalyticsQueryResponse } from "@/types/analytics";
import {
  hasVisualOutput,
  isPlainTextStreamDelta,
  isVisualIntent,
} from "@/lib/analytics-response-utils";

export type AnalyticsStreamChunk =
  | { kind: "delta"; text: string }
  /** 进度/状态（替换显示，不拼接） */
  | { kind: "progress"; text: string }
  | { kind: "result"; data: AnalyticsQueryResponse }
  | { kind: "error"; message: string }
  | { kind: "done" };

function unwrapResultPayload(
  json: Record<string, unknown>,
): AnalyticsQueryResponse | null {
  if (json.success === true && json.data && typeof json.data === "object") {
    return json.data as AnalyticsQueryResponse;
  }
  if (isFullAnalyticsPayload(json)) {
    return json as AnalyticsQueryResponse;
  }
  const nested = json.data;
  if (nested && typeof nested === "object" && isFullAnalyticsPayload(nested as Record<string, unknown>)) {
    return nested as AnalyticsQueryResponse;
  }
  return null;
}

function isFullAnalyticsPayload(obj: Record<string, unknown>): boolean {
  return (
    hasVisualOutput(obj as AnalyticsQueryResponse) ||
    isVisualIntent(String(obj.intent ?? "")) ||
    "workflowStatus" in obj ||
    ("humanCheckpoint" in obj && obj.humanCheckpoint != null)
  );
}

function isProgressPayload(
  json: Record<string, unknown>,
  eventType: string,
  text: string,
): boolean {
  const t = eventType.toLowerCase();
  if (
    t === "status" ||
    t === "progress" ||
    t === "stage" ||
    t === "thinking" ||
    t === "planning"
  ) {
    return true;
  }
  if (json.status === true || json.progress === true) return true;
  const trimmed = text.trim();
  if (!trimmed) return false;
  return (
    /^正在/.test(trimmed) ||
    /^规划/.test(trimmed) ||
    /查询.*大盘/.test(trimmed) ||
    (trimmed.length <= 64 && trimmed.endsWith("..."))
  );
}

/** 解析 SSE data 行：进度替换、纯文本追加、结果一次性返回 */
export function parseAnalyticsStreamChunk(
  data: string,
  eventName?: string,
): AnalyticsStreamChunk {
  const trimmed = data.trim();
  if (!trimmed) return { kind: "done" };

  if (trimmed === "[DONE]") {
    return { kind: "done" };
  }

  if (eventName === "error") {
    return { kind: "error", message: trimmed };
  }

  // 带 event 名的结果 / 完成（complete 可能携带最终 JSON，不能当空 done）
  if (
    eventName === "result" ||
    eventName === "chart" ||
    eventName === "dashboard" ||
    eventName === "complete-result" ||
    eventName === "complete" ||
    eventName === "done" ||
    eventName === "end"
  ) {
    try {
      const json = JSON.parse(trimmed) as Record<string, unknown>;
      const payload = unwrapResultPayload(json);
      if (payload) {
        return { kind: "result", data: payload };
      }
      const eventType = String(json.type ?? json.event ?? "").toLowerCase();
      const msg = String(json.message ?? json.content ?? json.text ?? "");
      if (isProgressPayload(json, eventType, msg)) {
        return { kind: "progress", text: msg };
      }
    } catch {
      if (eventName === "complete" || eventName === "done" || eventName === "end") {
        return { kind: "done" };
      }
      if (isPlainTextStreamDelta(trimmed)) {
        return { kind: "delta", text: trimmed };
      }
    }
    if (eventName === "complete" || eventName === "done" || eventName === "end") {
      return { kind: "done" };
    }
  }

  try {
    const json = JSON.parse(trimmed) as Record<string, unknown>;

    if (json.success === false) {
      return {
        kind: "error",
        message: String(json.message ?? json.errorMessage ?? "请求失败"),
      };
    }

    const payload = unwrapResultPayload(json);
    if (payload) {
      return { kind: "result", data: payload };
    }

    const eventType = String(json.type ?? json.event ?? eventName ?? "").toLowerCase();
    if (eventType === "error") {
      return {
        kind: "error",
        message: String(json.message ?? json.errorMessage ?? "流式错误"),
      };
    }

    const textCandidate = String(
      json.content ?? json.delta ?? json.text ?? json.token ?? json.message ?? "",
    );

    if (isProgressPayload(json, eventType, textCandidate)) {
      return { kind: "progress", text: textCandidate };
    }

    if (eventType === "done") {
      return { kind: "done" };
    }

    if (eventType === "complete" || eventType === "end") {
      const nested = unwrapResultPayload(json);
      if (nested) return { kind: "result", data: nested };
      return { kind: "done" };
    }

    const isTokenEvent =
      eventType === "token" ||
      eventType === "delta" ||
      eventType === "message" ||
      json.partial === true;

    if (typeof textCandidate === "string" && textCandidate.length > 0) {
      if (!isTokenEvent && Object.keys(json).length > 2) {
        return { kind: "done" };
      }
      if (!isPlainTextStreamDelta(textCandidate)) {
        return { kind: "done" };
      }
      return { kind: "delta", text: textCandidate };
    }
  } catch {
    if (!isPlainTextStreamDelta(data)) {
      return { kind: "done" };
    }
    const plain = data.trim();
    if (/^正在|^规划/.test(plain) || (plain.length <= 64 && plain.endsWith("..."))) {
      return { kind: "progress", text: plain };
    }
    return { kind: "delta", text: data };
  }

  return { kind: "done" };
}
