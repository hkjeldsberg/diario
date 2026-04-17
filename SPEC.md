# Idea
A personal homepage/diary for my child — a curated digital memory book where I can upload memories (text, images, video) as a temporal diary throughout her childhood. Designed to feel like a handcrafted scrapbook, not a generic app.

# Features

## Core Tabs
- **De første dagene** — Days 1–14 (first two weeks)
- **De første ukene** — Week 3 through week 8
- **De første månedene** — Month 3 through month 12 (up to 1st birthday)
- **De første årene** — Years 1–5
- **Postboks** — Embedded email viewer for emails sent to child's Gmail account
- **Din ordbok** — Infant vocabulary sheet (populated later from external app)

## Diary Pages (first 4 tabs)

### Existing entries (one-time migration)
- Handwritten notes photographed → OCR via Google Cloud Vision API → text extracted and reviewed/edited manually before saving
- This is a one-time import step, not an ongoing feature
- After OCR, entries are stored as dated text in the database and rendered like all other entries

### New entries (ongoing, in-app)
- "Add entry" button on each diary page (visible only when authenticated)
- Entry form: date picker, text area (rich text or plain), optional image/video upload
- Submitted entries saved to database and rendered immediately in the collage layout
- No OCR involved for new entries — direct text input

## Image Layout
- Photos stored in Supabase Storage — uploaded directly through the app OR imported from Google Photos via the Picker API
- Creative layout: slightly tilted photos, cute frames, varied placement, collage feel
- Photos are attached to diary entries (date-scoped automatically)

## Photo Sources

### Primary: Direct Upload
- "Add entry" form includes optional image/video upload
- Files uploaded to Supabase Storage (`diario-media` bucket)
- URLs stored in `sofia.entries.media_urls`

### Secondary: Google Photos Picker Import
- **Note:** Google Photos `photoslibrary.readonly` scope was permanently removed March 31, 2025. The only surviving way to access photos from a user's personal library is the Google Photos Picker API — an interactive browser-based selection flow.
- "Import from Google Photos" button on diary entry form (authenticated only)
- Flow: app creates a picker session via `/api/photos/picker/create` → user is redirected to Google's Picker UI → user selects photos → app polls `/api/photos/picker/[sessionId]` → server downloads selected photos and re-uploads to Supabase Storage → permanent URLs added to entry
- Picker API scope: `photospicker.mediaitems.readonly`
- Credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (shared with Gmail OAuth), `GOOGLE_PICKER_REFRESH_TOKEN`
- Reference implementation: https://github.com/savethepolarbears/google-photos-mcp (MCP sidecar — not used directly in Vercel; app calls Picker API endpoints directly)
- Lazy-loaded polaroid display — same UX as direct uploads

## Postboks (Email Viewer)
- Connect to child's Gmail account via Gmail API (OAuth2, read-only)
- Fetch emails sent TO that account
- Render as cute embedded email cards: sender, date, subject, body preview → expand on click
- Soft pastel styling, no raw email client look

## Din ordbok
- Static placeholder page for now
- Will be populated from existing external vocabulary app later
- Structure: word, pronunciation, translation, date first used, optional audio

## Auth
- Single-password auth
- Password stored as environment variable on backend (Vercel serverless function)
- Simple `/api/auth` endpoint returns JWT or session cookie on correct password
- Frontend blocks all content behind password gate
- "Add entry" UI only visible when authenticated

# Stack

## Frontend
- **Next.js 14** (App Router) — deployable to Vercel with zero config
- **Tailwind CSS** — utility styling
- **Framer Motion** — collage animations, photo tilts, page transitions
- **React** — component model

## Backend / API (Vercel serverless functions)
- `/api/auth/login` — password check, returns signed iron-session cookie
- `/api/auth/logout` — destroy session
- `/api/entries` — CRUD for diary text entries
- `/api/media/upload` — upload image/video to Supabase Storage (returns URL)
- `/api/photos/picker/create` — create a Google Photos Picker session (returns pickerUri)
- `/api/photos/picker/[sessionId]` — poll picker session, download selected photos to Supabase Storage, return URLs
- `/api/emails` — proxies Gmail API (keeps token server-side)
- All secrets in Vercel env vars (never in client-side code)

## External APIs
- **Google Photos Picker API** (REST, OAuth2, `photospicker.mediaitems.readonly` scope) — interactive photo selection from owner's library
- **Gmail API** (read-only, `gmail.readonly` scope) — fetch messages for child's account
- **Google Cloud Vision API** — one-time OCR run for existing handwritten entries (run locally or as a script, not a live feature)
- **Note:** `photoslibrary.readonly` scope was permanently removed March 31, 2025 — do not use

## Storage
- **Supabase** (Postgres + Storage) — primary database and file storage
- Schema: `sofia`
- Tables:
  - `sofia.entries` — diary text entries (id, date, text, media_urls text[], created_at)
- Storage bucket: `diario-media` — all uploaded photos and videos (public read access)
- Connection: service-role key server-side only; no client-side Supabase
- Env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`

## Deployment
- Vercel (frontend + serverless functions)
- All env vars in Vercel dashboard:
  - `APP_PASSWORD` — single shared password (high-entropy)
  - `SESSION_SECRET` — iron-session signing key (32+ chars, generate with `openssl rand -base64 32`)
  - `BIRTH_DATE` — child's birth date in ISO format (e.g., `2024-03-15`)
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (shared OAuth app for both Gmail and Photos Picker)
  - `GMAIL_REFRESH_TOKEN` — refresh token for child's Gmail account (gmail.readonly scope)
  - `GMAIL_TO_ADDRESS` — child's email address (used as Gmail search filter)
  - `GOOGLE_PICKER_REFRESH_TOKEN` — refresh token for Google Photos Picker (photospicker.mediaitems.readonly scope)
- No user-facing OAuth flow at runtime; all tokens are pre-authorized and stored as env vars

# Design Principles

## Aesthetic: 70s Botanical Scrapbook
- **Colors**: Warm earthy base — dusty rose, sage green, terracotta, cream/off-white, warm amber
- **Accents**: Dried-flower pinks and muted olive greens
- **Background**: Subtle linen texture + soft flower/botanical silhouette shapes as SVG overlays — think pressed flowers, not clipart
- **Typography**: 
  - Display: *Playfair Display* or *Cormorant Garamond* (editorial, slightly romantic)
  - Body: *DM Serif Text* or *Lora* (warm, readable)
  - Handwritten accents: *Caveat* or *Patrick Hand* for dates and captions
- **Photo treatment**: Polaroid-style white frames, 2–4° random tilt, soft shadow, cream border
- **Layout**: Asymmetric, scrapbook-style — no rigid grid. Photos overlap text slightly. Generous whitespace.
- **Motion**: Photos "settle" on load (slight rotation spring animation). Page transitions fade-slide.
- **Mood**: Warm, nostalgic, handcrafted — like opening a beloved photo album

