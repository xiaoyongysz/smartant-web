import type { AnalyticsQueryRequest, AnalyticsQueryResponse } from "@/types/analytics";
import { resolveApiUrl } from "@/lib/api-config";
import { parseAnalyticsStreamChunk } from "@/lib/analytics-stream-chunk";
import { readSseStream } from "@/lib/sse-parser";

export interface AnalyticsStreamCallbacks {
  onDelta: (text: string) => void;
  /** 进度/状态文案（替换，不拼接） */
  onProgress?: (text: string) => void;
  onResult: (data: AnalyticsQueryResponse) => void;
  onError: (message: string) => void;
  onDone: () => void;
}

export async function analyticsQueryStream(
  request: AnalyticsQueryRequest,
  callbacks: AnalyticsStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(resolveApiUrl("analyticsQueryStream"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!res.ok) {
    let message = `流式请求失败 (${res.status})`;
    try {
      const errBody = (await res.json()) as { message?: string };
      if (errBody.message) message = errBody.message;
    } catch {
      /* 非 JSON 错误体 */
    }
    callbacks.onError(message);
    callbacks.onDone();
    return;
  }

  const contentType = res.headers.get("content-type") ?? "";
  const body = res.body;

  if (!body) {
    callbacks.onError("响应体为空");
    callbacks.onDone();
    return;
  }

  if (!contentType.includes("text/event-stream")) {
    try {
      const json = (await res.json()) as {
        success?: boolean;
        data?: AnalyticsQueryResponse;
        message?: string;
      };
      if (json.success && json.data) {
        callbacks.onResult(json.data);
      } else if (json.data) {
        callbacks.onResult(json.data);
      } else {
        callbacks.onError(json.message ?? "未知响应格式");
      }
    } catch {
      callbacks.onError("无法解析响应");
    }
    callbacks.onDone();
    return;
  }

  let gotResult = false;

  try {
    for await (const sse of readSseStream(body)) {
      const chunk = parseAnalyticsStreamChunk(sse.data, sse.event);
      switch (chunk.kind) {
        case "delta":
          callbacks.onDelta(chunk.text);
          break;
        case "progress":
          callbacks.onProgress?.(chunk.text);
          break;
        case "result":
          gotResult = true;
          callbacks.onResult(chunk.data);
          break;
        case "error":
          callbacks.onError(chunk.message);
          break;
        case "done":
          break;
      }
    }
  } catch (err) {
    if (signal?.aborted) return;
    const message = err instanceof Error ? err.message : "流式连接中断";
    callbacks.onError(message);
  } finally {
    callbacks.onDone();
  }

  if (!gotResult) {
    /* 仅文本增量、无最终 JSON 时由页面侧保留已累积 content */
  }
}
