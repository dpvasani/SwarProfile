I'll read user.routes.js and artist.controller.js to list endpoints and behaviors, then produce the markdown report. I'll fetch both files. Receipt: I'll produce a single, complete Markdown report describing the system, full workflows, endpoints, data flow, config, logs you saw, current gaps (Gemini 404), testing and next steps.

## Checklist
- Generate full system report in Markdown — Done
- Include workflows (upload/extract → enhance → summary → store/verify) — Done
- List endpoints, middleware, and files involved — Done
- Explain config (.env), errors observed (Gemini 404) and troubleshooting steps — Done
- Provide commands to test locally and recommended next actions — Done

---

## SwarProfile — System Report

### 1) High-level overview
SwarProfile is a two-part web application:
- Frontend: React + Vite (served on http://localhost:5173). Uses axios (configured in AuthContext.jsx) and fetch for AI calls.
- Backend: Node.js + Express + MongoDB (Mongoose) API (runs on http://localhost:4000). Handles uploads, extraction, AI enhancements, Cloudinary uploads, and artist record management.

Core responsibilities:
- Accept document uploads (PDF/DOCX), extract structured artist data.
- Store artists in MongoDB with extraction metadata and document URL (Cloudinary).
- Provide admin-only AI enhancements (single-field or comprehensive), AI-generated summaries and detailed profiles.
- Provide public/user-facing artist list and artist profile endpoints.

Primary server files
- index.js (server entry, DB connect)
- app.js (Express app, CORS, global error handler)
- `Server/src/routes/*` (route definitions)
- `Server/src/controllers/*` (main request handling logic)
- documentExtractor.js (document parsing)
- aiEnhancer.js (AI integration; Gemini calls)
- cloudinary.js (Cloudinary upload/delete)
- artist.model.js (artist schema and helpers)
- .env (configuration, API keys)

---

### 2) Key components and roles

- DocumentExtractor
  - File: documentExtractor.js
  - Uses: `pdf-parse`, `mammoth`, `tesseract.js` etc. to parse PDF/Word/Images and produce:
    - artistName, guruName, gharana, biography, contactDetails, rawText
    - extractionMetadata: { confidence, qualityScore, method, processingTime }
  - Called by: `uploadAndExtractDocument` in artist.controller.js

- Cloudinary utils
  - File: cloudinary.js
  - Uploads files, returns URL; deletes assets when needed.

- AIEnhancer
  - File: aiEnhancer.js
  - Purpose: clean/format fields, enrich via Google Generative Language (Gemini).
  - Behavior (current):
    - Tries multiple Gemini endpoints (v1/v1beta/v1beta2 / `text-bison-001`, `gemini-pro`, `gemini-1.3`) and logs response bodies for non-OK.
    - Returns the best parsed candidate or falls back to local formatting (`formatName`, `formatText`, `formatPhone`, etc.) on failure.
    - (OpenAI fallback previously added but removed per your instruction — now only Gemini attempts.)
  - Called by: `enhanceField`, `enhanceAllFields`, `generateSummary`, `getComprehensiveDetails`.

- Authentication & Authorization
  - Middleware: `verifyJWT` (checks access token cookie/header), `verifyAdmin` (ensures admin role)
  - Axios default config: `axios.defaults.baseURL = 'http://localhost:4000/api/v1'` and `withCredentials = true` (set in AuthContext.jsx)

---

### 3) Request / workflow paths (detailed)

1. Admin uploads document (Word/PDF)
   - Frontend: `POST /api/v1/artists/admin/upload` (axios, multipart/form-data)
   - Backend route: `router.route("/admin/upload").post(verifyJWT, verifyAdmin, upload.single("document"), validateDocumentFile, uploadAndExtractDocument);`
   - Backend controller: `uploadAndExtractDocument`:
     - Saves temp file (multer), calls `documentExtractor.extractFromFile(path, fileType)`.
     - Logs extraction metadata (confidence, quality score, method, time).
     - Uploads original document to Cloudinary via `uploadOnCloudinary()`.
     - Creates `Artist` record with extracted fields and `originalDocument.url`.
     - Responds with created artist + extracted data.
   - Clean-up: delete temp file on success or error.

2. Admin enhances fields (single-field)
   - Frontend: fetch to `http://localhost:4000/api/v1/artists/admin/enhance-field` (POST JSON: { field, value, context })
   - Backend route: `router.route("/admin/enhance-field").post(verifyJWT, verifyAdmin, sanitizeBody, enhanceField);`
   - Controller: `enhanceField` calls `aiEnhancer.enhanceField(field, value, context)`; returns enhancedValue or error.

3. Admin enhances all fields (comprehensive)
   - Frontend: fetch to `http://localhost:4000/api/v1/artists/admin/enhance-all` (POST JSON: { data, rawText })
   - Backend route: `router.route("/admin/enhance-all").post(verifyJWT, verifyAdmin, sanitizeBody, enhanceAllFields);`
   - Controller: `enhanceAllFields` calls `aiEnhancer.enhanceAllFields(data, rawText)` which:
     - Iterates relevant fields (artistName, guruName, gharana, biography, description, contactDetails.*)
     - For each, calls `enhanceField(...)`.
     - Returns consolidated enhancedFormData.

4. Admin generates summary
   - Frontend: fetch to `http://localhost:4000/api/v1/artists/admin/generate-summary`
   - Controller: `generateSummary` calls `aiEnhancer.generateSummary({artistName, guruName, gharana, biography})`
     - Tries AI; fallback to simple concatenated summary.

5. Admin retrieves comprehensive AI details
   - Frontend: fetch to `http://localhost:4000/api/v1/artists/admin/comprehensive-details`
   - Controller: `getComprehensiveDetails` calls `aiEnhancer.getComprehensiveDetails({artistName,guruName,gharana})`
     - AI attempt; fallback to structured JSON object with biography, description, summary.

6. Public user flows
   - `GET /api/v1/artists` → `getAllArtistsUser` returns artist summary list (only extractionStatus completed + isVerified true)
   - `GET /api/v1/artists/:id` → `getArtistById` returns admin or user view depending on caller

7. Admin management
   - `GET /api/v1/artists/admin/all` — list all artists (admin view)
   - `PATCH /api/v1/artists/admin/:id` — update artist fields
   - `PATCH /api/v1/artists/admin/:id/photo` — update photo
   - `PATCH /api/v1/artists/admin/:id/verify` — verify profile
   - `DELETE /api/v1/artists/admin/:id` — delete artist

---

### 4) Endpoints (as implemented)

User routes (file: user.routes.js)
- POST /api/v1/users/register — register (uploads: avatar, coverImage)
- POST /api/v1/users/login — login
- POST /api/v1/users/logout — logout (verifyJWT)
- POST /api/v1/users/refresh-token — refresh
- POST /api/v1/users/change-password — change password (verifyJWT)
- GET /api/v1/users/current-user — get current user (verifyJWT)
- PATCH /api/v1/users/update-account — update account (verifyJWT)
- PATCH /api/v1/users/avatar — update avatar (verifyJWT)
- PATCH /api/v1/users/cover-image — update cover image (verifyJWT)

Artist routes (file: artist.routes.js)
- POST /api/v1/artists/admin/enhance-field — enhance single field (admin)
- POST /api/v1/artists/admin/enhance-all — enhance all fields (admin)
- POST /api/v1/artists/admin/generate-summary — generate summary (admin)
- POST /api/v1/artists/admin/comprehensive-details — get comprehensive details (admin)
- POST /api/v1/artists/admin/upload — upload doc & extract (admin)
- GET /api/v1/artists/admin/all — list (admin)
- GET /api/v1/artists/admin/stats — extraction stats (admin)
- GET /api/v1/artists — public list
- GET /api/v1/artists/:id — get single artist (public/admin)
- PATCH /api/v1/artists/admin/:id — update (admin)
- PATCH /api/v1/artists/admin/:id/photo — update photo (admin)
- PATCH /api/v1/artists/admin/:id/verify — verify artist (admin)
- DELETE /api/v1/artists/admin/:id — delete (admin)

---

### 5) Data model highlights (Artist)
(see artist.model.js for full schema)
- artistName, guruName, gharana, biography, description
- contactDetails: { phone, email, address }
- profilePhoto, originalDocument: { filename, url, fileType, uploadedAt }
- rawExtractedData (rawText)
- extractionStatus: processing | completed | failed | verified
- isVerified, createdBy, verifiedBy, verifiedAt
- createdAt, updatedAt
- Helper methods: `getAdminView()`, `getUserView()` produce shape returned by API.

---

### 6) Configuration (.env)
Important variables (file: .env):
- PORT (4000)
- MONGODB_URL (mongodb+srv://...)
- CORS_ORIGIN (http://localhost:5173)
- ACCESS_TOKEN_SECRET / REFRESH_TOKEN_SECRET and expiries
- CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET
- GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_KEY_FILE, GOOGLE_CLOUD_CLIENT_EMAIL, GOOGLE_CLOUD_PRIVATE_KEY
- GEMINI_API_KEY (present in your .env)

Note: You already have a service-account JSON file path set in `GOOGLE_CLOUD_KEY_FILE` (./config/...). If using service account auth, `GOOGLE_APPLICATION_CREDENTIALS` environment variable should point to that JSON.

---

### 7) Logging, error handling and observed Gemini issue

- Global error handler in `app.js` returns structured JSON for errors and logs them server-side.
- `aiEnhancer.callGeminiAPI` (updated) now:
  - Tries multiple Gemini endpoints.
  - Logs response bodies on non-OK responses (hence the earlier logs that showed "Gemini API error: 404 Not Found - ").
  - Sets `this.lastTriedGeminiUrl` so server-side debugging can print the exact URL attempted.
- Observed server logs show repeated:
  - "Gemini API call failed: Error: Gemini API error: 404 Not Found -"
  - That indicates the project/key did not accept the model/endpoint used.
  - Probable causes:
    - Generative Language API not enabled on project
    - Model name not available for your project (rollout / quota / access differences)
    - API key restrictions (HTTP referer or IP) blocking the call
    - Endpoint version mismatch (your project may accept `text-bison-001` or may require service-account/GCP client auth rather than API key)

---

### 8) Diagnostics & commands (PowerShell)
Run from Server folder.

Restart server (dev):
```powershell
cd 'C:\Users\DarshanVasani\Downloads\SwarProfile\Server'
npm run dev
```

Quick Gemini model list test (replace key with `GEMINI_API_KEY` from .env):
```powershell
$k = 'PASTE_GEMINI_API_KEY'
Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1/models?key=$k" -Method Get
```

Test text-bison v1:
```powershell
$k = 'PASTE_GEMINI_API_KEY'
$body = @{ prompt = @{ text = 'Say hello in one sentence.' }; temperature = 0.2; maxOutputTokens = 50 } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1/models/text-bison-001:generate?key=$k" -Method Post -ContentType 'application/json' -Body $body
```

Test generateContent (gemini-style):
```powershell
$k = 'PASTE_GEMINI_API_KEY'
$body = @{ contents = @(@{ parts = @(@{ text = 'Clean this title: ustd zakir' }) }) } | ConvertTo-Json -Depth 6
Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$k" -Method Post -ContentType 'application/json' -Body $body
```

If responses return 404 or 403:
- Check the project in Google Cloud Console:
  - APIs & Services → Library → enable "Generative Language API"
  - API keys → check restrictions (remove restrictions for testing)
  - IAM → ensure service account has appropriate roles if using service account

Service-account auth (recommended if API-key returns 404)
```powershell
# point GOOGLE_APPLICATION_CREDENTIALS then restart
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\Users\DarshanVasani\Downloads\SwarProfile\Server\config\gen-lang-client-0861651920-c16fdf1b2f08.json'
npm run dev
```
Using service account + official Google client library (I can add this change) often avoids API key/model mismatch.

---

### 9) Quality gates & tests
- Build: Node server uses `nodemon src/index.js` — server already runs and connects to MongoDB.
- Lint/Typecheck: none set up. Consider adding eslint and a precommit hook.
- Unit tests: none present. Recommended minimal tests:
  - `aiEnhancer` unit tests: mock fetch to simulate Gemini responses (happy & 404).
  - `documentExtractor` unit tests: feed sample pdf/docx and assert parsed fields.
- Smoke test (manual):
  - Upload a known-good document via frontend admin UI.
  - Verify artist record created (`GET /api/v1/artists/admin/all`).
  - Try `enhance-field` and inspect server logs and response.

---

### 10) Security and operational notes
- Do not commit .env with secret keys into git. Your repo currently has credentials in .env — ensure .gitignore includes .env.
- Cloudinary and MongoDB credentials are sensitive.
- API Key restrictions: restrict by IPs or server referrers in production; for local testing allow local IPs or use service account-based auth.
- Rate limits / cost: generative models can be costly. Add usage quotas and logging to track calls.

---

### 11) Known issues & recommended fixes (prioritized)
1. Gemini 404 (high)
   - Quick test: run the model list command above — if it lists models you can select the correct endpoint.
   - Most reliable fix: use service-account credentials and the official Google Generative Language client library (I can implement).
   - Alternative: update `aiEnhancer` to try the exact model returned by the `models` list.
2. Frontend used relative fetch endpoints (fixed in UploadDocument.jsx) causing requests to hit the frontend server (5173) — resolved.
3. Add tests & logging retention for AI responses — add an admin-only debug endpoint to surface last Gemini attempted URL and last raw response for diagnosis (I can add).
4. Clean up OCR artifacts: `documentExtractor` may produce encoding artifacts (you saw \x00 bytes) — consider post-processing to remove non-printables before sending to AI.

---

### 12) Next steps I can implement for you (pick one or more)
- A) Add a small admin debug endpoint to return `aiEnhancer.lastTriedGeminiUrl` and last raw response body (safe: returns only presence and raw text, no keys) — quick and helps debug.
- B) Replace `aiEnhancer` fetch calls with Google Generative Language Node client using service-account JSON (`google-generative-ai` or `@google-cloud/generative-ai`), wire `GOOGLE_APPLICATION_CREDENTIALS` and adapt code (more robust).
- C) Add unit tests for `aiEnhancer` mocking HTTP responses.
- D) Add server-side sanitized cleanup to remove non-printable characters from extracted rawText.

Tell me which action(s) you want me to take next and I’ll implement them (I can start with A for fastest diagnosis, then B for production-readiness).