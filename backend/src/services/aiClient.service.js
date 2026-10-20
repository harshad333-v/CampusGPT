"use strict";

const DEFAULT_AI_SERVICE_URL = "http://127.0.0.1:8000";
const DEFAULT_TIMEOUT_MS = 120000;

class AIServiceError extends Error {
  constructor(message, statusCode = 502, options = {}) {
    super(message, options);
    this.name = "AIServiceError";
    this.statusCode = statusCode;
  }
}

function getAIServiceUrl() {
  return (process.env.AI_SERVICE_URL || DEFAULT_AI_SERVICE_URL).replace(/\/+$/, "");
}

async function requestAI(path, { method = "POST", body, timeoutMs, headers: extraHeaders = {} } = {}) {
  const timeout = Number(timeoutMs || process.env.AI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeout);

  const headers = { ...extraHeaders };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(`${getAIServiceUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const responseText = await response.text();
    let payload = null;

    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = { detail: responseText };
      }
    }

    if (!response.ok) {
      const message =
        payload?.detail ||
        payload?.message ||
        `AI service request failed with HTTP ${response.status}`;
      throw new AIServiceError(
        String(message),
        response.status >= 400 && response.status < 500 ? 502 : 503,
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }

    if (error.name === "AbortError") {
      throw new AIServiceError(
        `AI service timed out after ${timeout} ms.`,
        504,
        { cause: error },
      );
    }

    throw new AIServiceError(
      `Unable to reach the AI service at ${getAIServiceUrl()}.`,
      502,
      { cause: error },
    );
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function generateChatResponse(payload, { denyDocumentRetrieval = false } = {}) {
  return requestAI("/v1/chat", {
    body: payload,
    headers: denyDocumentRetrieval
      ? { "X-CampusGPT-Deny-Document-Retrieval": "true" }
      : {},
  });
}

async function indexDocument(payload) {
  return requestAI("/v1/documents/ingest", { body: payload });
}

async function deleteIndexedDocument(documentId) {
  return requestAI(`/v1/documents/${encodeURIComponent(documentId)}`, {
    method: "DELETE",
  });
}

module.exports = {
  AIServiceError,
  requestAI,
  generateChatResponse,
  indexDocument,
  deleteIndexedDocument,
};
