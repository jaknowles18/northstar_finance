const KNOWN_MERCHANTS: Array<[RegExp, string]> = [
  [/\bMCDONALD(?:'|’)?S\b/i, "McDonald’s"],
  [/\bTIM HORTONS\b/i, "Tim Hortons"],
  [/\bUBER(?:\s*\*\s*(?:TRIP|EATS))?\b/i, "Uber"],
  [/\b(?:AMZN|AMAZON)(?:\s+MKTP)?(?:\s+CA)?\b/i, "Amazon"],
  [/\bWAL[ -]?MART(?:\s+STORE)?\b/i, "Walmart"],
  [/\bLOBLAWS\b/i, "Loblaws"],
  [/\bSHOPPERS DRUG MART\b/i, "Shoppers Drug Mart"],
];

export function normalizeMerchant(raw: string): string {
  const compact = raw.replace(/\s+/g, " ").trim();
  const known = KNOWN_MERCHANTS.find(([pattern]) => pattern.test(compact));
  if (known) return known[1];

  return compact
    .replace(/\s+#?\d{3,}\b.*$/i, "")
    .replace(/\s+\*\s*(TRIP|EATS)$/i, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s&'-])\p{L}/gu, (letter) => letter.toUpperCase());
}

