# 2026-04-17
## In Progress
## Completed
- [x] Ordbok: variant edit/delete inline + inline evolution layout (Avo → Avoka → Avokado)
- [x] Ordbok: wire up to sofia.word_entries + sofia.word_variants with full CRUD
- [x] Tab transition: simple fade-in only (no AnimatePresence/exit), removed diary loading.tsx that caused skeleton flash
- [x] Upload progress bar with file counter and animated bar
- [x] Postboks skeleton loading state
- [x] Ordbok: remove "Ditt ord" label, keep canonical word styled differently
- [x] Remove images from diary entries (hover X button)
- [x] Remove word in ordbok (hover X button on chip)
- [x] Add image conversion to JPEG on upload and resize the image to max 2000px wide. 
- [x] Add possibility to remove a diary entry
- [x] Postboks: emails with photos not showing text body
- [x] Google Photos Picker: fix download (add Bearer token, use =d suffix)
- [x] Google Photos Picker: add to existing diary entries
- [x] AddEntryForm: image preview thumbnails with remove button
- [x] Postboks: 60/40 text/carousel side-by-side layout
- [x] Postboks: taller images, arrows+dots in bottom bar, click-to-zoom lightbox

## Completed
- [x] Remove inline image thumbnails from DiaryEntry (show images only in collage)
- [x] Make diary entries editable (fix typos / OCR errors)
- [x] Alternating text|image / image|text layout, images and text side by side
- [x] Image zoom on hover — smooth animation, ~50% screen, no crop
- [x] Dummy entry in Postboks so layout is visible
- [x] Din Ordbok redesign — word timeline with dates, wavy arrow, drop pronunciation, add Avokado example
- [x] Postboks: show image attachments with swipe/click carousel; dummy email with 3 example images
- [x] Ordbok: editable word + date fields, display actual word once, fix arrow alignment, 3 distinct arrow variants
- [x] Ordbok: compact chip layout (word·date inline), actual word inline with timeline in distinct italic terracotta chip
- [x] Diary collage: removed top collage, all entry images shown in polaroid-style column beside text
- [x] Diary layout: 60/40 text/image split, 2-col image grid, Framer Motion zoom on hover, mobile text-first
- [x] Diary: max-w-6xl layout, editable date, uncropped zoom (object-contain on hover), uniform image sizes

## Completed (Implementation)
- [x] Unit 1: Project scaffold, design system & configuration
- [x] Unit 2: Supabase schema migration & data layer
- [x] Unit 3: Auth layer — iron-session + middleware
- [x] Unit 4: Tab system, date range logic & navigation shell
- [x] Unit 5: Diary entry API & display
- [x] Unit 6: Add entry form & media upload
- [x] Unit 7: Polaroid collage component & Framer Motion animations
- [x] Unit 8: Postboks — Gmail API integration
- [x] Unit 9: Din ordbok static placeholder
- [x] Unit 10: Page transitions, mobile layout & design polish
- [x] Unit 11: Google Photos Picker import (optional)
- [x] Edit existing entry — add photo to existing diary entry
- [x] OCR import script — transcribe handwritten photos via Claude vision
