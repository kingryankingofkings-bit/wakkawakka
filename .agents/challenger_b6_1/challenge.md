# Challenger Report: Batch 6 Features Verification

**Overall risk assessment**: CRITICAL

This report validates the correctness of the Batch 6 features (including prediction odds payouts, bits/gifts transactions, and `/raid` command handlers) in the `wakkawakka` repository, evaluates the completeness of the E2E tests, and records typescript/lint/build validation results.

---

## 1. Challenge Summary

We performed an adversarial analysis of the Batch 6 streaming endpoints and found critical vulnerabilities in the code logic. Specifically, three major logic/security issues exist:

1. **Infinite Channel Points Exploit**: The gifts endpoint does not validate negative input amounts, allowing users to arbitrarily mint points.
2. **Co-host Hijacking**: The cohost acceptance route does not check for the presence of a host's invitation, letting any user join any stream as a co-host.
3. **Host Conflict-of-Interest**: Prediction bet placing does not block the host from participating in their own predictions, which they alone resolve.

In terms of build verification, while typescript checking (`npm run type-check`) and linting (`npm run lint`) pass, the Next.js production build (`npm run build`) fails on Windows because Next's build-trace tool is unable to find the default `_not-found` page's NFT manifest.

---

## 2. Challenges

### [Critical] Challenge 1: Infinite Channel Points Exploit in `/api/live/streams/[id]/gifts`

- **Assumption challenged**: The endpoint assumes all client-specified gift amounts and quantities are positive.
- **Attack scenario**: A user sends a POST request to `/api/live/streams/[id]/gifts` with a body like `{"giftName": "Rocket", "amount": -1000, "quantity": 1}`. The endpoint calculates `totalCost = -1000`. The user points check `user.channelPoints < -1000` evaluates to `false`. Prisma then decrements the user's channelPoints by `-1000`, effectively adding `1000` points to their balance.
- **Blast radius**: Allows any authenticated user to generate unlimited channel points out of thin air.
- **Mitigation**: Add validation to ensure `Number(amount) > 0` and `Number(quantity) > 0` before calculating `totalCost`.

### [High] Challenge 2: Co-host Hijacking in `/api/live/streams/[id]/cohost`

- **Assumption challenged**: The API assumes that `ACCEPT` action is only called after a host has invited a co-host.
- **Attack scenario**: A malicious user calls `/api/live/streams/[id]/cohost` with `{"action": "ACCEPT"}`. Because there is no check in the database or route handler that a co-host record was previously created under an "invited" state, the handler upserts a `LiveStreamCoHost` record immediately, making the user an active co-host.
- **Blast radius**: Any viewer can force themselves to become a co-host on any stream, obtaining co-hosting status/privileges without host authorization.
- **Mitigation**: Introduce a status field (e.g. `status: 'INVITED' | 'ACTIVE'`) in the `LiveStreamCoHost` model, and check that a record exists with status `INVITED` before allowing `ACCEPT`.

### [Medium] Challenge 3: Prediction Host Conflict-of-Interest

- **Assumption challenged**: The prediction system assumes participants are fair and impartial.
- **Attack scenario**: A host creates a prediction, places a massive bet on option A, and then uses their host privilege to resolve the prediction in favor of option A. The API route for placing bets does not verify whether `userId` equals `stream.hostId`.
- **Blast radius**: Host can artificially extract/steal channel points from other viewers by rigging predictions.
- **Mitigation**: Block the host (`stream.hostId === userId`) from placing bets in `predictions/route.ts` under the `BET` action.

### [High] Challenge 4: Build Failure on Windows due to Default `_not-found` Page

- **Assumption challenged**: Next.js production build can succeed on Windows without a custom `not-found.tsx` page.
- **Attack scenario**: Running `npm run build` results in Next.js attempting to trace NFT dependencies. The build fails with `ENOENT: no such file or directory, open '.next\server\app\_not-found\page.js.nft.json'` because App Router lacks a custom `not-found.tsx` file, and Windows environment file locking or separator handling breaks the default fallback tracing.
- **Blast radius**: The application cannot be compiled for production in the current state on Windows systems.
- **Mitigation**: Create an empty or styled `src/app/not-found.tsx` to force Next.js to compile a physical page, bypassing default fallback tracing.

---

## 3. Stress Test Results

- **Scenario 1: Negative Gift Amount Tipped**
  - **Expected Behavior**: API rejects the request with a `400 Bad Request` code indicating invalid amounts.
  - **Actual/Predicted Behavior**: API processes the request, deducts a negative value (adding positive balance), and updates database state.
  - **Result**: **FAIL**

- **Scenario 2: Accept Cohost Invitation without Host Invite**
  - **Expected Behavior**: API rejects the accept request with `403 Forbidden` or `404 Not Found` because no invitation was sent.
  - **Actual/Predicted Behavior**: API upserts and returns the active `LiveStreamCoHost` record.
  - **Result**: **FAIL**

- **Scenario 3: Host Places Bet on Own Prediction**
  - **Expected Behavior**: API blocks the host from betting with `403 Forbidden`.
  - **Actual/Predicted Behavior**: API accepts the bet and deducts points from the host's balance.
  - **Result**: **FAIL**

- **Scenario 4: Next.js Production Build (`npm run build`)**
  - **Expected Behavior**: Compilation completes and creates optimized output.
  - **Actual/Predicted Behavior**: Fails with `ENOENT` for `_not-found\page.js.nft.json`.
  - **Result**: **FAIL**

---

## 4. Build and Test Verification Results

### typescript Check (`npm run type-check`)

- **Status**: **PASS**
- **Command executed**: `npm run type-check` (runs `tsc --noEmit`)
- **Output**: Succeeded without compile errors.

### Linter Check (`npm run lint`)

- **Status**: **PASS**
- **Command executed**: `npm run lint` (runs `next lint`)
- **Output**: Succeeded with some standard Next/React code warnings (e.g., using `<img>` instead of `<Image />`), but no errors.

### E2E Test Suite (`node tests/e2e_runner.js`)

- **Status**: **PASS**
- **Command executed**: `node tests/e2e_runner.js`
- **Output**: All 13 tests passed, including `Batch 6 Live Streaming & Video Platform Integration Workflow`!

---

## 5. Unchallenged Areas

- **Real-Time Concurrency**: Real-time Socket.io packet collisions and connection drop scenarios were not challenged due to the headless CLI test environment.
- **Video Playback/VOD S3 Storage**: Real upload/download latency to AWS S3 was simulated using static mock URLs.

---

## 6. Verification Method

To verify these findings:

1. Run E2E tests: `node tests/e2e_runner.js`
2. Run Typecheck: `npm run type-check`
3. Run Linter: `npm run lint`
4. Re-run Build to observe the `_not-found` error: `npm run build`
