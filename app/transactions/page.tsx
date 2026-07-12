import { createClient } from "@/lib/supabaseServer";
import { TransactionManager } from "@/components/TransactionManager";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.from("transactions").select("id,transaction_date,amount,currency,raw_merchant,normalized_merchant,confidence,categories(name)").order("transaction_date", { ascending: false }) : { data: [] };
  const transactions: Transaction[] = (data ?? []).map((row: any) => ({ id: row.id, transactionDate: row.transaction_date, amount: Number(row.amount), currency: row.currency, rawMerchant: row.raw_merchant, normalizedMerchant: row.normalized_merchant, confidence: Number(row.confidence ?? 0), source: "rbc_email", category: row.categories?.name ?? null }));
  return <div className="page"><div className="eyebrow">Ledger</div><h1 className="page-title">Every transaction, clearly.</h1><p className="subtitle">Search your ledger or remove an incorrect transaction.</p><TransactionManager initialTransactions={transactions}/></div>;
}
