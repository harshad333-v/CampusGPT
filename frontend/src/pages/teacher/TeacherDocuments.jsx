import { useEffect, useMemo, useState } from "react";

import TeacherSidebar from "../../components/TeacherSidebar";
import { getDocuments } from "../../api/documents";
import { API_BASE_URL } from "../../api/client";

const DOCUMENT_TYPES = [
  { value: "SYLLABUS", label: "Syllabus" },
  { value: "QUESTION_PAPER", label: "Question Paper" },
  { value: "QUESTION_BANK", label: "Question Bank" },
  { value: "COURSE_MATERIAL", label: "Course Material" },
  { value: "LAB_MANUAL", label: "Lab Manual" },
  { value: "ASSIGNMENT", label: "Assignment" },
  { value: "TIMETABLE", label: "Timetable" },
  { value: "ACADEMIC_CALENDAR", label: "Academic Calendar" },
  { value: "EXAM_SCHEDULE", label: "Exam Schedule" },
  { value: "NOTICE", label: "Notice" },
  { value: "CIRCULAR", label: "Circular" },
  { value: "POLICY", label: "Policy" },
  { value: "REGULATION", label: "Regulation" },
  { value: "FORM", label: "Form" },
  { value: "HOSTEL", label: "Hostel" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "LIBRARY", label: "Library" },
  { value: "SCHOLARSHIP", label: "Scholarship" },
  { value: "PLACEMENT", label: "Placement" },
  { value: "FEE_STRUCTURE", label: "Fee Structure" },
  { value: "ADMISSION", label: "Admission" },
  { value: "EVENT", label: "Event" },
  { value: "CLUB", label: "Club" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "OTHER", label: "Other" },
];

const initialUploadForm = {
  title: "",
  description: "",
  documentType: "COURSE_MATERIAL",
  department: "",
  semester: "",
  visibility: "PUBLIC",
  tags: "",
};

const initialEditForm = {
  title: "",
  description: "",
  documentType: "COURSE_MATERIAL",
  department: "",
  semester: "",
  visibility: "PUBLIC",
  tags: "",
};

function getAuthHeaders(includeContentType = true) {
  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

function getCurrentUserId() {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    const user = JSON.parse(storedUser);

    return user?.id || user?._id || null;
  } catch {
    return null;
  }
}

