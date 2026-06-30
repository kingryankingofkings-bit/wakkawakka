# Handoff Report — Batch 6 Adversarial Verification

## 1. Observation

Adversarial tests were executed using `node tests/adversarial.js` against the Next.js API server. Below are the key verbatim observations:

- **Tipping limits**: Correctly rejected values over $10,000 and negative values.
  `✅ validateTipAmount: Correctly rejected tip > $10,000`
`✅ validateTipAmount: Correctly rejected negative tip`
- **Negative predictions bet**: Correctly rejected negative points values.
  `✅ Negative Bet: Correctly rejected with 400`
- **Float predictions bet**: Accepted floating-point values instead of enforcing integers.
  `❌ Float Bet: Accepted with status 200. User balance after: 8980`
- **Concurrent double-bets**: Prevented multiple bets in the database but threw a 500 error on the second request due to unique constraints.
  `Req 1 status: 200, Data: {"success":true,...}`
  `Req 2 status: 500, Data: {"error":"PrismaClientKnownRequestError: ... Unique constraint failed ..."`
  `✅ Concurrent Double-Betting: Correctly prevented multiple bets in DB.`
- **Negative live stream gifts**: Successfully exploited.
  `Gift request status: 200, Data: {"success":true,"newBalance":9170,"gift":...`
  `❌ Live Stream Gifts: EXPLOIT FOUND! Negative amount incremented user points.`

## 2. Logic Chain

1. **Live Stream Gifts**: In `/api/live/streams/[id]/gifts/route.ts`, the endpoint calculates `totalCost = Number(amount) * Number(quantity)` and decrements `channelPoints` by `totalCost`. Because the inputs `amount` and `quantity` are not restricted to positive values, passing a negative amount results in a negative `totalCost`. Decrementing `channelPoints` by a negative value acts as an addition, allowing attackers to artificially increase their balance.
2. **Float Predictions Bet**: In `/api/live/streams/[id]/predictions/route.ts`, the `BET` handler checks if `pointsToBet <= 0` but does not verify `Number.isInteger(pointsToBet)`. Because SQLite's `INTEGER` column allows float inputs to be truncated during decrement calculations, users can successfully place decimal bets which are coerced by the database, causing input validation gaps.
3. **Double-Betting**: Sequential double betting is correctly blocked by checking `existingBet` in the API route. Concurrent double betting bypasses this application check because both checks complete before either write is committed. However, the database unique index `@@unique([predictionId, userId])` on `PredictionBet` successfully rolls back the duplicate write, preventing the double bet but resulting in an unhandled 500 error response.

## 3. Caveats

- **Offline Sandbox**: Tipping validations are verified locally in JS and webhook simulations since no external Stripe credentials are configured.
- **No Video Media**: Only REST API endpoints and data model states are tested; live streaming media transfer is out of scope.

## 4. Conclusion

- **Negative Gifts Exploit**: Critical vulnerability allows infinite points generation.
- **Floating-Point Bets**: Medium risk validation issue allowing decimals to be truncated at the DB layer.
- **Concurrent Double-Bets**: Low risk error handling issue (returns 500 instead of 400).
- **Tipping Limits**: Correctly validated at boundary thresholds.

## 5. Verification Method

1. Run the test command:
   ```bash
   node tests/adversarial.js
   ```
   Ensure Next.js is running (e.g. `npx next dev -p 3001` or `npm run dev`) and `NO_SPAWN` is set accordingly.
2. Inspect results in `C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\challenger_b6_2\challenge.md`.
