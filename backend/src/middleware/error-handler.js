import { HttpError } from "../errors.js";

export function notFound(_req, _res, next) {
  next(new HttpError(404, "The requested endpoint was not found.", "NOT_FOUND"));
}

export function errorHandler(error, req, res, _next) {
  if (res.headersSent) return;

  const status = error instanceof HttpError ? error.status : 500;
  const code = error instanceof HttpError ? error.code : "INTERNAL_ERROR";

  if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}] ${error.message}`);
  }

  res.status(status).json({
    error: {
      code,
      message: status >= 500 && !(error instanceof HttpError)
        ? "An unexpected server error occurred."
        : error.message,
      requestId: req.id || undefined
    }
  });
}
