# Who, What, Where, When — standalone app

Mobile lead capture for business people at events. Scan a business card (OCR),
collect name / email / phone / company, save the lead, see potential revenue,
and share a Stripe payment link for the deal.

**Price: $19.99 one-time** — the live Stripe Payment Link is
https://buy.stripe.com/7sY8wHeMj8Jl8YR0YkcMM00
(Don's Empire Stripe account, product "Who, What, Where, When",
Payment Link ID plink_1Uay0a1bmDrEaLqEPiZlZkJf). The app pre-fills this link
in PaymentShare; the user can still change it in the app.

## What this is

A standalone rebuild of the monday.com Vibe app "Click" (Vibe app ID 10570508).
The monday export is kept for reference under `src/generated/` and `src/routes/`
— those files are NOT compiled (excluded in tsconfig.json). The standalone app
lives in `src/` (App.tsx, components/, lib/) and has zero monday dependencies.

## How the monday pieces were replaced

- **Leads storage** (`@api/BoardSDK` → `src/lib/leads.ts`): leads are stored in
  localStorage on the device (key `wwww-leads-v1`). Fields: name, email, phone,
  company, type (Lead/Prospect/Partner), priority (High/Medium/Low), deal value,
  event, notes, date. Revenue summary (total, forecast, by priority, by type,
  per-event) is computed locally. A "Saved leads" list with delete is included.
- **Card scanning** (`@skills/document-extract-fullstack` → `src/lib/ocr.ts`):
  - If a Gemini API key is configured, scanning uses Gemini
    `gemini-3-flash-preview` (the verified-working model) via the REST API.
    The key comes from the build-time env var `VITE_GEMINI_API_KEY`, or from
    the Settings field in the app (stored in localStorage as `wwww-gemini-key`).
    No key is hardcoded anywhere.
  - Otherwise scanning falls back to on-device OCR (Tesseract.js v5). The
    first scan downloads the ~3 MB English language data from the jsDelivr CDN,
    so the first scan needs internet. A Gemini key is recommended for accuracy.
  - Verified Nov 12, 2026 with a generated test business card: Tesseract read
    all lines correctly and the parser extracted name "Jordan Lee", email
    "jordan@acmecorp.com", phone "(555) 123-4567", company "Acme Corp".
- **Providers** (`@vibe/db/client`, Monday context/theme): removed. Plain Vite
  + React app, Tailwind v4, same "Acid Lime" theme tokens as the original.
- **PaymentShare**: defaults to the real $19.99 Stripe link above (saved to
  localStorage on first run); the user can override it in the app.

## Build

- Web: `bun install && bun run build` (or `npm install && npm run build`).
  Output: `dist/` — verified to contain the Stripe link and zero monday refs.
- Android: `npx cap sync android`, then build with Gradle (see below).
  Capacitor 8, package `com.donsempire.whowhatwherewhen`, app name
  "Who, What, Where, When", compileSdk/targetSdk 36, minSdk 24.
  The Android project is in `android/` and is ready to build.

## Getting the APK — current status (Nov 12, 2026)

The web app builds and the Android project is complete, but **no APK exists yet**
because both build routes are blocked from this machine:

1. **Local Gradle build — BLOCKED.** The sandbox intercepts TCP connections
   from JVM processes to localhost (the Gradle launcher gets a policy message
   starting "muse: Other TCP ..." instead of reaching the Gradle daemon), so
   `./gradlew assembleDebug` fails with "Could not receive a message from the
   daemon" / "Unexpected type tag 109". Python loopback TCP works; JVM loopback
   does not. This is a sandbox limitation, not a project problem.
2. **GitHub Actions — needs a repo.** No repo exists for this app yet, and the
   GitHub connector cannot create one (`create_repository` → 403 "Resource not
   accessible by integration"). The workflow is ready at
   `.github/workflows/android-build.yml` (same pattern as the Don's empire repo:
   Node 22, JDK 21, `npm install`, `npm run build`, `npx cap sync android`,
   `assembleDebug` + `bundleDebug`, upload APK/AAB artifacts).

**Next step (needs a human / the main agent):** create a repo for this app on
GitHub (e.g. `dondonaldson800/who-what-where-when`, private is fine), push this
folder's contents to `main` (website upload works — same as Don's empire), and
let the Actions workflow build the APK/AAB. Set the repo secret
`VITE_GEMINI_API_KEY` to bake Gemini card scanning into the build; without it
the app still works via on-device OCR, and a key can be entered in Settings.
The workflow will produce a debug-signed APK/AAB (same as Don's empire builds).

## Files

- `src/` — standalone app source (the build input)
- `src/generated/`, `src/routes/` — original monday export (reference only)
- `dist/` — production web build
- `android/` — Capacitor Android project (synced from `dist/`)
- `.github/workflows/android-build.yml` — GitHub Actions APK/AAB build
- `capacitor.config.json` — appId `com.donsempire.whowhatwherewhen`
