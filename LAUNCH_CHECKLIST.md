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

- [ ] `npm run dev`, sign up once through the app as a normal user.
- [ ] In Firestore console, open `users/<your-uid>`, change `role` from
      `user` to `admin`.
- [ ] Confirm you can sign into `/admin/auth`.

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

- [ ] `npm run lint` (this project's "lint" is `tsc --noEmit` — there's no
      ESLint configured, so this only catches type errors, not style/logic
      issues).
- [ ] `npm run build` completes clean.
- [ ] Manually click through all three portals (customer / driver / admin)
      against live Firebase, not demo mode.
- [ ] `firebase deploy` (deploys hosting + firestore rules/indexes together,
      per `firebase.json`).
- [ ] Note: there is no automated test suite in this repo — verification is
      manual click-through only.

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
