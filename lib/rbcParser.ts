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
    if (match?.[1]?.trim()) return match[1].trim().replace(/^(?:>\s*)+/, "");
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

function transactionBlocks(text: string): string[] {
  // Multi-forwarded messages repeat an amount label for every embedded RBC email.
  // Keep each label with its following fields, and tolerate Gmail's quoted `>` prefix.
  const label = /(?:^|\r?\n)[ \t>]*(?:Purchase Amount|Transaction Amount|Amount)\s*(?::\s*|\r?\n)/gim;
  const starts = [...text.matchAll(label)].map((match) => match.index! + (match[0].startsWith("\n") || match[0].startsWith("\r") ? 1 : 0));
  if (starts.length <= 1) return [text];
  return starts.map((start, index) => text.slice(start, starts[index + 1] ?? text.length));
}

function parseTransactionBlock(text: string): ParsedTransaction | null {
  const amountValue = valueAfterLabel(text, ["Purchase Amount", "Transaction Amount", "Amount"]);
  const merchant = valueAfterLabel(text, ["Transaction Description", "Merchant", "At"]);
  const dateValue = valueAfterLabel(text, ["Transaction Date", "Purchase Date", "Date"]);
  const parsedAmount = parseAmount(amountValue);
  if (!parsedAmount || !merchant) return null;

  const transactionDate = normalizeDate(dateValue);
  const confidence = Math.min(1, 0.7 + (transactionDate ? 0.15 : 0) + (/Purchase Amount|Transaction Description/i.test(text) ? 0.15 : 0));
  return { transactionDate, amount: parsedAmount.amount, currency: parsedAmount.currency, rawMerchant: merchant, normalizedMerchant: normalizeMerchant(merchant), confidence, source: "rbc_email" };
}

export function parseRbcEmail(emailText: string): ParsedTransaction[] {
  const text = emailText.replace(/\u00a0/g, " ").trim();
  if (!text) throw new RbcParserError("Paste an RBC transaction email before parsing.");
  const transactions = transactionBlocks(text).map(parseTransactionBlock).filter((value): value is ParsedTransaction => value !== null);
  if (!transactions.length) {
    throw new RbcParserError("No RBC purchase was found. Check that the amount and transaction description are included.");
  }
  return transactions;
}
