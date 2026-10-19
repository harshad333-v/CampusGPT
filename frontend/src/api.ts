import type {
  CampusDocument,
  ChatMessage,
  Conversation,
  User
} from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

type RequestOptions = RequestInit & { json?: unknown };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  let body = options.body;

  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.json);
  } else if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body,
    credentials: "include"
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message || data?.detail || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  me: () => request<{ user: User }>("/auth/me"),
  register: (fullName: string, email: string, password: string) =>
    request<{ user: User }>("/auth/register", {
      method: "POST",
      json: { fullName, email, password }
    }),
  login: (email: string, password: string) =>
    request<{ user: User }>("/auth/login", {
      method: "POST",
      json: { email, password }
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),

  listConversations: () => request<{ conversations: Conversation[] }>("/conversations"),
  getMessages: (id: string) =>
    request<{ messages: ChatMessage[] }>(`/conversations/${encodeURIComponent(id)}/messages`),
  deleteConversation: (id: string) =>
    request<void>(`/conversations/${encodeURIComponent(id)}`, { method: "DELETE" }),

  chat: (message: string, conversationId?: string | null) =>
    request<{
      conversationId: string;
      answer: string;
      sources: ChatMessage["sources"];
      query_type: ChatMessage["query_type"];
      grounded: boolean;
      messageId: string | number;
      createdAt: string;
    }>("/chat", {
      method: "POST",
      json: { message, conversationId: conversationId || undefined }
    }),

  listDocuments: () => request<{ documents: CampusDocument[] }>("/documents"),
  uploadDocument: (formData: FormData) =>
    request<{ document: CampusDocument }>("/documents/upload", {
      method: "POST",
      body: formData
    }),
  reindexDocument: (id: string) =>
    request<{ document: CampusDocument }>(`/documents/${encodeURIComponent(id)}/reindex`, {
      method: "POST"
    }),
  deleteDocument: (id: string) =>
    request<{ success: boolean; document_id: string }>(`/documents/${encodeURIComponent(id)}`, {
      method: "DELETE"
    }),
  listUsers: () => request<{ users: Array<User & { isActive: boolean }> }>("/users"),
  updateUserRole: (id: string, role: "student" | "staff") =>
    request<{ user: User & { isActive: boolean } }>(`/users/${encodeURIComponent(id)}/role`, {
      method: "PATCH",
      json: { role }
    })
};
