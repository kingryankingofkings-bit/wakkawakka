# Batch 6 Code Review Report — Live Streaming & Video Platform

## Review Summary

**Verdict**: REQUEST_CHANGES

The Batch 6 implementation provides robust SQLite persistence for chat comments, real transactional payout distributions for stream predictions, and correct status mapping for co-hosting. However, a critical authorization bypass exists in the co-hosting acceptance API, and input validation gaps exist in the gifts/bits API which allow `NaN` values to bypass positive checks. Changes are required to address these security and robustness concerns.

---

## Findings

### [Major] Finding 1: Authorization Bypass in Co-Hosting Acceptance API

- **What**: Any authenticated user can accept co-hosting invitations on behalf of any other user.
- **Where**: `src/app/api/live/streams/[id]/cohost/route.ts` (lines 73–101)
- **Why**: The accept action determines the target user ID via `const targetUserId = userId || requesterId;` but never validates that the `requesterId` matches `targetUserId`. A malicious user or the stream host can submit a POST request with `action: "ACCEPT"` and `userId` set to a target victim's ID, and the backend will mark the co-host invitation as accepted without the victim's consent.
- **Suggestion**: Add a validation check to ensure that the requester is the one accepting the invitation:
  ```typescript
  if (targetUserId !== requesterId) {
    return NextResponse.json(
      { error: "You can only accept your own co-host invitations" },
      { status: 403 },
    );
  }
  ```

### [Minor] Finding 2: `NaN` Validation Bypass in Gifts API

- **What**: Non-numeric inputs (like `"NaN"` or `"abc"`) bypass the positive amount validation.
- **Where**: `src/app/api/live/streams/[id]/gifts/route.ts` (lines 29–31)
- **Why**: The check uses `Number(amount) <= 0 || Number(quantity) <= 0`. In JavaScript, `NaN <= 0` evaluates to `false`. As a result, non-numeric values pass this check and the subsequent balance check (since `user.channelPoints < NaN` is also `false`), leading to `NaN` increments/decrements in database fields or database-level errors.
- **Suggestion**: Explicitly check for `isNaN` in addition to non-positive checks:
  ```typescript
  const amt = Number(amount);
  const qty = Number(quantity);
  if (isNaN(amt) || isNaN(qty) || amt <= 0 || qty <= 0) {
    return NextResponse.json(
      { error: "amount and quantity must be positive numbers" },
      { status: 400 },
    );
  }
  ```

### [Minor] Finding 3: Type Safety Gaps on Prediction Bets Check

- **What**: Points validation check does not fully enforce primitive type restrictions on arrays/objects.
- **Where**: `src/app/api/live/streams/[id]/predictions/route.ts` (line 119)
- **Why**: The verification logic uses `typeof points === 'number'` as part of its integer checks, but fails to prevent non-primitive arrays/objects that convert to integers (e.g. `points = [10]` converts to `10` and bypasses the type restriction).
- **Suggestion**: Enforce strict validation of properties using Zod schemas or check `typeof points === 'number'` directly for the entire parameter check.

---

## Verified Claims

- **SQLite persistence for chat comments** → verified via `tests/e2e_runner.js` and manual file code inspection of `src/app/api/live/streams/[id]/chat/route.ts` → **PASS**. Chat messages are successfully queried and written to the SQLite `LiveStreamChatMessage` database.
- **Positive value validation on gifts/bits API (negative cases)** → verified via `tests/adversarial.js` and manual code inspection → **PASS**. Negative values are successfully blocked with a 400 status.
- **Co-hosting status mapping (PENDING to ACCEPTED)** → verified via `tests/e2e_runner.js` → **PASS**. Invites successfully initiate in a `PENDING` state and transition to `ACCEPTED`.
- **Transactional payout distributions for predictions** → verified via `tests/e2e_runner.js` and inspection of `src/app/api/live/streams/[id]/predictions/route.ts` → **PASS**. Distributions are handled within a single Prisma `$transaction` block, ensuring atomic balance updates and status changes.

---

## Coverage Gaps

- **Socket.io connection state verification** — risk level: Low — recommendation: Although Socket.io dependencies are configured and used in the main chat framework, Socket event handling triggers were not stress-tested in the adversarial tests. This is acceptable for api-only verification but should be checked in UI integration phases.

---

## Unverified Items

- **Real RTMP stream broadcasting** — reason not verified: Testing only covers HTTP control plane and DB persistence endpoints. Media server configuration and actual video ingestion are outside the scope of local integration tests.

---

---

# Adversarial Challenge Report

## Challenge Summary

**Overall risk assessment**: MEDIUM

While the transactional logic and database state transitions are resilient under standard workflows, the authorization model on co-hosting accepts and non-numeric inputs on gifts present security and consistency risks that need to be locked down.

---

## Challenges

### [High] Challenge 1: Force Co-Hosting Invitation Acceptance

- **Assumption challenged**: Only the invited user can consent to and accept a co-hosting invitation.
- **Attack scenario**: A stream host sends an invitation to `victim_user`. The host then immediately fires a request to `/api/live/streams/[id]/cohost` with body `{ action: "ACCEPT", userId: "victim_user" }`. Because the API does not verify the caller's identity against the target user, the backend changes the status to `ACCEPTED` and lists the victim as a co-host without their consent.
- **Blast radius**: High. Hijacks user profile states and forces users into co-hosting roles without permission.
- **Mitigation**: Add identity check: `if (targetUserId !== requesterId) throw new Error('Forbidden');`

### [Medium] Challenge 2: NaN Point Tipping / Gift Exploits

- **Assumption challenged**: Only positive numeric balances can be spent on gifts.
- **Attack scenario**: A user sends `{ giftName: "Diamond", amount: "NaN" }`. The backend passes the positive check, skips the balance check (since `points < NaN` is false), and updates both the user's balance and stream total.
- **Blast radius**: Medium. Leads to SQLite/Prisma exceptions or corrupts balance values with `NaN` in database tables.
- **Mitigation**: Add strict `isNaN` checks on inputs before calculations.

---

## Stress Test Results

- **Negative points bet** → expected: 400 rejection → actual: 400 rejection → **PASS**
- **Decimal point bet** → expected: 400 rejection → actual: 400 rejection → **PASS**
- **Double betting (sequential)** → expected: second bet rejected with 400 → actual: rejected with 400 → **PASS**
- **Double betting (concurrent)** → expected: database unique constraint blocks double bet creation → actual: unique constraint prevents double bet → **PASS**
- **Negative gift amount** → expected: 400 rejection → actual: 400 rejection → **PASS**
- **NaN/non-numeric gift amount** → expected: 400 rejection → actual: bypassed validation and calculation → **FAIL**

---

## Unchallenged Areas

- **RTMP playback server** — reason not challenged: Beyond local test capability.
