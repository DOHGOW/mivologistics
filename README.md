# Mivo — Truck Booking & Logistics Platform

A full-stack logistics app with three authenticated portals — **customer**,
**driver**, and **admin** — built on React 19 + Vite + TypeScript + Tailwind,
with Firebase (Auth, Firestore, Storage) as the backend, real-time live
tracking on a free OpenStreetMap/Leaflet map, and Paystack + Flutterwave
payment integration.

## What's real vs. demo mode

The app runs in one of two modes, decided automatically by whether Firebase
env vars are set:

- **Live mode** (env vars set): real accounts, real Firestore data, real
  payments, real live tracking. This is what you deploy for the client.
- **Demo mode** (no env vars): the app is still fully clickable — every
  screen renders with sample data — so it can be previewed on a temporary
  URL before a Firebase project exists. Auth "succeeds" instantly, nothing
  persists. A console warning makes it clear demo mode is active.

Everything in this app is wired to real logic — there is no page left as a
static mockup. The exceptions, called out so nothing surprises you later:

- **In-app calling** dials the other party's real phone number via the
  browser's `tel:` link rather than a fake in-call screen — true in-app VOIP
  (Twilio/Agora) is a separate integration, not built here.
- **Payouts to drivers** show a real running balance but the "Request
  Withdrawal" button opens a support contact rather than an automated bank
  transfer — automating that needs Paystack/Flutterwave's *Transfers* API
  running server-side (a secret key must never live in this frontend).
- **Notifications** are written directly from the client for now. For
  production, move notification creation into a Cloud Function triggered by
  booking/payment writes, so a client can't spoof a notification to another
  user.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4 |
| Animation | Motion (Framer Motion) |
| Backend | Firebase Auth, Firestore, Storage |
| Live map | Leaflet + OpenStreetMap (free, no API key) |
| Geocoding | OpenStreetMap Nominatim (free) |
| Payments | Paystack + Flutterwave (inline checkout) |
| Toasts | Sonner |

## 1. Create the Firebase project

The client doesn't have a Firebase project yet, so start here:

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Once created, click the **web** icon (`</>`) to register a web app. Copy
   the `firebaseConfig` values shown — you'll paste these into `.env`.
3. In the left sidebar:
   - **Authentication** → Sign-in method → enable **Email/Password** and **Google**.
   - **Firestore Database** → Create database → start in **production mode** (the rules file in this repo handles security, not the default-open test mode).
   - **Storage** → Get started (needed for driver document uploads — this requires the project to be on the **Blaze** (pay-as-you-go) plan; the free tier covers normal usage for a while, you only pay if you exceed it).
4. Deploy the security rules included in this repo (do this — the default Firestore/Storage rules deny everything, and skipping this step is the most common reason a fresh Firebase setup "doesn't work"):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add        # pick your new project, name it e.g. "production"
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
5. Make your own account an admin: sign up once through the app as a normal
   user, then in the Firestore console open `users/<your-uid>` and change
   `role` from `user` to `admin`. That account can now sign into `/admin/auth`.

## 2. Environment variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

- `VITE_FIREBASE_*` — from step 1.
- `VITE_PAYSTACK_PUBLIC_KEY` — Paystack dashboard → Settings → API Keys (use the **test** public key first, `pk_test_...`).
- `VITE_FLUTTERWAVE_PUBLIC_KEY` — Flutterwave dashboard → Settings → API (use the **test** public key first, `FLWPUBK_TEST-...`).

**Never** put a secret key (`sk_...`, `FLWSECK-...`) in this file or anywhere
in this frontend — secret keys must only run on a server. This app doesn't
verify payments server-side yet; before accepting real money, add a Cloud
Function that calls Paystack/Flutterwave's *verify transaction* endpoint
with the secret key and only then marks a booking as paid.

## 3. Run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`. Without `.env` filled in, it runs in demo
mode automatically — good for a first look at the UI.

## 4. Deploy — Firebase Hosting

Since the backend is already Firebase, hosting the frontend there too means
one project, one login, one deploy command for everything.

```bash
npm install -g firebase-tools   # skip if you already have it from step 1
npm run build
firebase deploy
```

That single `firebase deploy` pushes the built frontend (`dist/`), the
Firestore rules and indexes, and the Storage rules together, because all
four are declared in `firebase.json`. You'll get a URL immediately:

```
https://<your-project-id>.web.app
```

That's the temporary domain to hand to the client. To redeploy after any
change, just repeat `npm run build && firebase deploy`.

If you ever want to deploy *only* the frontend without touching rules
(e.g. after a UI-only change):

```bash
firebase deploy --only hosting
```

Or only the rules after editing `firestore.rules` or `storage.rules`:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

**One more step**: Firebase Hosting's own domain is automatically an
authorized domain for Auth, so Google/email sign-in works immediately —
nothing extra to configure there. If you later attach a custom domain
(Console → Hosting → Add custom domain), Firebase adds it to the
authorized list automatically too.

## 5. Seeding sample trucks

The four default truck categories (Small/Medium/Large/XL Cargo) are seeded
automatically the first time anyone opens the "Select Truck" screen against
an empty `trucks` collection. To change categories or pricing afterward,
use **Admin → Fleet Management** — no need to touch Firestore directly.

## Project structure

```
src/
  firebase.ts             — Firebase init, auth helpers, demo-mode detection
  lib/
    firestore.ts          — typed data-access layer (all collections)
    payments.ts           — Paystack + Flutterwave inline checkout
    storage.ts            — driver document upload helper
    geocode.ts             — free address → lat/lng + distance calc
  contexts/
    AuthContext.tsx        — current user + Firestore profile + role
    BookingContext.tsx     — in-progress booking state
  components/
    ProtectedRoute.tsx      — role-based route guard
    LiveMap.tsx             — Leaflet map (single trip or full fleet)
    Preloader.tsx, Pagination.tsx
  hooks/
    usePaginatedQuery.ts    — cursor pagination for Firestore lists
    useLiveLocationBroadcast.ts — driver's live GPS → Firestore
  pages/                    — customer screens
  pages/driver/             — driver portal
  pages/admin/              — admin portal (lazy-loaded)
firestore.rules             — security rules (role-based, no backdoors)
firestore.indexes.json      — composite indexes the app's queries need
storage.rules               — driver document upload rules
```

## Known gaps for a v2

- Server-side payment verification (Cloud Function + secret key)
- Automated driver payouts via Paystack/Flutterwave Transfers API
- Push notifications (FCM) instead of in-app-only notifications
- Real in-app voice calling (Twilio Voice or Agora)
- A general customer-support inbox separate from per-trip chat
