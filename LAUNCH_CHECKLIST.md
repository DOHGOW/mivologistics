# Launch checklist

Status as of 2026-08-26. Repo: https://github.com/DOHGOW/mivologistics.
Firebase project: `mivologisticsv2` (linked via `.firebaserc`, config in local `.env`).
Vercel Blob project: `mivologistics` (https://mivologistics.vercel.app), root
directory `vercel-blob-api`.

## 0. Blockers — do these first (console only, can't be done via CLI)

The Firebase project exists and has a registered web app, but Firestore
isn't provisioned yet. `firebase deploy` will fail until this is done
manually at [console.firebase.google.com/project/mivologisticsv2](https://console.firebase.google.com/project/mivologisticsv2):

- [x] **Firestore** → Firestore Database → Create database → **production
      mode**. Done — `firestore.rules` and `firestore.indexes.json` are
      deployed and live.
- [x] **Authentication** → Sign-in method → enable **Email/Password** and
      **Google**. Done.

**Storage note:** Firebase Storage setup was dropped from this project —
the Google Cloud billing account for this Firebase project couldn't be
created (`OR_BACR2_44` error, likely a regional card-billing issue) and
Storage requires the Blaze plan. Driver document uploads now go through
**Vercel Blob** instead, which needs no Firebase billing. See section 1.

## 1. Vercel Blob (driver document storage)

- [x] Imported this GitHub repo as a Vercel project (`mivologistics`) with
      **Root Directory** set to `vercel-blob-api`.
- [x] Created a **public** Blob store and connected it (`BLOB_READ_WRITE_TOKEN`
      set automatically).
- [x] Added `FIREBASE_API_KEY` on the Vercel project.
- [x] `VITE_BLOB_UPLOAD_API_URL` set in `.env` to
      `https://mivologistics.vercel.app/api/upload-token`.
- [x] Tested end to end with an automated browser run: registered a test
      driver, uploaded a document, got a real 200 from the endpoint and the
      "Uploaded" status. Confirmed working.

## 2. Make your account admin

- [x] Signed up through the app, flipped `role` to `admin` in the Firestore
      console, confirmed login at `/admin/auth` routes into the admin
      dashboard. Done.

## 3. Payments

- [ ] Paystack dashboard → Settings → API Keys → copy the **test** public
      key (`pk_test_...`) into `.env` as `VITE_PAYSTACK_PUBLIC_KEY`.
- [ ] Flutterwave dashboard → Settings → API → copy the **test** public key
      (`FLWPUBK_TEST-...`) into `.env` as `VITE_FLUTTERWAVE_PUBLIC_KEY`.
- [ ] Run a full test booking + checkout end to end in **live mode** (not
      demo) for both gateways.
- [ ] Before accepting real money: swap test keys for live keys, and see
      the server-side verification item in section 5 — right now nothing
      verifies a payment actually succeeded server-side.

## 4. Pre-deploy sanity

- [x] `npm run lint` (`tsc --noEmit`) — clean.
- [x] `npm run build` — clean (note: no ESLint configured, so lint only
      catches type errors, not style/logic issues).
- [x] Click-through smoke test — automated via a throwaway Playwright script
      (not committed) against **live Firebase**, not demo mode: customer
      sign-up → Home, driver sign-up → document upload (real Vercel Blob
      round trip), admin login page render. Zero console errors across all
      of it. Re-ran the driver document upload specifically against the
      deployed production URL (not just localhost) to confirm CORS/auth
      work from the real domain too — confirmed.
- [x] `firebase deploy` — live at https://mivologisticsv2.web.app.
- [x] **Deeper pass: full booking creation flow**, tested end-to-end against
      live Firebase (real Nigerian addresses, real Nominatim geocoding, real
      distance calc, real Firestore write, real navigation to
      booking-success). This surfaced and fixed two launch-blocking bugs —
      see below. Re-verified passing after both fixes; redeployed.
- [ ] Still not covered by the deeper pass: chat, live tracking map, and
      admin actions (approving a driver, dispatch). Those need either your
      admin session or two simultaneous roles (customer + driver on one
      trip) to exercise properly — worth a manual pass. Payment checkout
      (Paystack/Flutterwave) is intentionally deferred to the Payments step.
- Note: there is no automated test suite in this repo — verification above
  was one-off scripted smoke testing, not a repeatable suite.

**Bugs found and fixed during the deeper pass:**

- [x] **Truck selection screen was completely broken for every real
      customer.** `seedTrucksIfEmpty()` ([firestore.ts:242](src/lib/firestore.ts#L242))
      writes directly to the `trucks` collection, but `firestore.rules`
      restricts that write to admins. On this fresh project (empty `trucks`
      collection), any customer's first visit to Select Truck threw a
      permission-denied — and because the surrounding `try/finally` in
      [SelectTruck.tsx](src/pages/SelectTruck.tsx) had no `catch`, the
      fallback truck list never rendered either. Result: a blank screen,
      zero trucks, for anyone. Fixed by only attempting the seed when the
      signed-in user is an admin, and adding a catch that always falls back
      to the hardcoded truck list on any Firestore error.
      **Follow-up**: the real `trucks` collection in Firestore is still
      empty — customers currently see the client-side fallback catalog,
      which works but isn't reflected in Admin → Fleet Management. Visiting
      Fleet Management once as the admin account will auto-seed it for real.
- [x] **Cash on Delivery could never create a booking.** `Payment.tsx` set
      `paymentMethod: undefined` for COD bookings, and Firestore's
      `addDoc()` rejects any field value of `undefined` outright — every
      COD attempt crashed with "Unsupported field value: undefined" instead
      of creating a booking. Fixed by omitting the key entirely for COD
      (it's optional on the `Booking` type) instead of setting it to
      `undefined`.

## 5. Known gaps before this is production-hardened

Carried over from the README, worth tracking explicitly:

- [ ] **Server-side payment verification** — add a Cloud Function that calls
      Paystack/Flutterwave's *verify transaction* endpoint with the secret
      key before marking a booking paid. Currently a client could mark
      itself "paid" without having actually paid.
- [ ] **Notifications written server-side** — move notification creation
      into a Cloud Function triggered by booking/payment writes, so a
      client can't spoof a notification to another user.
- [ ] **Automated driver payouts** — "Request Withdrawal" currently opens a
      support contact instead of calling Paystack/Flutterwave's Transfers
      API.
- [ ] **Push notifications (FCM)** instead of in-app-only.
- [ ] **Real in-app voice calling** (Twilio Voice or Agora) — currently a
      `tel:` link.
- [ ] Dedicated customer-support inbox separate from per-trip chat.
- [ ] **Admin can't actually view uploaded documents.** `DocumentUpload.tsx`
      keeps each document's URL only in local component state — it's never
      written to Firestore. `admin/Compliance.tsx` approves/rejects drivers
      based on `documentsStatus` alone, with no image/file to inspect. This
      predates the Vercel Blob change (same gap existed with Firebase
      Storage) but is worth fixing before documents actually need reviewing:
      persist each doc's URL (e.g. a `documents: { license: url, ... }` map
      on the driver profile) when upload completes.

## 6. Nice-to-haves worth deciding on before go-live

- [ ] Custom domain for Hosting (Firebase auto-adds it to Auth's authorized
      domains when added via console).
- [ ] Restrict the Vercel Blob API's CORS to the real production domain via
      the `ALLOWED_ORIGIN` env var on that Vercel project (defaults to
      reflecting whatever origin calls it, which is fine for testing but
      worth tightening for launch).
- [ ] Error monitoring (e.g. Sentry) — nothing is currently wired in.
- [ ] Firestore backup/export strategy.
