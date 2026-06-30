# Challenger Report — Batch 6 Adversarial Verification

This report documents the adversarial review and boundary testing of Batch 6 features (Live Streaming & Video Platform, Predictions, Channel Points, Tipping, and Gifts) in the Wakka Wakka repository.

---

## Challenge Summary

**Overall Risk Assessment**: **CRITICAL**

We identified a critical currency exploit in the live streaming gifts API and a data type boundary validation bug in the predictions betting API. The tipping validation limit behaves correctly, and double-betting is successfully blocked at the database level but returns an unhandled 500 error under concurrency.

---

## Attack Surface & Findings

### 1. [Critical] Live Stream Gifts Negative Amount Exploit

- **Vulnerability Found**: The `/api/live/streams/[id]/gifts` endpoint does not validate that `amount` or `quantity` are positive values.
- **Attack Scenario**: An attacker sends a gift with a negative amount (e.g., `amount: -100`, `quantity: 1`).
- **Blast Radius**: The system calculates `totalCost = amount * quantity = -100`. It then runs:
  ```typescript
  prisma.user.update({
    where: { id: userId },
    data: { channelPoints: { decrement: totalCost } }, // decrements -100, which increments the balance by 100
  });
  ```
  This allows users to generate infinite channel points.
- **Mitigation**: Add validation in `/api/live/streams/[id]/gifts/route.ts` to ensure `amount > 0` and `quantity > 0`.

### 2. [Medium] Predictions Floating-Point Bet Boundary Bypass

- **Vulnerability Found**: The `/api/live/streams/[id]/predictions` endpoint (action: `BET`) checks `isNaN(pointsToBet) || pointsToBet <= 0` but does not verify if the input is an integer.
- **Attack Scenario**: A user places a bet of `10.5` points.
- **Blast Radius**: The database stores channel points as an `INTEGER` (Int). When Prisma performs the decrement transaction, SQLite coerces or truncates the float to an integer (subtracting `10`). While the transaction succeeds, it bypasses input sanitization, leading to mismatch discrepancies between what the user typed and what was deducted.
- **Mitigation**: Add an integer check using `Number.isInteger(pointsToBet)` before processing the bet.

### 3. [Low] Concurrent Double-Betting Returns 500

- **Vulnerability Found**: When a user concurrently submits two bets for the same prediction, the application-level check `existingBet` passes for both.
- **Attack Scenario**: Sending two concurrent HTTP POST requests to place a bet.
- **Blast Radius**: The database successfully blocks the double-bet due to the `@@unique([predictionId, userId])` constraint on `PredictionBet`, which rolls back the second transaction. However, the endpoint fails to handle the Prisma constraint violation and returns a `500 Internal Server Error` instead of a clean `400 Bad Request`.
- **Mitigation**: Catch Prisma unique constraint errors (P2002) in the try-catch block and return a `400` error response.

### 4. [Low] Tipping Limits Boundary Handling

- **Assessment**: Handled correctly.
- **Details**: The `validateTipAmount` validator function correctly restricts tips to `$10,000` per transaction and rejects non-positive or non-numeric tipping values. No active tipping creation endpoints exist in the backend routes (it is currently simulated via webhooks and validated on mock client-side objects).

---

## Stress Test Results

| Test Scenario               | Expected Behavior           | Actual Behavior                       | Result      |
| --------------------------- | --------------------------- | ------------------------------------- | ----------- |
| Tip > $10,000               | Reject with "exceeds limit" | Correctly rejected                    | **PASS**    |
| Tip <= 0                    | Reject with "valid amount"  | Correctly rejected                    | **PASS**    |
| Negative Channel Points Bet | Reject with 400             | Correctly rejected                    | **PASS**    |
| Floating-Point Points Bet   | Reject (or fail validation) | Accepted with 200 (truncated in DB)   | **FAIL**    |
| Sequential Double-Bet       | Reject second bet with 400  | Correctly rejected                    | **PASS**    |
| Concurrent Double-Bet       | Reject second bet           | One succeeded, second failed with 500 | **PARTIAL** |
| Negative Gift Amount        | Reject negative gifts       | Succeeded with 200 (Exploited!)       | **FAIL**    |

---

## Unchallenged Areas

- **Video Playback & Buffering**: Out of scope (sandbox has no video streaming media servers).
- **Socket.IO Real-Time Scaling**: Only local event broadcasting verified.
