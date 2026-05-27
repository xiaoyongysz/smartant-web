import type {
  AnswerResponse,
  ApiResponse,
  SessionChatRequest,
} from "@/types/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

async function parseApiResponse<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.message || body.showMessage || `请求失败 (${res.status})`);
  }
  return body.data;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/markdown",
  "text/plain",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".md", ".txt"];

export function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export async function uploadDocument(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(apiUrl("/api/documents/upload"), {
    method: "POST",
    body: formData,
  });

  return parseApiResponse<string>(res);
}

export async function sessionChat(
  request: SessionChatRequest,
): Promise<AnswerResponse> {
  const res = await fetch(apiUrl("/api/documents/session"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  return parseApiResponse<AnswerResponse>(res);
}
