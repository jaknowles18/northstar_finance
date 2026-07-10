import assert from "node:assert/strict";
import { parseRbcEmail } from "../lib/rbcParser";

const cases = [
  { email: "Purchase Amount:\n$12.34\nTransaction Description:\nMCDONALDS #1234 RICHMOND HILL\nTransaction Date:\nJuly 9, 2026", merchant: "McDonald’s", amount: 12.34 },
  { email: "Transaction Amount:\nCAD $1,234.56\nMerchant:\nWAL-MART STORE #1234\nDate:\n2026-07-08", merchant: "Walmart", amount: 1234.56 },
  { email: "Amount:\nUSD 19.50\nAt:\nUBER *TRIP", merchant: "Uber", amount: 19.5 },
];

for (const testCase of cases) {
  const [result] = parseRbcEmail(testCase.email);
  assert.equal(result.normalizedMerchant, testCase.merchant);
  assert.equal(result.amount, testCase.amount);
}
console.log(`${cases.length} RBC parser cases passed.`);
