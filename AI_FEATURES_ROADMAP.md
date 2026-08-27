# AI features roadmap

Tracks the "futuristic AI-powered logistics platform" feature list. Status
as of 2026-08-26. Each item is tagged with what it actually needs, since
"AI-powered" covers a wide range of real effort:

- 🟢 **Buildable now** — pure logic/data on what already exists in this repo, no new credentials or vendor contracts.
- 🟡 **Needs an AI provider key** — genuinely blocked until an LLM/vision API is chosen and a key is supplied (nothing in this stack currently calls out to one).
- 🔴 **Needs external infrastructure or a business decision** — a vendor contract, government API access, or hardware that has to exist before any code is useful. Not something that gets "implemented" by writing more TypeScript.

## Done

- [x] **Multi-step driver onboarding** (biodata → truck info → truck photos)
      — see `src/pages/driver/DriverOnboarding.tsx`. Deployed and tested
      end-to-end.
- [x] **Document-review gap fixed** — uploaded documents/truck photos now
      persist to Firestore and render in `admin/Compliance.tsx` as an
      expandable panel (biodata, truck details, photos, KYC docs), instead
      of vanishing into local component state. Verified by reading the
      persisted record back after a real upload.
- [x] **AI document verification** — Google Gemini (free tier, no Google
      Cloud billing needed, which matters given this project's billing
      signup is otherwise blocked). "AI Check" button per document in
      Compliance runs an advisory pre-check (readable? right doc type?
      expired? name?) — never auto-approves/rejects, a human admin always
      decides. Verified end-to-end with a real Gemini call.

## 🟢 Buildable now

- [x] **Backhaul/return-load matching** — done. Driver Dashboard grabs one
      free geolocation fix on going online, sorts pending jobs by distance
      from the driver, and badges ones within 15km as a Backhaul Match.
- [x] **Driver behavior/trust scoring** — done. `lib/safety.ts` computes a
      0-100 score from GPS speed samples (harsh speeding/braking), now
      logged per-trip to a new `driverLocations/{bookingId}/pings`
      subcollection and shown on the trip-completed modal.
- [x] **Document persistence for review** — done (see above). The "AI" part
      (OCR/forgery detection) is still 🟡, see below.
- [ ] **Photo-based cargo condition comparison** — capturing before/after
      photos into a booking record is 🟢 buildable now; having something
      *look* at them and flag damage is 🟡.

## 🟡 Needs an AI provider key first

These all need a vision/LLM API — none is currently wired into this app.
Given the free/free-tier constraint (this is a startup, and this project's
Google Cloud billing is already blocked — see the Storage section of
LAUNCH_CHECKLIST.md), **Google Gemini via AI Studio is the pick**: its free
tier needs no billing account at all (unlike Google Cloud Vision, OpenAI, or
Claude, which either require billing enabled or have no ongoing free tier),
and it supports image input — covering both OCR-style document checks and
photo damage comparison from one provider. Trade-off: free tier is rate
limited (fine for an MVP's volume, not for scale) and quality on Nigerian
Pidgin/Hausa/Yoruba/Igbo is untested and likely uneven.

- [x] Driver identity liveness check — done (Gemini, advisory, optional
      selfie-vs-license comparison at trip start). Explicitly framed as not
      a biometric/legal determination, doesn't gate trip progression.
- [x] Photo-based cargo damage detection — done (Gemini, advisory,
      shown on the driver's trip-completed modal). Optional capture, not
      gating "Confirm Pickup"/"Confirm Delivery".
- [ ] Multi-language voice/chat assistant (Pidgin/Hausa/Yoruba/Igbo)
- [ ] AI credit-scoring model itself (the *scoring logic* — see below for
      why *offering* credit is a bigger, separate problem)

## 🔴 Needs external infrastructure or a business decision

Flagging these plainly rather than quietly building a fake version:

- [ ] **Crowdsourced route-risk scoring** — needs either a real incident-report
      pipeline (driver-submitted + moderated) or a licensed news/data feed.
      Can prototype with driver-submitted reports only; a truly useful
      version needs real data volume over time.
- [ ] **Convoy matching** — a real feature once there's real trip-timing
      data at scale; not fakeable meaningfully with today's traffic volume.
- [ ] **Fuel-aware dynamic pricing** — needs a real-time fuel price feed
      (NNPC/marketer data) or manual admin-entered price. The admin-entered
      version is actually 🟢 buildable now if you want a v1 of this instead
      of waiting on a data feed.
- [ ] **USSD/SMS fallback booking** — requires a telco/aggregator contract
      (e.g. Africa's Talking, Termii) with a registered short code. Real
      money and paperwork, not just code.
- [ ] **Axle-load/weighbridge compliance** — requires FRSC/state weighbridge
      API access, which likely doesn't exist publicly. Needs a government
      or logistics-data partnership first.
- [ ] **Predictive maintenance from OBD-II telemetry** — requires drivers to
      actually have OBD-II dongles reporting data. Hardware rollout, not
      software.
- [ ] **AI credit scoring / earned-wage access** — the scoring model is
      buildable (🟡 above), but actually extending credit or advancing wages
      needs a lending partner or your own capital + regulatory footing
      (CBN lending rules apply). This is a business decision, not a build.
- [ ] **Offline-first PWA** — technically buildable now (service worker +
      IndexedDB caching), but it's a meaningfully large architecture change
      to the whole app, not a quick add — sizing it separately if you want
      to prioritize it.

## Suggested order

1. ~~Backhaul matching~~ — done
2. ~~Driver behavior scoring~~ — done
3. ~~Fix document-URL persistence~~ — done
4. Everything else, sequenced once the 🟡/🔴 blockers are resolved (needs an
   AI provider decision, or a vendor/infra decision — see above)
