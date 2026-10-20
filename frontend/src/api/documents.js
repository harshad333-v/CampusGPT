import { API_BASE_URL } from "./client";

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

function getJsonHeaders() {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// Get all documents
async function getDocuments() {
  const response = await fetch(
    `${API_BASE_URL}/documents`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch documents."
    );
  }

  return data;
}

// Get a single document
async function getDocumentById(documentId) {
  const response = await fetch(
    `${API_BASE_URL}/documents/${documentId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch document."
    );
  }

  return data;
}

// Upload a new document
async function createDocument(documentData, file) {
  const token = localStorage.getItem("token");

  const formData = new FormData();

  formData.append(
    "title",
    documentData.title
  );

  formData.append(
    "description",
    documentData.description || ""
  );

  formData.append(
    "documentType",
    documentData.documentType
  );

  formData.append(
    "department",
    documentData.department
  );

  if (
    documentData.semester !== undefined &&
    documentData.semester !== null &&
    documentData.semester !== ""
  ) {
    formData.append(
      "semester",
      documentData.semester
    );
  }

  formData.append(
    "visibility",
    documentData.visibility
  );

  if (Array.isArray(documentData.tags)) {
    documentData.tags.forEach((tag) => {
      formData.append("tags", tag);
    });
  }

  formData.append("file", file);

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

  return data;
}

// Update document metadata
async function updateDocument(
  documentId,
  documentData
) {
  const response = await fetch(
    `${API_BASE_URL}/documents/${documentId}`,
    {
      method: "PUT",
      headers: getJsonHeaders(),
      body: JSON.stringify(documentData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update document."
    );
  }

  return data;
}

// Delete a document
async function deleteDocument(documentId) {
  const response = await fetch(
    `${API_BASE_URL}/documents/${documentId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to delete document."
    );
  }

  return data;
}

// Download a document
async function downloadDocument(documentId) {
  const response = await fetch(
    `${API_BASE_URL}/documents/download/${documentId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    let message =
      "Failed to download document.";

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Ignore JSON parsing errors.
    }

    throw new Error(message);
  }

  return response.blob();
}

export {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
};