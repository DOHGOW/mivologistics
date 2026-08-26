# Launch checklist

Status as of 2026-08-26. Repo: https://github.com/DOHGOW/mivologistics.
Firebase project: `mivologisticsv2` (linked via `.firebaserc`, config in local `.env`).

## 0. Blockers — do these first (console only, can't be done via CLI)

The Firebase project exists and has a registered web app, but the actual
services are not provisioned yet. `firebase deploy` will fail until these
are done manually at [console.firebase.google.com/project/mivologisticsv2](https://console.firebase.google.com/project/mivologisticsv2):

- [ ] **Firestore** → Firestore Database → Create database → **production
      mode**. (Confirmed missing: `firestore:databases:create` returned
      "Cloud Firestore API has not been used in this project".)
- [ ] **Storage** → Get started. Requires the project to be on the **Blaze**
      (pay-as-you-go) plan. (Confirmed missing: deploy attempt returned
      "Firebase Storage has not been set up on project mivologisticsv2".)
- [ ] **Authentication** → Sign-in method → enable **Email/Password** and
      **Google**. (Not checkable via CLI — verify in console.)

Once all three are done, run:
```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```
This pushes `firestore.rules`, `firestore.indexes.json`, and `storage.rules`
from this repo in one shot.

## 1. Make your account admin

- [ ] `npm run dev`, sign up once through the app as a normal user.
- [ ] In Firestore console, open `users/<your-uid>`, change `role` from
      `user` to `admin`.
- [ ] Confirm you can sign into `/admin/auth`.

## 2. Payments

- [ ] Paystack dashboard → Settings → API Keys → copy the **test** public
      key (`pk_test_...`) into `.env` as `VITE_PAYSTACK_PUBLIC_KEY`.
- [ ] Flutterwave dashboard → Settings → API → copy the **test** public key
      (`FLWPUBK_TEST-...`) into `.env` as `VITE_FLUTTERWAVE_PUBLIC_KEY`.
- [ ] Run a full test booking + checkout end to end in **live mode** (not
      demo) for both gateways.
- [ ] Before accepting real money: swap test keys for live keys, and see
      the server-side verification item in section 4 — right now nothing
      verifies a payment actually succeeded server-side.

## 3. Pre-deploy sanity

- [ ] `npm run lint` (this project's "lint" is `tsc --noEmit` — there's no
      ESLint configured, so this only catches type errors, not style/logic
      issues).
- [ ] `npm run build` completes clean.
- [ ] Manually click through all three portals (customer / driver / admin)
      against live Firebase, not demo mode.
- [ ] `firebase deploy` (deploys hosting + firestore rules/indexes + storage
      rules together, per `firebase.json`).
- [ ] Note: there is no automated test suite in this repo — verification is
      manual click-through only.

## 4. Known gaps before this is production-hardened

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

## 5. Nice-to-haves worth deciding on before go-live

- [ ] Custom domain for Hosting (Firebase auto-adds it to Auth's authorized
      domains when added via console).
- [ ] Billing alert on the Blaze plan so Storage/Firestore overage doesn't
      surprise anyone.
- [ ] Error monitoring (e.g. Sentry) — nothing is currently wired in.
- [ ] Firestore backup/export strategy.
