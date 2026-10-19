# CampusGPT frontend (React + TypeScript + Vite)

This frontend is separate from both the Node/Express web backend and the existing FastAPI AI/RAG service.

## Local development

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api/*` to `http://localhost:4000`, so cookies stay same-origin from the browser's point of view.

The UI includes:
- Sign in and student registration
- Chat with grounded-status and source display
- Saved conversation history
- Document index visible to the current account
- Staff/admin document upload, reindex and delete actions

The frontend does not contain database credentials, the Voyage key, the Gemini gateway key, or direct Supabase access.
