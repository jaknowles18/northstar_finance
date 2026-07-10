import { createClient } from "@/lib/supabaseServer";
import { TransactionTable } from "@/components/TransactionTable";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.from("transactions").select("id,transaction_date,amount,currency,raw_merchant,normalized_merchant,confidence,categories(name)").order("transaction_date", { ascending: false }) : { data: [] };
  const transactions: Transaction[] = (data ?? []).map((row: any) => ({ id: row.id, transactionDate: row.transaction_date, amount: Number(row.amount), currency: row.currency, rawMerchant: row.raw_merchant, normalizedMerchant: row.normalized_merchant, confidence: Number(row.confidence ?? 0), source: "rbc_email", category: row.categories?.name ?? null }));
  return <div className="page"><div className="eyebrow">Ledger</div><h1 className="page-title">Every transaction, clearly.</h1><div className="card mt-8">{transactions.length ? <TransactionTable transactions={transactions}/> : <div className="p-10 text-center"><h2 className="font-serif text-2xl">No transactions yet.</h2><p className="text-sm text-[#6f7971]">Import your first RBC notification to start your ledger.</p></div>}</div></div>;
}

