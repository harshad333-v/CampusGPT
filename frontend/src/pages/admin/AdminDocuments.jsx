import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
} from "../../api/documents";
import { getDepartments } from "../../api/departments";

const DOCUMENT_TYPES = [
  "SYLLABUS",
  "QUESTION_PAPER",
  "QUESTION_BANK",
  "COURSE_MATERIAL",
  "LAB_MANUAL",
  "ASSIGNMENT",
  "TIMETABLE",
  "ACADEMIC_CALENDAR",
  "EXAM_SCHEDULE",
  "NOTICE",
  "CIRCULAR",
  "POLICY",
  "REGULATION",
  "FORM",
  "HOSTEL",
  "TRANSPORT",
  "LIBRARY",
  "SCHOLARSHIP",
  "PLACEMENT",
  "FEE_STRUCTURE",
  "ADMISSION",
  "EVENT",
  "CLUB",
  "WORKSHOP",
  "OTHER",
];

const VISIBILITIES = ["PUBLIC", "TEACHER_ONLY", "ADMIN_ONLY"];

const INITIAL_FORM = {
  title: "",
  description: "",
  documentType: "COURSE_MATERIAL",
  department: "",
  semester: "",
  visibility: "PUBLIC",
  tags: "",
};

function formatLabel(value = "") {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFileSize(bytes) {
  if (!bytes) return "—";

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileExtension(fileName = "") {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
}

function getVisibilityClasses(visibility) {
  if (visibility === "PUBLIC") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (visibility === "TEACHER_ONLY") {
    return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
  }

  return "bg-purple-50 text-purple-700 ring-1 ring-purple-200";
}

function getTypeClasses(type) {
  if (type === "SYLLABUS" || type === "ACADEMIC_CALENDAR") {
    return "bg-amber-50 text-amber-700";
  }

  if (type === "QUESTION_PAPER" || type === "QUESTION_BANK") {
    return "bg-rose-50 text-rose-700";
  }

  if (type === "ASSIGNMENT" || type === "LAB_MANUAL") {
    return "bg-cyan-50 text-cyan-700";
  }

  return "bg-slate-100 text-slate-700";
}

function DocumentIcon({ className = "w-6 h-6" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 2v6h6M8 13h8M8 17h6"
      />
    </svg>
  );
}

function SearchIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path  d="m20 20-4-4" />
    </svg>
  );
}


function PlusIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EyeIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
      />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function DownloadIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" d="M12 3v12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m7 10 5 5 5-5" />
      <path strokeLinecap="round" d="M5 21h14" />
    </svg>
  );
}

function EditIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20h9"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z"
      />
    </svg>
  );
}

function TrashIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h16M10 11v6M14 11v6"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 7l1 14h10l1-14M9 7V4h6v3"
      />
    </svg>
  );
}

function CloseIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function AlertIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v4M12 17h.01"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m10.3 3.8-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.2l-8-14a2 2 0 0 0-3.4 0Z"
      />
    </svg>
  );
}

