import { normalizeMerchant } from "./merchantNormalizer";
import type { ParsedTransaction } from "./types";

export class RbcParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RbcParserError";
  }
}

function valueAfterLabel(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escaped}\\s*(?:\\r?\\n|:)\\s*([^\\r\\n]+)`, "i"));
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return null;
}

function parseAmount(value: string | null): { amount: number; currency: string } | null {
  if (!value) return null;
  const match = value.match(/(?:(CAD|USD)\s*)?\$?\s*([\d,]+\.\d{2})/i);
  if (!match) return null;
  return { amount: Number(match[2].replace(/,/g, "")), currency: (match[1] ?? "CAD").toUpperCase() };
}

function normalizeDate(value: string | null): string | null {
  if (!value) return null;
  const iso = value.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];
  const parsed = new Date(value.replace(/\bat\b.*$/i, "").trim());
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

export function parseRbcEmail(emailText: string): ParsedTransaction[] {
  const text = emailText.replace(/\u00a0/g, " ").trim();
  if (!text) throw new RbcParserError("Paste an RBC transaction email before parsing.");

  // These labels intentionally mirror the proven Python parser used by this project.
  const amountValue = valueAfterLabel(text, ["Purchase Amount", "Transaction Amount", "Amount"]);
  const merchant = valueAfterLabel(text, ["Transaction Description", "Merchant", "At"]);
  const dateValue = valueAfterLabel(text, ["Transaction Date", "Purchase Date", "Date"]);
  const parsedAmount = parseAmount(amountValue);

  if (!parsedAmount || !merchant) {
    throw new RbcParserError("No RBC purchase was found. Check that the amount and transaction description are included.");
  }

  const transactionDate = normalizeDate(dateValue);
  const confidence = Math.min(1, 0.7 + (transactionDate ? 0.15 : 0) + (/Purchase Amount|Transaction Description/i.test(text) ? 0.15 : 0));
  return [{
    transactionDate,
    amount: parsedAmount.amount,
    currency: parsedAmount.currency,
    rawMerchant: merchant,
    normalizedMerchant: normalizeMerchant(merchant),
    confidence,
    source: "rbc_email",
  }];
}

