import { useEffect, useState } from "react";
import { getDocuments } from "../api/documents";
import { API_BASE_URL } from "../api/client";
import StudentSidebar from "../components/StudentSidebar";

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDocuments() {
      try {
        setLoading(true);
        setError("");

        const response = await getDocuments();

        console.log("Documents response:", response);

        if (!response.success) {
          setError(
            response.message || "Unable to load documents."
          );
          return;
        }

        setDocuments(response.data || []);
      } catch (err) {
        console.error("Documents error:", err);
        setError("Unable to load documents.");
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, []);

  function getDocumentUrl(filePath) {
    if (!filePath) {
      return null;
    }

    let normalizedPath = filePath.replace(/\\/g, "/");

    normalizedPath = normalizedPath.replace(
      /^src\//,
      ""
    );

    const serverUrl = API_BASE_URL.replace(
      "/api/v1",
      ""
    );

    return `${serverUrl}/${normalizedPath}`;
  }

  function handleOpenDocument(doc) {
    const documentUrl = getDocumentUrl(doc.filePath);

    if (!documentUrl) {
      alert("Document file is not available.");
      return;
    }

    window.open(
      documentUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function handleDownloadDocument(doc) {
    try {
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
        throw new Error(
          "Unable to download document."
        );
      }

      const blob = await response.blob();

      const downloadUrl =
        window.URL.createObjectURL(blob);

      const link =
        window.document.createElement("a");

      link.href = downloadUrl;

      link.download =
        doc.originalFileName ||
        doc.fileName ||
        "document";

      window.document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Download error:", err);
      alert("Unable to download document.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
      {/* Common Sidebar */}

      <StudentSidebar />

      {/* Main Content */}

      <main className="pt-16 lg:ml-64 lg:pt-0">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
          {/* Header */}

          <header className="mb-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Student Portal
            </p>

            <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Documents
            </h2>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Browse academic documents available to you.
            </p>
          </header>

          {/* Loading State */}

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm transition-colors dark:border-slate-800 dark:bg-blue-600 dark:text-slate-400">
              Loading documents...
            </div>
          ) : error ? (
            /* Error State */

            <div className="rounded-xl border border-red-200 bg-white p-6 text-red-600 shadow-sm transition-colors dark:border-red-900/60 dark:bg-blue-600 dark:text-red-400">
              {error}
            </div>
          ) : documents.length === 0 ? (
            /* Empty State */

            <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm transition-colors dark:border-slate-800 dark:bg-blue-600 dark:text-slate-400">
              No documents available.
            </div>
          ) : (
            /* Documents Grid */

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {documents.map((document) => (
                <div
                  key={document._id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-blue-600 dark:hover:border-slate-700"
                >
                  {/* Document Type */}

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {document.documentType || "Document"}
                  </p>

                  {/* Document Title */}

                  <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
                    {document.title}
                  </h3>

                  {/* Description */}

                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {document.description ||
                      "No description available."}
                  </p>

                  {/* Document Information */}

                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
                    <p className="text-slate-600 dark:text-slate-300">
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        Department:
                      </span>{" "}
                      {document.department?.name ||
                        "Not available"}
                    </p>

                    <p className="text-slate-600 dark:text-slate-300">
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        Department Code:
                      </span>{" "}
                      {document.department?.code ||
                        "Not available"}
                    </p>

                    {document.semester && (
                      <p className="text-slate-600 dark:text-slate-300">
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          Semester:
                        </span>{" "}
                        {document.semester}
                      </p>
                    )}

                    {document.visibility && (
                      <p className="text-slate-600 dark:text-slate-300">
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          Visibility:
                        </span>{" "}
                        {document.visibility}
                      </p>
                    )}
                  </div>

                  {/* Document Actions */}

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenDocument(document)
                      }
                      className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                      Open
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadDocument(document)
                      }
                      className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-blue-700"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Documents;