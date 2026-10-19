export type UserRole = "student" | "staff" | "admin";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt?: string;
}

export interface Source {
  document_id: string;
  title: string;
  page?: number | null;
}

export interface ChatMessage {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  grounded?: boolean | null;
  query_type?: "GREETING" | "DOCUMENT" | "UNSUPPORTED" | null;
  created_at?: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface CampusDocument {
  document_id: string;
  title: string;
  original_filename: string;
  document_type: string;
  department: string | null;
  semester: number | null;
  visibility: "PUBLIC" | "PRIVATE";
  ingest_status: "pending" | "processing" | "ready" | "failed";
  chunks_count: number;
  tags: string[];
  has_file: boolean;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}
