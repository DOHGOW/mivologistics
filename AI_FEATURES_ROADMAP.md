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

## 🟢 Buildable now

- [ ] **Backhaul/return-load matching** — surface bookings whose destination
      is near a driver's current drop-off point, so return legs aren't
      empty. Pure logic over the existing `bookings` collection.
- [ ] **Driver behavior/trust scoring** — compute a basic score (speed
      spikes, erratic route deviation) from the `driverLocations` pings
      already being written during live tracking. No new data source.
- [ ] **AI document verification (fixing the gap flagged earlier)** — before
      any smart verification, the underlying bug still needs fixing:
      `DocumentUpload.tsx` never persists a document's URL to Firestore, so
      there's nothing for a reviewer (human or AI) to check yet. That part
      is 🟢 buildable now; the "AI" part (OCR/forgery detection) is 🟡, see
      below.
- [ ] **Photo-based cargo condition comparison** — same story: capturing
      before/after photos into a booking record is 🟢 buildable now; having
      something *look* at them and flag damage is 🟡.

## 🟡 Needs an AI provider key first

These all need a vision/LLM API — none is currently wired into this app.
Tell me which provider (Claude, OpenAI, etc.) and I'll wire it in.

- [ ] AI document verification (OCR + expiry/forgery flags on license,
      insurance, registration, permit)
- [ ] Driver identity liveness check (selfie match at trip start)
- [ ] Photo-based cargo damage detection (before/after comparison)
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

1. Backhaul matching (🟢, high value, no dependencies)
2. Driver behavior scoring from existing GPS data (🟢)
3. Fix document-URL persistence so there's something to review (🟢) — then
   revisit AI document verification once a provider is chosen (🟡)
4. Everything else, sequenced once the 🟡/🔴 blockers are resolved
