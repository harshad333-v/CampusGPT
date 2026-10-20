// Relative URLs work with the Vite development proxy and the full-stack Nginx proxy.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/+$/, "");

export { API_BASE_URL };
