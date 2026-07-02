# BODY_PROGRESS_REVIEW.md — B-14 checker pass

> Reviews local body measurements + progress photos against UX_FLOW.md,
> DATA_MODEL.md, and the B-10 persistence pattern. Last updated: 2026-06-29

---

## 1. What it does
Adds two motivating, local-only trackers to the Progress screen: body measurements (waist/chest/hips,
+ optional note) and progress photos (local device uri). No upload, no analysis, no comparison, no
backend/Supabase/auth/AI/nutrition/wearable.

## 2. Pieces
- `progressStore` extended: `measurements[]`, `photos[]`, `addMeasurement`, `addPhoto`; persisted +
  reset covered (partialize + `clear`).
- `progressStats` (**pure**): `measurementProgress`, `photoProgress` (both tested).
- `components/MeasurementLogCard.tsx`, `components/ProgressPhotoCard.tsx`.
- `ProgressScreen` renders both (always visible) + encouraging copy.
- `expo-image-picker` (~16.0.6) for photo selection; permission text in `app.json`.

## 3. Measurements (requirements 2–7)
- Stored **canonically in cm** (`waistCm`/`chestCm`/`hipCm`), plus optional `note`, `loggedOnISO`,
  `source: 'manual'`.
- Input is in the user's unit (in for imperial → `inToCm`); display via `formatLength`. Switching units
  never changes stored cm (D7 pattern, same as body weight).
- Card shows **latest** values + **change since first** per metric (needs ≥2 readings of that metric).
- Any one field can be logged (all optional; Save enabled when at least one has a value).

## 4. Progress photos (requirements 8–14)
- Uses `expo-image-picker`: requests media-library permission, opens the library
  (`mediaTypes: ['images']`, quality 0.6), stores **only the local `uri`** (never uploaded).
- Entry: `uri`, optional `angle` (front/side/back — stored null on quick-add; field exists for future),
  optional `note`, `loggedOnISO`.
- Shows the most recent photo (hero) + a small recent grid (newest-first, ≤6). Privacy copy present:
  "Progress photos stay on this device for now."

## 5. Encouraging + empty copy (requirements 14–16)
- "Photos and measurements can show progress the scale misses." (section intro)
- No measurements → "Add measurements when you're ready. No pressure."
- No photos → "Add a progress photo only if it feels helpful."
No judgment, no medical claims, no calorie/diet advice.

## 6. Persistence (B-10 pattern)
`measurements` + `photos` are in `progressStore` (already persisted via AsyncStorage). Added to
`partialize`, so they survive reload. `clear()` (used by `resetLocalAppData`) resets them too. Photo
uris are plain strings → JSON-safe.

## 7. Maps to DB
- `BodyMeasurementEntry` → `body_measurement_logs` (waist_cm, chest_cm, hip_cm, logged_on, source).
- `ProgressPhotoEntry` → `progress_photos` (storage_path ← local uri, pose ← angle, taken_on ← loggedOnISO).
  When a backend arrives, the local uri is uploaded to the private `progress-photos` bucket and the
  storage key replaces the uri. No schema change needed.

## 8. Photo data stays local (verified by design)
`addPhoto` stores the picker's local uri only; nothing sends it anywhere. No network calls in either
card. No face/body analysis, no auto-comparison.

## 9. Robustness (no crash)
`measurementProgress([])` / `photoProgress([])` → nulls/empties (asserted). Picker wrapped in try/catch
+ permission check; cancel is a no-op. Broken/removed uris just render an empty image box (RN `Image`
doesn't throw). Empty states render without any data.

## 10. Risks / notes
- **ImagePicker in Expo Go**: works without a dev build; the `expo-image-picker` config plugin + iOS
  `NSPhotoLibraryUsageDescription` are set for native builds. Not verified on a device here (see §11).
- **Angle** is captured as a field but the quick-add flow stores `null`; a per-angle add is a small
  future enhancement.
- **Local uris are not durable long-term** (OS may clean cached picks); acceptable for MVP, resolved by
  the future upload-to-Storage loop.

## 11. Tests (executed, pure)
`measurementProgress`: empty, single (no change), two (per-metric change), out-of-order sort, partial
metrics needing 2 readings. `photoProgress`: empty, latest = newest, recent newest-first, count, limit.
**12/12 pass.** The picker itself (native) is not node-testable; verified via typecheck.

## 12. Verdict
✅ Log waist/chest/hips (cm canonical), see latest + change, add local photos (uri only), latest photo
+ grid, encouraging + empty copy, persisted, maps to DB. Photos stay local. Scope respected.
