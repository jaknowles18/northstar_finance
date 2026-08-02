import Link from "next/link";
import { CircleAlert, FileUp } from "lucide-react";
import { createClient } from "@/lib/supabaseServer";
import { PageHeader } from "@/components/ProductUI";
import { TransactionManager } from "@/components/TransactionManager";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";
const categoryName = (value: any): string | null => Array.isArray(value) ? value[0]?.name ?? null : value?.name ?? null;

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.from("transactions").select("id,transaction_date,amount,original_amount,currency,raw_merchant,normalized_merchant,confidence,categories(name)").order("transaction_date", { ascending: false }) : { data: [] };
  const transactions: Transaction[] = (data ?? []).map((row: any) => ({
    id: row.id,
    transactionDate: row.transaction_date,
    amount: Number(row.amount),
    originalAmount: row.original_amount === null ? null : Number(row.original_amount),
    currency: row.currency,
    rawMerchant: row.raw_merchant,
    normalizedMerchant: row.normalized_merchant,
    confidence: Number(row.confidence ?? 0),
    source: "rbc_email",
    category: categoryName(row.categories),
  }));
  const needsAttention = transactions.filter((transaction) => !transaction.category).length;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Activity"
        title="Your transaction ledger."
        description="Search every recorded purchase, adjust what counts toward your spending, or remove an incorrect entry."
        actions={<><Link href="/categorize" className="button secondary"><CircleAlert size={16} />Review {needsAttention || "categories"}</Link><Link href="/import" className="button"><FileUp size={16} />Import</Link></>}
      />
      <TransactionManager initialTransactions={transactions} />
    </div>
  );
}