function getDocumentTypeLabel(type) {
  const found = DOCUMENT_TYPES.find(
    (documentType) => documentType.value === type
  );

  if (found) {
    return found.label;
  }

  return type
    ? type
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Other";
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) {
    return "—";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TeacherDocuments() {
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState(initialUploadForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [updating, setUpdating] = useState(false);

  const [viewingDocument, setViewingDocument] = useState(null);

  async function loadDocuments() {
    try {
      setLoading(true);
      setError("");

      const response = await getDocuments();

      if (!response.success) {
        throw new Error(
          response.message || "Failed to load documents."
        );
      }

      const allDocuments = response.data || [];
      const currentUserId = getCurrentUserId();

      /*
       * The backend GET /documents endpoint returns:
       * - PUBLIC documents
       * - TEACHER_ONLY documents
       *
       * It does NOT return only documents uploaded by the
       * current teacher.
       *
       * Since this page is "My Documents", filter by uploadedBy.
       */
      const myDocuments = currentUserId
        ? allDocuments.filter((document) => {
            const uploadedById =
              document.uploadedBy?._id ||
              document.uploadedBy?.id ||
              document.uploadedBy;

            return String(uploadedById) === String(currentUserId);
          })
        : [];

      setDocuments(myDocuments);
    } catch (err) {
      setError(
        err.message || "Failed to load documents."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadDepartments() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/departments`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load departments."
        );
      }

      setDepartments(data.data || []);
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  }

  useEffect(() => {
    loadDocuments();
    loadDepartments();
  }, []);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesSearch =
        !query ||
        document.title?.toLowerCase().includes(query) ||
        document.description?.toLowerCase().includes(query) ||
        document.originalFileName
          ?.toLowerCase()
          .includes(query) ||
        document.tags?.some((tag) =>
          tag.toLowerCase().includes(query)
        );

      const matchesType =
        !typeFilter ||
        document.documentType === typeFilter;

      const matchesVisibility =
        !visibilityFilter ||
        document.visibility === visibilityFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesVisibility
      );
    });
  }, [
    documents,
    search,
    typeFilter,
    visibilityFilter,
  ]);

  function handleUploadFormChange(event) {
    const { name, value } = event.target;

    setUploadForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleEditFormChange(event) {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
    ];

    const fileName = file.name.toLowerCase();

    const isAllowed = allowedExtensions.some(
      (extension) => fileName.endsWith(extension)
    );

    if (!isAllowed) {
      setSelectedFile(null);
      setError(
        "Only PDF, DOC, DOCX, PPT and PPTX files are allowed."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setSelectedFile(null);
      setError(
        "File size must be 20 MB or less."
      );

      event.target.value = "";
      return;
    }

    setError("");
    setSelectedFile(file);
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please select a document file.");
      return;
    }

    if (!uploadForm.title.trim()) {
      setError("Document title is required.");
      return;
    }

    if (!uploadForm.department) {
      setError("Please select a department.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccessMessage("");

      const token = localStorage.getItem("token");

      const formData = new FormData();

      formData.append(
        "title",
        uploadForm.title.trim()
      );

      formData.append(
        "description",
        uploadForm.description.trim()
      );

      formData.append(
        "documentType",
        uploadForm.documentType
      );

      formData.append(
        "department",
        uploadForm.department
      );

      if (uploadForm.semester) {
        formData.append(
          "semester",
          uploadForm.semester
        );
      }

      formData.append(
        "visibility",
        uploadForm.visibility
      );

      const tags = uploadForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      tags.forEach((tag) => {
        formData.append("tags", tag);
      });

      formData.append("file", selectedFile);

      const response = await fetch(
        `${API_BASE_URL}/documents`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to upload document."
        );
      }

      setSuccessMessage(
        data.message ||
          "Document uploaded successfully."
      );

      setShowUploadModal(false);
      setUploadForm(initialUploadForm);
      setSelectedFile(null);

      await loadDocuments();
    } catch (err) {
      setError(
        err.message || "Failed to upload document."
      );
    } finally {
      setUploading(false);
    }
  }

  function openEditModal(document) {
    setEditingDocument(document);

    setEditForm({
      title: document.title || "",
      description: document.description || "",
      documentType:
        document.documentType || "COURSE_MATERIAL",
      department:
        document.department?._id ||
        document.department?.id ||
        document.department ||
        "",
      semester:
        document.semester !== null &&
        document.semester !== undefined
          ? String(document.semester)
          : "",
      visibility:
        document.visibility || "PUBLIC",
      tags: Array.isArray(document.tags)
        ? document.tags.join(", ")
        : "",
    });

    setShowEditModal(true);
    setError("");
    setSuccessMessage("");
  }

  async function handleUpdate(event) {
    event.preventDefault();

    if (!editingDocument) {
      return;
    }

    if (!editForm.title.trim()) {
      setError("Document title is required.");
      return;
    }

    if (!editForm.department) {
      setError("Please select a department.");
      return;
    }

    try {
      setUpdating(true);
      setError("");
      setSuccessMessage("");

      const tags = editForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        documentType: editForm.documentType,
        department: editForm.department,
        semester: editForm.semester
          ? Number(editForm.semester)
          : null,
        visibility: editForm.visibility,
        tags,
      };

      const response = await fetch(
        `${API_BASE_URL}/documents/${editingDocument._id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update document."
        );
      }

      setSuccessMessage(
        data.message ||
          "Document updated successfully."
      );

      setShowEditModal(false);
      setEditingDocument(null);

      await loadDocuments();
    } catch (err) {
      setError(
        err.message || "Failed to update document."
      );
    } finally {
      setUpdating(false);
    }
  }

  async function handleDownload(doc) {
  try {
    setError("");

    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_BASE_URL}/documents/download/${doc._id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      let message = "Failed to download document.";

      try {
        const data = await response.json();
        message = data.message || message;
      } catch {
        // Ignore JSON parsing errors.
      }

      throw new Error(message);
    }

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const anchor = window.document.createElement("a");

    anchor.href = url;
    anchor.download =
      doc.originalFileName ||
      doc.title ||
      "document";

    window.document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    setError(
      err.message || "Failed to download document."
    );
  }
}
  async function handleView(doc) {
  try {
    setError("");

    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_BASE_URL}/documents/download/${doc._id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      let message = "Failed to open document.";

      try {
        const data = await response.json();
        message = data.message || message;
      } catch {
        // Ignore JSON parsing errors.
      }

      throw new Error(message);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    window.open(url, "_blank");

    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 60000);
  } catch (err) {
    setError(
      err.message || "Failed to open document."
    );
  }
}
  function closeUploadModal() {
    if (uploading) {
      return;
    }

    setShowUploadModal(false);
    setUploadForm(initialUploadForm);
    setSelectedFile(null);
  }

  function closeEditModal() {
    if (updating) {
      return;
    }

    setShowEditModal(false);
    setEditingDocument(null);
  }

  function getVisibilityLabel(visibility) {
    if (visibility === "TEACHER_ONLY") {
      return "Teachers Only";
    }

    if (visibility === "ADMIN_ONLY") {
      return "Admin Only";
    }

    return "Public";
  }

  function getDepartmentName(department) {
    if (!department) {
      return "—";
    }

    if (typeof department === "object") {
      return (
        department.name ||
        department.code ||
        "—"
      );
    }

    return String(department);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b10]">
      <TeacherSidebar />

      <main className="pt-24 lg:pt-8 lg:ml-64 min-h-screen p-4 sm:p-8">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              My Documents
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              View and manage your uploaded documents.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowUploadModal(true);
              setError("");
              setSuccessMessage("");
            }}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            + Upload Document
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-semibold"
            >
              ×
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <span>{successMessage}</span>

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="font-semibold"
            >
              ×
            </button>
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search documents..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Document Type
              </label>

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white"
              >
                <option value="">
                  All Types
                </option>

                {DOCUMENT_TYPES.map((type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Visibility
              </label>

              <select
                value={visibilityFilter}
                onChange={(event) =>
                  setVisibilityFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white"
              >
                <option value="">
                  All Visibility
                </option>

                <option value="PUBLIC">
                  Public
                </option>

                <option value="TEACHER_ONLY">
                  Teachers Only
                </option>
              </select>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-white/10 dark:border-t-blue-500" />

              <p className="text-slate-600 dark:text-slate-400">
                Loading your documents...
              </p>
            </div>
          </div>
        )}

        {!loading && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {filteredDocuments.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {documents.length}
                </span>{" "}
                documents
              </p>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl dark:bg-white/[0.06]">
                  📚
                </div>

                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {documents.length === 0
                    ? "No documents found"
                    : "No matching documents"}
                </h2>

                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  {documents.length === 0
                    ? "You have not uploaded any documents yet."
                    : "Try changing your search or filters."}
                </p>

                {documents.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(true);
                      setError("");
                      setSuccessMessage("");
                    }}
                    className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    Upload Your First Document
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0d1017]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px]">
                    <thead className="border-b border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Document
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Type
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Department
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Visibility
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Uploaded
                        </th>

                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredDocuments.map(
                        (document) => (
                          <tr
                            key={document._id}
                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 dark:border-white/[0.04] dark:hover:bg-white/[0.02]"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg dark:bg-white/[0.06]">
                                  📄
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900 dark:text-white">
                                    {document.title ||
                                      "Untitled Document"}
                                  </p>

                                  <p className="mt-1 max-w-[260px] truncate text-xs text-slate-500 dark:text-slate-400">
                                    {document.originalFileName ||
                                      "No file name"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                              {getDocumentTypeLabel(
                                document.documentType
                              )}
                            </td>

                            <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                              {getDepartmentName(
                                document.department
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  document.visibility ===
                                  "TEACHER_ONLY"
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                }`}
                              >
                                {getVisibilityLabel(
                                  document.visibility
                                )}
                              </span>
                            </td>

                            <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                              {formatDate(
                                document.createdAt
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleView(document)
                                  }
                                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.06]"
                                >
                                  View
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownload(
                                      document
                                    )
                                  }
                                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.06]"
                                >
                                  Download
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(
                                      document
                                    )
                                  }
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                                >
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-600/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#0d1017]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-white/[0.06]">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Upload Document
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Upload a new document to CampusGPT.
                </p>
              </div>

              <button
                type="button"
                onClick={closeUploadModal}
                className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.06]"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleUpload}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Document Title *
                </label>

                <input
                  type="text"
                  name="title"
                  value={uploadForm.title}
                  onChange={handleUploadFormChange}
                  placeholder="e.g. Data Structures Unit 1 Notes"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Description
                </label>

                <textarea
                  name="description"
                  value={uploadForm.description}
                  onChange={handleUploadFormChange}
                  rows={3}
                  placeholder="Briefly describe this document..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Document Type *
                  </label>

                  <select
                    name="documentType"
                    value={uploadForm.documentType}
                    onChange={handleUploadFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white"
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option
                        key={type.value}
                        value={type.value}
                      >
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Department *
                  </label>

                  <select
                    name="department"
                    value={uploadForm.department}
                    onChange={handleUploadFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white"
                    required
                  >
                    <option value="">
                      Select Department
                    </option>

                    {departments.map((department) => (
                      <option
                        key={department._id}
                        value={department._id}
                      >
                        {department.name}
                        {department.code
                          ? ` (${department.code})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Semester
                  </label>

                  <select
                    name="semester"
                    value={uploadForm.semester}
                    onChange={handleUploadFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white"
                  >
                    <option value="">
                      Not specified
                    </option>

                    {[1, 2, 3, 4, 5, 6, 7, 8].map(
                      (semester) => (
                        <option
                          key={semester}
                          value={semester}
                        >
                          Semester {semester}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Visibility *
                  </label>

                  <select
                    name="visibility"
                    value={uploadForm.visibility}
                    onChange={handleUploadFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white"
                  >
                    <option value="PUBLIC">
                      Public
                    </option>

                    <option value="TEACHER_ONLY">
                      Teachers Only
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Tags
                </label>

                <input
                  type="text"
                  name="tags"
                  value={uploadForm.tags}
                  onChange={handleUploadFormChange}
                  placeholder="e.g. DSA, Unit 1, Notes"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Separate tags using commas.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Document File *
                </label>

                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={handleFileChange}
                  className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:bg-slate-50 file:px-4 file:py-3 file:text-sm file:font-semibold dark:border-white/[0.08] dark:bg-[#11151d] dark:text-slate-300 dark:file:bg-white/[0.06] dark:file:text-white"
                  required
                />

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  PDF, DOC, DOCX, PPT or PPTX. Maximum
                  size: 20 MB.
                </p>

                {selectedFile && (
                  <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Selected: {selectedFile.name} (
                    {formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  disabled={uploading}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.06]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {uploading
                    ? "Uploading..."
                    : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-600/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#0d1017]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-white/[0.06]">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Edit Document
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Update document information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.06]"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleUpdate}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Document Title *
                </label>

                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditFormChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Description
                </label>

                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Document Type *
                  </label>

                  <select
                    name="documentType"
                    value={editForm.documentType}
                    onChange={handleEditFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white"
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option
                        key={type.value}
                        value={type.value}
                      >
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Department *
                  </label>

                  <select
                    name="department"
                    value={editForm.department}
                    onChange={handleEditFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white"
                    required
                  >
                    <option value="">
                      Select Department
                    </option>

                    {departments.map((department) => (
                      <option
                        key={department._id}
                        value={department._id}
                      >
                        {department.name}
                        {department.code
                          ? ` (${department.code})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Semester
                  </label>

                  <select
                    name="semester"
                    value={editForm.semester}
                    onChange={handleEditFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white"
                  >
                    <option value="">
                      Not specified
                    </option>

                    {[1, 2, 3, 4, 5, 6, 7, 8].map(
                      (semester) => (
                        <option
                          key={semester}
                          value={semester}
                        >
                          Semester {semester}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Visibility *
                  </label>

                  <select
                    name="visibility"
                    value={editForm.visibility}
                    onChange={handleEditFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white"
                  >
                    <option value="PUBLIC">
                      Public
                    </option>

                    <option value="TEACHER_ONLY">
                      Teachers Only
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Tags
                </label>

                <input
                  type="text"
                  name="tags"
                  value={editForm.tags}
                  onChange={handleEditFormChange}
                  placeholder="e.g. DSA, Unit 1, Notes"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-white/[0.08] dark:bg-[#11151d] dark:text-white"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Current File
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                  {editingDocument.originalFileName ||
                    "Unknown file"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {formatFileSize(
                    editingDocument.fileSize
                  )}
                </p>

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  File replacement is not supported by
                  the current backend. You can update
                  the document information above.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={updating}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.06]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {updating
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Info Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-600/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#0d1017]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-white/[0.06]">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Document Details
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewingDocument(null)
                }
                className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.06]"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Title
                </p>

                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {viewingDocument.title ||
                    "Untitled Document"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  File
                </p>

                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {viewingDocument.originalFileName ||
                    "—"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </p>

                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {getDocumentTypeLabel(
                      viewingDocument.documentType
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Size
                  </p>

                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {formatFileSize(
                      viewingDocument.fileSize
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Department
                  </p>

                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {getDepartmentName(
                      viewingDocument.department
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Semester
                  </p>

                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {viewingDocument.semester
                      ? `Semester ${viewingDocument.semester}`
                      : "Not specified"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </p>

                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {viewingDocument.description ||
                    "No description provided."}
                </p>
              </div>

              {viewingDocument.tags?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tags
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {viewingDocument.tags.map(
                      (tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-white/[0.06] dark:text-slate-300"
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() =>
                    handleDownload(viewingDocument)
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.06]"
                >
                  Download
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleView(viewingDocument)
                  }
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  Open File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDocuments;