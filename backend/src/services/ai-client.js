import { config } from "../config.js";
import { HttpError } from "../errors.js";

async function postJson(path, body) {
  let response;
  try {
    response = await fetch(`${config.aiServiceUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.aiTimeoutMs)
    });
  } catch (error) {
    console.error("AI service request failed:", error.name, error.message);
    throw new HttpError(502, "The AI service could not be reached. Please retry shortly.", "AI_SERVICE_UNAVAILABLE");
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok || !data) {
    console.error(`AI service returned HTTP ${response.status}.`);
    throw new HttpError(502, "The AI service could not complete this request.", "AI_SERVICE_ERROR");
  }
  return data;
}

export function askCampusAI({ message, conversation, userContext, accessibleDocumentIds }) {
  return postJson("/v1/chat", {
    message,
    conversation,
    user_context: userContext || null,
    accessible_document_ids: accessibleDocumentIds
  });
}

export function ingestWithCampusAI(payload) {
  return postJson("/v1/documents/ingest", payload);
}

export async function deleteFromCampusAI(documentId) {
  let response;
  try {
    response = await fetch(`${config.aiServiceUrl}/v1/documents/${encodeURIComponent(documentId)}`, {
      method: "DELETE",
      signal: AbortSignal.timeout(config.aiTimeoutMs)
    });
  } catch (error) {
    console.error("AI service delete request failed:", error.name, error.message);
    throw new HttpError(502, "The AI service could not be reached; the document was not deleted.", "AI_SERVICE_UNAVAILABLE");
  }

  if (!response.ok) {
    console.error(`AI service delete returned HTTP ${response.status}.`);
    throw new HttpError(502, "The AI service could not delete this document; no database record was removed.", "AI_SERVICE_ERROR");
  }

  return response.json();
}

export async function isCampusAIHealthy() {
  try {
    const response = await fetch(`${config.aiServiceUrl}/health`, {
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
}
