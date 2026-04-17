# Test Checklist

## Auth
- [ ] Correct password grants access and sets session cookie
- [ ] Wrong password is rejected with an error message
- [ ] Refreshing the page keeps the session alive
- [ ] "Add entry" button is hidden when not authenticated

## Navigation
- [ ] All 6 tabs render and switch without page reload
- [ ] Active tab is visually indicated
- [ ] Tab content is scoped correctly (no bleed between tabs)

## Diary Pages (De første dagene / ukene / månedene / årene)
- [ ] Each tab only shows entries within its correct date range
- [ ] Entries render in chronological order
- [ ] Text entries display with correct date label
- [ ] "Add entry" form opens and closes correctly
- [ ] New entry (date + text) saves to `sofia.entries` and appears immediately
- [ ] Date picker is constrained to the tab's valid date range
- [ ] Empty state is shown gracefully when no entries exist

## Google Photos
- [ ] Photos are fetched and filtered by the tab's date range
- [ ] No photo appears in more than one tab (dedup via `sofia.used_photo_ids`)
- [ ] Photos render in polaroid/tilted collage style
- [ ] Photos load lazily without blocking page render
- [ ] Graceful fallback if Google Photos API is unavailable

## Postboks
- [ ] Emails sent to child's Gmail account are fetched and displayed
- [ ] Each email shows sender, date, subject, and body preview
- [ ] Clicking an email expands the full body
- [ ] Empty state shown if no emails exist
- [ ] Graceful fallback if Gmail API is unavailable

## Din ordbok
- [ ] Placeholder page renders without errors
- [ ] No broken links or missing UI elements

## Design / UI
- [ ] Correct color palette (dusty rose, sage green, terracotta, cream) applied globally
- [ ] Correct fonts loaded (Playfair/Cormorant, Lora/DM Serif, Caveat/Patrick Hand)
- [ ] Botanical SVG background elements visible on all pages
- [ ] Collage photo layout is asymmetric and non-grid
- [ ] Photos animate on load (settle/spring rotation)
- [ ] Page transitions fade-slide between tabs
- [ ] App is fully responsive on mobile and desktop

## Supabase
- [ ] `sofia.entries` table is readable and writable via API
- [ ] `sofia.used_photo_ids` correctly prevents duplicate photo display
- [ ] All DB calls use the `sofia` schema explicitly

## Deployment
- [ ] App deploys to Vercel without errors
- [ ] All env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PASSWORD`, Google OAuth tokens) are set
- [ ] No secrets are exposed in client-side code
- [ ] `/api/auth`, `/api/entries`, `/api/photos`, `/api/emails` all respond correctly in production