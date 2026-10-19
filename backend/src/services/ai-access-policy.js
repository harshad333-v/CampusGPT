// The existing AI service treats an empty accessible_document_ids list as
// unrestricted retrieval. Keep that behavior isolated behind an explicit guard.
export function normalizeAccessibleDocumentIds(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(
    values
      .filter((value) => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
  )];
}

export function canInvokeAiWithDocumentScope(documentIds) {
  return Array.isArray(documentIds) && documentIds.length > 0;
}
