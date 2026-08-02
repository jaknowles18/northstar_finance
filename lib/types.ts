export type ParsedTransaction = {
  transactionDate: string | null;
  amount: number;
  currency: string;
  rawMerchant: string;
  normalizedMerchant: string;
  confidence: number;
  source: "rbc_email";
};

export type Transaction = ParsedTransaction & {
  id: string;
  category: string | null;
  categoryId?: string | null;
  originalAmount?: number | null;
  notes?: string | null;
  transactionSource?: string;
};

export type BillingSettings = {
  id?: string; userId: string; billingCycleName: string;
  billingPeriodStartDate: string; billingPeriodEndDate: string; statementDueDate: string;
  monthlyCreditLimit: number | null; spendingWarningThreshold: number | null;
};

export type DeepDiveFilters = {
  preset: string; startDate: string | null; endDate: string | null;
  categoryIds: string[]; merchantIds: string[]; minAmount: number | null; maxAmount: number | null;
  searchText: string; source: string; uncategorizedOnly: boolean; recurringOnly: boolean;
  weekdays: number[]; month: number | null; sortBy: string;
};
