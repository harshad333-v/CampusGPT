CREATE SCHEMA IF NOT EXISTS campus_app;

CREATE TABLE IF NOT EXISTS campus_app.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'staff', 'admin')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS campus_app_users_email_lower_idx ON campus_app.users (lower(email));

CREATE TABLE IF NOT EXISTS campus_app.documents (
  document_id text PRIMARY KEY,
  owner_user_id uuid NULL REFERENCES campus_app.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  original_filename text NOT NULL,
  storage_path text NULL,
  document_type text NOT NULL DEFAULT 'GENERAL',
  department text NULL,
  semester integer NULL CHECK (semester IS NULL OR semester >= 1),
  visibility text NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PUBLIC', 'PRIVATE')),
  ingest_status text NOT NULL DEFAULT 'pending' CHECK (ingest_status IN ('pending', 'processing', 'ready', 'failed')),
  chunks_count integer NOT NULL DEFAULT 0 CHECK (chunks_count >= 0),
  tags text[] NOT NULL DEFAULT '{}',
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS campus_app_documents_visibility_status_idx ON campus_app.documents (visibility, ingest_status);
CREATE INDEX IF NOT EXISTS campus_app_documents_owner_idx ON campus_app.documents (owner_user_id);
CREATE INDEX IF NOT EXISTS campus_app_documents_type_idx ON campus_app.documents (document_type);

CREATE TABLE IF NOT EXISTS campus_app.document_access (
  document_id text NOT NULL REFERENCES campus_app.documents(document_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES campus_app.users(id) ON DELETE CASCADE,
  granted_by uuid NULL REFERENCES campus_app.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (document_id, user_id)
);
CREATE INDEX IF NOT EXISTS campus_app_document_access_user_idx ON campus_app.document_access (user_id);

CREATE TABLE IF NOT EXISTS campus_app.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES campus_app.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS campus_app_conversations_user_updated_idx ON campus_app.conversations (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS campus_app.messages (
  id bigserial PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES campus_app.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  grounded boolean NULL,
  query_type text NULL CHECK (query_type IS NULL OR query_type IN ('GREETING', 'DOCUMENT', 'UNSUPPORTED')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS campus_app_messages_conversation_created_idx ON campus_app.messages (conversation_id, created_at);
