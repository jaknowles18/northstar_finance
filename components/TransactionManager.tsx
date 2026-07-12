"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import type { Transaction } from "@/lib/types";

export function TransactionManager({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? transactions.filter((transaction) => `${transaction.normalizedMerchant} ${transaction.rawMerchant} ${transaction.category ?? ""}`.toLowerCase().includes(query)) : transactions;
  }, [search, transactions]);

  async function remove(transaction: Transaction) {
    if (!window.confirm(`Delete the ${transaction.normalizedMerchant} transaction for $${transaction.amount.toFixed(2)}? This cannot be undone.`)) return;
    setDeletingId(transaction.id); setError("");
    const supabase = createClient();
    if (!supabase) { setError("Supabase is not configured."); setDeletingId(null); return; }
    const { error: deleteError } = await supabase.from("transactions").delete().eq("id", transaction.id);
    if (deleteError) setError(deleteError.message);
    else setTransactions((current) => current.filter((item) => item.id !== transaction.id));
    setDeletingId(null);
  }

  return <div className="card mt-8 overflow-hidden">
    <div className="border-b border-[#edf0ed] p-5"><div className="flex items-center gap-2 rounded-xl border border-[#dce2dd] bg-[#fbfcfa] px-3"><Search size={17} className="text-[#7b857d]"/><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search transactions" className="w-full bg-transparent py-3 outline-none" placeholder="Search merchant or category…"/></div>{error&&<div role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}</div>
    {visible.length ? <div className="table-wrap"><table><thead><tr><th>Merchant</th><th>Category</th><th>Date</th><th className="text-right">Amount</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map((transaction) => <tr key={transaction.id}><td><div className="font-semibold">{transaction.normalizedMerchant}</div><div className="mt-1 text-xs text-[#8a928b]">{transaction.rawMerchant}</div></td><td>{transaction.category ? <span className="pill">{transaction.category}</span> : <span className="text-sm font-semibold text-amber-700">Needs category</span>}</td><td className="whitespace-nowrap text-sm text-[#626d64]">{transaction.transactionDate}</td><td className="text-right font-bold tabular-nums">${transaction.amount.toFixed(2)}</td><td className="w-14 text-right"><button onClick={() => remove(transaction)} disabled={deletingId === transaction.id} aria-label={`Delete ${transaction.normalizedMerchant} transaction`} className="rounded-lg border border-red-100 bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50">{deletingId === transaction.id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}</button></td></tr>)}</tbody></table></div> : <div className="p-10 text-center"><h2 className="font-serif text-2xl">{transactions.length ? "No matching transactions." : "No transactions yet."}</h2><p className="text-sm text-[#6f7971]">{transactions.length ? "Try a different search." : "Import an RBC notification to start your ledger."}</p></div>}
  </div>;
}

