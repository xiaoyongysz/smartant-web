/**
 * 下游 API 统一配置（唯一改端口/域名的地方）
 *
 * 开发推荐：
 *   BACKEND_URL=http://localhost:8080
 *   NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
 * 浏览器请求将直连 8080；若未设置 NEXT_PUBLIC_BACKEND_URL，则走同源 + next.config 代理。
 */

/** 服务端 rewrite 使用的下游地址（next.config.ts 读取 process.env.BACKEND_URL） */
export const BACKEND_URL =
  process.env.BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

/** 浏览器直连下游时使用的地址，应与 BACKEND_URL 保持一致 */
export const PUBLIC_BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  BACKEND_URL;

/** 与 Java DocumentApi @RequestMapping("/api/documents") 对齐 */
export const DOCUMENTS_API_PREFIX = "/api/documents";
export const RAGAPI_API_PREFIX = "/smartant/ragApi";


/** 所有下游接口路径（禁止在业务代码里硬编码其它前缀） */
export const API_ENDPOINTS = {
  upload: `${DOCUMENTS_API_PREFIX}/upload`,
  session: `${RAGAPI_API_PREFIX}/session`,
} as const;

export type ApiEndpointKey = keyof typeof API_ENDPOINTS;

/**
 * 生成完整请求 URL。
 * 默认使用 PUBLIC_BACKEND_URL（8080），保证上传与会话等同源下游。
 */
export function resolveApiUrl(endpoint: ApiEndpointKey): string {
  const path = API_ENDPOINTS[endpoint];
  const base = PUBLIC_BACKEND_URL.replace(/\/$/, "");
  if (base) {
    return `${base}${path}`;
  }
  return path;
}
