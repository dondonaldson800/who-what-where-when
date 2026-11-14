Who, What, Where, When - $19.99 app (OCR app)

STATUS Nov 12, 2026: rebuilt as a STANDALONE app (no monday.com dependency).
The web app builds clean and the Android (Capacitor) project is ready, but NO
APK/AAB exists yet — the APK build is blocked (see README.md): local Gradle
can't run on this machine (JVM loopback TCP is intercepted by the sandbox),
and there is no GitHub repo for this app yet to run the Actions build.
Next step: create the repo (dondonaldson800/who-what-where-when), push this
folder to main, and the workflow in .github/workflows/android-build.yml will
build the APK/AAB.

- Stripe Payment Link (live): https://buy.stripe.com/7sY8wHeMj8Jl8YR0YkcMM00
  ($19.99 one-time, pre-filled in the app's PaymentShare)
- Leads: stored on-device (localStorage), with a Saved leads list in the app
- Card scan: Gemini gemini-3-flash-preview when a key is set (build env
  VITE_GEMINI_API_KEY or in-app Settings), otherwise on-device OCR (Tesseract)
- Package: com.donsempire.whowhatwherewhen
- Original monday code kept for reference in src/generated/ and src/routes/
