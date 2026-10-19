import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "../api";
import type { CampusDocument, User } from "../types";

interface Props {
  user: User;
  onError: (message: string) => void;
}

const statusLabel: Record<CampusDocument["ingest_status"], string> = {
  ready: "Indexed",
  pending: "Queued",
  processing: "Indexing",
  failed: "Failed"
};

export default function DocumentsPanel({ user, onError }: Props) {
  const [documents, setDocuments] = useState<CampusDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("NOTICE");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canUpload = user.role === "admin" || user.role === "staff";

  async function refresh() {
    setLoading(true);
    try {
      const result = await api.listDocuments();
      setDocuments(result.documents);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not load documents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    onError("");
    if (!file) {
      onError("Choose a PDF or DOCX file.");
      return;
    }
    setUploading(true);
    try {
      const data = new FormData();
      data.set("file", file);
      data.set("title", title.trim() || file.name.replace(/\.[^.]+$/, ""));
      data.set("documentType", documentType);
      data.set("visibility", visibility);
      data.set("tags", tags);
      const result = await api.uploadDocument(data);
      setDocuments((current) => [result.document, ...current]);
      setTitle("");
      setTags("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (error) {
      onError(error instanceof Error ? error.message : "Document upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function reindex(documentId: string) {
    try {
      const result = await api.reindexDocument(documentId);
      setDocuments((current) => current.map((doc) => doc.document_id === documentId ? result.document : doc));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Reindexing failed.");
    }
  }

  async function remove(document: CampusDocument) {
    if (!window.confirm(`Delete "${document.title}" and its indexed chunks?`)) return;
    try {
      await api.deleteDocument(document.document_id);
      setDocuments((current) => current.filter((item) => item.document_id !== document.document_id));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Document deletion failed.");
    }
  }

  return (
    <section className="documents-view">
      <header className="topbar">
        <div>
          <div className="topbar-title">Campus documents</div>
          <div className="topbar-subtitle">The files available to your account for retrieval</div>
        </div>
        <div className="document-total"><strong>{documents.length}</strong><span>documents</span></div>
      </header>

      <div className="documents-content">
        {canUpload && (
          <form className="upload-card" onSubmit={submit}>
            <div className="upload-heading">
              <div className="upload-icon">＋</div>
              <div><h2>Add a document</h2><p>Upload a PDF or DOCX to extract, chunk and index it for CampusGPT.</p></div>
            </div>
            <div className="upload-grid">
              <label className="field">
                <span>Document title</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="e.g. Semester exam notice" />
              </label>
              <label className="field">
                <span>Document type</span>
                <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
                  <option value="NOTICE">Notice</option>
                  <option value="EVENT_NOTICE">Event notice</option>
                  <option value="HOLIDAY_NOTICE">Holiday notice</option>
                  <option value="SYLLABUS">Syllabus</option>
                  <option value="TIMETABLE">Timetable</option>
                  <option value="GENERAL">General</option>
                </select>
              </label>
              {user.role === "admin" && (
                <label className="field">
                  <span>Visibility</span>
                  <select value={visibility} onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "PRIVATE")}>
                    <option value="PRIVATE">Private</option>
                    <option value="PUBLIC">Public to signed-in users</option>
                  </select>
                </label>
              )}
              <label className="field">
                <span>Tags <small>(comma-separated)</small></span>
                <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="notice, semester, department" />
              </label>
            </div>
            <div className="upload-actions">
              <label className="file-input-label">
                <input ref={fileRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <span className="file-picker">Choose file</span>
                <span className="file-name">{file?.name || "PDF or DOCX · Maximum 20 MB"}</span>
              </label>
              <button className="button button-primary" type="submit" disabled={uploading || !file}>{uploading ? "Indexing…" : "Upload and index"} <span>→</span></button>
            </div>
            <p className="tiny muted upload-note">Your upload is sent to the private backend and indexed by the existing CampusGPT AI service.</p>
          </form>
        )}

        <div className="documents-list-card">
          <div className="list-card-heading"><div><h2>Available documents</h2><p>Only documents visible to your account are shown.</p></div><button className="button button-subtle" onClick={() => void refresh()} disabled={loading}>{loading ? "Loading…" : "Refresh ↻"}</button></div>
          {loading ? <div className="empty-state">Loading documents…</div> : documents.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">▤</div><h3>No documents available yet</h3><p>Ask an administrator to publish documents or grant you access.</p></div>
          ) : (
            <div className="document-list">
              {documents.map((doc) => (
                <article className="document-row" key={doc.document_id}>
                  <div className="document-file-icon">PDF</div>
                  <div className="document-info">
                    <strong>{doc.title}</strong>
                    <span>{doc.original_filename}</span>
                    <div className="document-tags"><span>{doc.document_type.replaceAll("_", " ")}</span><span>{doc.visibility.toLowerCase()}</span><span>{doc.chunks_count} chunks</span></div>
                  </div>
                  <div className={`document-status status-${doc.ingest_status}`}><span />{statusLabel[doc.ingest_status]}</div>
                  <div className="document-actions">
                    {doc.ingest_status === "failed" && canUpload && doc.has_file && <button className="icon-button" title="Retry indexing" onClick={() => void reindex(doc.document_id)}>↻</button>}
                    {(user.role === "admin" || doc.owner_user_id === user.id) && <button className="icon-button danger-action" title="Delete document" onClick={() => void remove(doc)}>×</button>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        <p className="tiny muted documents-disclaimer">Answers can only use content the backend authorizes for your account. Indexed chunks are managed by the AI service.</p>
      </div>
    </section>
  );
}