function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState(null);

  const [viewLoading, setViewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getDocuments();

      setDocuments(response?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      setDepartmentsLoading(true);

      const response = await getDepartments();

      setDepartments(response?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load departments.");
    } finally {
      setDepartmentsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  const filteredDocuments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return documents.filter((doc) => {
      const departmentName =
        doc.department?.name ||
        doc.department?.code ||
        "";

      const uploaderName =
        doc.uploadedBy?.name ||
        doc.uploadedBy?.email ||
        "";

      const fileName =
        doc.originalFileName ||
        doc.fileName ||
        "";

      const tags = Array.isArray(doc.tags)
        ? doc.tags.join(" ")
        : "";

      const searchableText = [
        doc.title,
        doc.description,
        doc.documentType,
        departmentName,
        uploaderName,
        fileName,
        tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesType =
        !typeFilter || doc.documentType === typeFilter;

      const matchesDepartment =
        !departmentFilter ||
        doc.department?._id === departmentFilter;

      const matchesVisibility =
        !visibilityFilter ||
        doc.visibility === visibilityFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesDepartment &&
        matchesVisibility
      );
    });
  }, [
    documents,
    searchTerm,
    typeFilter,
    departmentFilter,
    visibilityFilter,
  ]);

  const activeFilterCount = [
    typeFilter,
    departmentFilter,
    visibilityFilter,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setDepartmentFilter("");
    setVisibilityFilter("");
  };

  const openUploadModal = () => {
    setForm({
      ...INITIAL_FORM,
      department: departments[0]?._id || "",
    });
    setSelectedFile(null);
    setError("");
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    if (actionLoading) return;

    setShowUploadModal(false);
    setForm(INITIAL_FORM);
    setSelectedFile(null);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedExtensions = [
      "pdf",
      "doc",
      "docx",
      "ppt",
      "pptx",
    ];

    const extension = file.name
      .split(".")
      .pop()
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setError(
        "Invalid file type. Only PDF, DOC, DOCX, PPT and PPTX files are allowed."
      );
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("File size cannot exceed 20 MB.");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  };

  const validateForm = (isUpload = true) => {
    if (!form.title.trim()) {
      setError("Document title is required.");
      return false;
    }

    if (!form.documentType) {
      setError("Document type is required.");
      return false;
    }

    if (!form.department) {
      setError("Department is required.");
      return false;
    }

    if (!form.visibility) {
      setError("Visibility is required.");
      return false;
    }

    if (form.semester) {
      const semester = Number(form.semester);

      if (
        !Number.isInteger(semester) ||
        semester < 1 ||
        semester > 12
      ) {
        setError("Semester must be a valid number between 1 and 12.");
        return false;
      }
    }

    if (isUpload && !selectedFile) {
      setError("Please select a document file.");
      return false;
    }

    return true;
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm(true)) return;

    try {
      setActionLoading(true);

      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      await createDocument(
        {
          title: form.title.trim(),
          description: form.description.trim(),
          documentType: form.documentType,
          department: form.department,
          semester: form.semester
            ? Number(form.semester)
            : null,
          visibility: form.visibility,
          tags,
        },
        selectedFile
      );

      setSuccess("Document uploaded successfully.");
      setShowUploadModal(false);
      setForm(INITIAL_FORM);
      setSelectedFile(null);

      await fetchDocuments();
    } catch (err) {
      setError(err.message || "Failed to upload document.");
    } finally {
      setActionLoading(false);
    }
  };

  const openViewModal = async (doc) => {
    setSelectedDocument(doc);
    setShowViewModal(true);
    setViewLoading(true);
    setError("");

    try {
      const response = await getDocumentById(doc._id);
      setSelectedDocument(response?.data || doc);
    } catch (err) {
      setError(err.message || "Failed to load document details.");
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    if (viewLoading) return;

    setShowViewModal(false);
    setSelectedDocument(null);
  };

  const openEditModal = (doc) => {
    setSelectedDocument(doc);

    setForm({
      title: doc.title || "",
      description: doc.description || "",
      documentType: doc.documentType || "COURSE_MATERIAL",
      department: doc.department?._id || "",
      semester:
        doc.semester !== null &&
        doc.semester !== undefined
          ? String(doc.semester)
          : "",
      visibility: doc.visibility || "PUBLIC",
      tags: Array.isArray(doc.tags)
        ? doc.tags.join(", ")
        : "",
    });

    setError("");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (actionLoading) return;

    setShowEditModal(false);
    setSelectedDocument(null);
    setForm(INITIAL_FORM);
  };

  const handleEdit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm(false)) return;

    if (!selectedDocument?._id) {
      setError("No document selected.");
      return;
    }

    try {
      setActionLoading(true);

      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      await updateDocument(selectedDocument._id, {
        title: form.title.trim(),
        description: form.description.trim(),
        documentType: form.documentType,
        department: form.department,
        semester: form.semester
          ? Number(form.semester)
          : null,
        visibility: form.visibility,
        tags,
      });

      setSuccess("Document updated successfully.");
      setShowEditModal(false);
      setSelectedDocument(null);
      setForm(INITIAL_FORM);

      await fetchDocuments();
    } catch (err) {
      setError(err.message || "Failed to update document.");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (doc) => {
    setSelectedDocument(doc);
    setError("");
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (actionLoading) return;

    setShowDeleteModal(false);
    setSelectedDocument(null);
  };

  const handleDelete = async () => {
    if (!selectedDocument?._id) {
      setError("No document selected.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await deleteDocument(selectedDocument._id);

      setSuccess("Document deleted successfully.");
      setShowDeleteModal(false);
      setSelectedDocument(null);

      await fetchDocuments();
    } catch (err) {
      setError(err.message || "Failed to delete document.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async (doc, shouldOpen = false) => {
    try {
      setError("");

      const blob = await downloadDocument(doc._id);
      const blobUrl = URL.createObjectURL(blob);

      if (shouldOpen) {
        window.open(blobUrl, "_blank", "noopener,noreferrer");

        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 60000);

        return;
      }

      const anchor = window.document.createElement("a");

      anchor.href = blobUrl;
      anchor.download =
        doc.originalFileName ||
        doc.fileName ||
        `${doc.title || "document"}.pdf`;

      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to download document.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="min-h-screen px-4 pb-8 pt-24 sm:px-6 lg:ml-64 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-blue-600">
                Administration
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Documents
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage academic and institutional documents.
              </p>
            </div>

            <button
              type="button"
              onClick={openUploadModal}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon />
              Upload Document
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertIcon className="mt-0.5 shrink-0" />

              <div className="flex-1">
                <p className="font-semibold">Something went wrong</p>
                <p className="mt-0.5">{error}</p>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                className="rounded-lg p-1 hover:bg-red-100"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                ✓
              </div>

              <span className="font-medium">{success}</span>
            </div>
          )}

          {/* Summary */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Documents
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {documents.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Showing
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                {filteredDocuments.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Departments
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {departments.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Active Filters
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {activeFilterCount}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              <div className="relative lg:col-span-1">
                <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search documents..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All document types</option>

                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {formatLabel(type)}
                  </option>
                ))}
              </select>

              <select
                value={departmentFilter}
                onChange={(event) =>
                  setDepartmentFilter(event.target.value)
                }
                disabled={departmentsLoading}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {departmentsLoading
                    ? "Loading departments..."
                    : "All departments"}
                </option>

                {departments.map((department) => (
                  <option
                    key={department._id}
                    value={department._id}
                  >
                    {department.code} — {department.name}
                  </option>
                ))}
              </select>

              <select
                value={visibilityFilter}
                onChange={(event) =>
                  setVisibilityFilter(event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All visibility</option>

                {VISIBILITIES.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {formatLabel(visibility)}
                  </option>
                ))}
              </select>
            </div>

            {(searchTerm ||
              typeFilter ||
              departmentFilter ||
              visibilityFilter) && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Document
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Type
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Department
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Semester
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Visibility
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Uploaded By
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Date
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-5 py-16 text-center"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                          <p className="mt-3 text-sm text-slate-500">
                            Loading documents...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredDocuments.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-5 py-16 text-center"
                      >
                        <div className="mx-auto flex max-w-sm flex-col items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <DocumentIcon className="h-7 w-7" />
                          </div>

                          <h3 className="mt-4 font-semibold text-slate-900">
                            No documents found
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Try changing your search or filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <tr
                        key={doc._id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <DocumentIcon className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                              <p
                                className="max-w-[240px] truncate text-sm font-semibold text-slate-900"
                                title={doc.title}
                              >
                                {doc.title || "Untitled document"}
                              </p>

                              <p
                                className="mt-0.5 max-w-[240px] truncate text-xs text-slate-500"
                                title={
                                  doc.originalFileName ||
                                  doc.fileName
                                }
                              >
                                {doc.originalFileName ||
                                  doc.fileName ||
                                  "No file name"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${getTypeClasses(
                              doc.documentType
                            )}`}
                          >
                            {formatLabel(doc.documentType)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {doc.department?.code || "—"}
                            </p>

                            <p className="max-w-[150px] truncate text-xs text-slate-500">
                              {doc.department?.name || "—"}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {doc.semester
                            ? `Semester ${doc.semester}`
                            : "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getVisibilityClasses(
                              doc.visibility
                            )}`}
                          >
                            {formatLabel(doc.visibility)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[150px] truncate text-sm font-medium text-slate-800">
                            {doc.uploadedBy?.name || "—"}
                          </p>

                          <p className="max-w-[150px] truncate text-xs text-slate-500">
                            {doc.uploadedByRole || ""}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(
                            doc.createdAt || doc.updatedAt
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openViewModal(doc)}
                              title="View details"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                              <EyeIcon />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDownload(doc, true)
                              }
                              title="Open document"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                            >
                              <DownloadIcon />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(doc)}
                              title="Edit metadata"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                            >
                              <EditIcon />
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(doc)}
                              title="Delete document"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / Tablet Cards */}
          <div className="space-y-4 lg:hidden">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
                <div className="flex flex-col items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                  <p className="mt-3 text-sm text-slate-500">
                    Loading documents...
                  </p>
                </div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
                <div className="mx-auto flex max-w-sm flex-col items-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <DocumentIcon className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-900">
                    No documents found
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Try changing your search or filters.
                  </p>
                </div>
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <div
                  key={doc._id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <DocumentIcon />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3
                        className="truncate text-sm font-bold text-slate-900"
                        title={doc.title}
                      >
                        {doc.title || "Untitled document"}
                      </h3>

                      <p
                        className="mt-1 truncate text-xs text-slate-500"
                        title={
                          doc.originalFileName ||
                          doc.fileName
                        }
                      >
                        {doc.originalFileName ||
                          doc.fileName ||
                          "No file name"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${getTypeClasses(
                        doc.documentType
                      )}`}
                    >
                      {formatLabel(doc.documentType)}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getVisibilityClasses(
                        doc.visibility
                      )}`}
                    >
                      {formatLabel(doc.visibility)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Department
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {doc.department?.code || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Semester
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {doc.semester
                          ? `Semester ${doc.semester}`
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Uploaded By
                      </p>

                      <p className="mt-1 truncate text-sm font-medium text-slate-700">
                        {doc.uploadedBy?.name || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Date
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {formatDate(
                          doc.createdAt || doc.updatedAt
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => openViewModal(doc)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <EyeIcon />
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDownload(doc, true)
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <DownloadIcon />
                      Open
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(doc)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                      <EditIcon />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => openDeleteModal(doc)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      <TrashIcon />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Upload Document
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Add a new academic or institutional document.
                </p>
              </div>

              <button
                type="button"
                onClick={closeUploadModal}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Title <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="Enter document title"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows="3"
                    placeholder="Enter a short description"
                    className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Document Type{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="documentType"
                    value={form.documentType}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {formatLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Department{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="department"
                    value={form.department}
                    onChange={handleFormChange}
                    disabled={departmentsLoading}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                  >
                    <option value="">
                      {departmentsLoading
                        ? "Loading..."
                        : "Select department"}
                    </option>

                    {departments.map((department) => (
                      <option
                        key={department._id}
                        value={department._id}
                      >
                        {department.code} — {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Semester
                  </label>

                  <input
                    type="number"
                    name="semester"
                    value={form.semester}
                    onChange={handleFormChange}
                    min="1"
                    max="12"
                    placeholder="e.g. 4"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Visibility{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="visibility"
                    value={form.visibility}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {VISIBILITIES.map((visibility) => (
                      <option
                        key={visibility}
                        value={visibility}
                      >
                        {formatLabel(visibility)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Tags
                  </label>

                  <input
                    type="text"
                    name="tags"
                    value={form.tags}
                    onChange={handleFormChange}
                    placeholder="e.g. java, unit-1, programming"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Separate multiple tags with commas.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Document File{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center transition hover:border-blue-300 hover:bg-blue-50/30">
                    <input
                      id="document-file"
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <label
                      htmlFor="document-file"
                      className="cursor-pointer"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <DocumentIcon />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        {selectedFile
                          ? selectedFile.name
                          : "Choose a document file"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        PDF, DOC, DOCX, PPT or PPTX · Max 20 MB
                      </p>
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-700">
                          {selectedFile.name}
                        </p>

                        <p className="text-xs text-slate-400">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="ml-3 shrink-0 text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  disabled={actionLoading}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}

                  {actionLoading
                    ? "Uploading..."
                    : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Document Details
                </h2>

                <p className="text-xs text-slate-500">
                  Complete document information
                </p>
              </div>

              <button
                type="button"
                onClick={closeViewModal}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {viewLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                  <p className="mt-3 text-sm text-slate-500">
                    Loading details...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <DocumentIcon className="h-7 w-7" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-xl font-bold text-slate-900">
                        {selectedDocument.title ||
                          "Untitled document"}
                      </h3>

                      <p className="mt-1 break-all text-sm text-slate-500">
                        {selectedDocument.originalFileName ||
                          selectedDocument.fileName ||
                          "No file name"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${getTypeClasses(
                        selectedDocument.documentType
                      )}`}
                    >
                      {formatLabel(
                        selectedDocument.documentType
                      )}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getVisibilityClasses(
                        selectedDocument.visibility
                      )}`}
                    >
                      {formatLabel(
                        selectedDocument.visibility
                      )}
                    </span>

                    {selectedDocument.isActive === false && (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DetailItem
                      label="Department"
                      value={
                        selectedDocument.department
                          ? `${selectedDocument.department.code || ""}${
                              selectedDocument.department.name
                                ? ` — ${selectedDocument.department.name}`
                                : ""
                            }`
                          : "—"
                      }
                    />

                    <DetailItem
                      label="Semester"
                      value={
                        selectedDocument.semester
                          ? `Semester ${selectedDocument.semester}`
                          : "Not specified"
                      }
                    />

                    <DetailItem
                      label="Uploaded By"
                      value={
                        selectedDocument.uploadedBy?.name ||
                        "—"
                      }
                    />

                    <DetailItem
                      label="Uploader Role"
                      value={
                        selectedDocument.uploadedByRole
                          ? formatLabel(
                              selectedDocument.uploadedByRole
                            )
                          : "—"
                      }
                    />

                    <DetailItem
                      label="File Type"
                      value={getFileExtension(
                        selectedDocument.originalFileName ||
                          selectedDocument.fileName
                      )}
                    />

                    <DetailItem
                      label="File Size"
                      value={formatFileSize(
                        selectedDocument.fileSize
                      )}
                    />

                    <DetailItem
                      label="Created"
                      value={formatDate(
                        selectedDocument.createdAt
                      )}
                    />

                    <DetailItem
                      label="Last Updated"
                      value={formatDate(
                        selectedDocument.updatedAt
                      )}
                    />
                  </div>

                  {selectedDocument.description && (
                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Description
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {selectedDocument.description}
                      </p>
                    </div>
                  )}

                  {Array.isArray(selectedDocument.tags) &&
                    selectedDocument.tags.length > 0 && (
                      <div className="mt-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Tags
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedDocument.tags.map(
                            (tag, index) => (
                              <span
                                key={`${tag}-${index}`}
                                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                              >
                                #{tag}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        handleDownload(
                          selectedDocument,
                          false
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <DownloadIcon />
                      Download
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDownload(
                          selectedDocument,
                          true
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <EyeIcon />
                      Open
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Edit Document
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Update document metadata.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleEdit} className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Title <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows="3"
                    className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Document Type
                  </label>

                  <select
                    name="documentType"
                    value={form.documentType}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {formatLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Department
                  </label>

                  <select
                    name="department"
                    value={form.department}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Select department
                    </option>

                    {departments.map((department) => (
                      <option
                        key={department._id}
                        value={department._id}
                      >
                        {department.code} — {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Semester
                  </label>

                  <input
                    type="number"
                    name="semester"
                    value={form.semester}
                    onChange={handleFormChange}
                    min="1"
                    max="12"
                    placeholder="e.g. 4"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Visibility
                  </label>

                  <select
                    name="visibility"
                    value={form.visibility}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {VISIBILITIES.map((visibility) => (
                      <option
                        key={visibility}
                        value={visibility}
                      >
                        {formatLabel(visibility)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Tags
                  </label>

                  <input
                    type="text"
                    name="tags"
                    value={form.tags}
                    onChange={handleFormChange}
                    placeholder="tag1, tag2, tag3"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs font-medium leading-5 text-amber-800">
                      The current backend update endpoint supports
                      metadata updates only. The uploaded file itself
                      cannot be replaced from this screen.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={actionLoading}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}

                  {actionLoading
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <TrashIcon className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Delete document?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              You are about to permanently delete{" "}
              <span className="font-semibold text-slate-700">
                {selectedDocument.title ||
                  "this document"}
              </span>
              . This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={actionLoading}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}

                {actionLoading
                  ? "Deleting..."
                  : "Delete Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-medium text-slate-700">
        {value || "—"}
      </p>
    </div>
  );
}

export default AdminDocuments;