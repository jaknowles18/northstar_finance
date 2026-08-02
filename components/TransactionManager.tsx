"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Pencil, Search, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { EmptyState, Metric } from "@/components/ProductUI";
import type { Transaction } from "@/lib/types";

type Sort = "newest" | "oldest" | "high" | "low" | "merchant";
const dateLabel = (value: string | null) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) : "No date";
const money = (value: number, currency = "CAD") => new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(value);

export function TransactionManager({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftAmount, setDraftAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = query ? transactions.filter((transaction) => `${transaction.normalizedMerchant} ${transaction.rawMerchant} ${transaction.category ?? ""}`.toLowerCase().includes(query)) : [...transactions];
    return matches.sort((a, b) => sort === "oldest"
      ? (a.transactionDate ?? "").localeCompare(b.transactionDate ?? "")
      : sort === "high" ? b.amount - a.amount
      : sort === "low" ? a.amount - b.amount
      : sort === "merchant" ? a.normalizedMerchant.localeCompare(b.normalizedMerchant)
      : (b.transactionDate ?? "").localeCompare(a.transactionDate ?? ""));
  }, [search, sort, transactions]);

  const visibleTotal = visible.reduce((sum, transaction) => sum + transaction.amount, 0);
  const uncategorized = visible.filter((transaction) => !transaction.category).length;

  function startEditing(transaction: Transaction) {
    setEditingId(transaction.id);
    setDraftAmount(transaction.amount.toFixed(2));
    setError("");
    setMessage("");
  }

  function stopEditing() {
    setEditingId(null);
    setDraftAmount("");
  }

  async function saveAmount(transaction: Transaction) {
    const parsed = Number(draftAmount);
    if (draftAmount.trim() === "" || !Number.isFinite(parsed) || parsed < 0) {
      setError("Enter an amount of $0.00 or more.");
      return;
    }
    const nextAmount = Math.round(parsed * 100) / 100;
    if (nextAmount > 9_999_999_999.99) {
      setError("That amount is too large to save.");
      return;
    }
    if (nextAmount === transaction.amount) {
      stopEditing();
      return;
    }

    setSavingId(transaction.id);
    setError("");
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setError("Northstar could not connect to the database. Try again after checking your configuration.");
      setSavingId(null);
      return;
    }

    const originalAmount = transaction.originalAmount ?? transaction.amount;
    const restoredOriginal = nextAmount === originalAmount;
    const { data, error: updateError } = await supabase
      .from("transactions")
      .update({ amount: nextAmount, original_amount: restoredOriginal ? null : originalAmount })
      .eq("id", transaction.id)
      .select("amount,original_amount")
      .single();

    if (updateError) {
      setError(`The amount was not updated. ${updateError.message}`);
    } else {
      setTransactions((current) => current.map((item) => item.id === transaction.id ? {
        ...item,
        amount: Number(data.amount),
        originalAmount: data.original_amount === null ? null : Number(data.original_amount),
      } : item));
      setMessage(restoredOriginal
        ? `${transaction.normalizedMerchant} was restored to its original amount.`
        : `${transaction.normalizedMerchant} now counts as ${money(nextAmount, transaction.currency)} across Northstar.`);
      stopEditing();
    }
    setSavingId(null);
  }

  async function remove(transaction: Transaction) {
    if (!window.confirm(`Delete the ${transaction.normalizedMerchant} transaction for ${money(transaction.amount, transaction.currency)}? This cannot be undone.`)) return;
    setDeletingId(transaction.id);
    setError("");
    setMessage("");
    const supabase = createClient();
    if (!supabase) { setError("Northstar could not connect to the database. Try again after checking your configuration."); setDeletingId(null); return; }
    const { error: deleteError } = await supabase.from("transactions").delete().eq("id", transaction.id);
    if (deleteError) setError(`The transaction was not deleted. ${deleteError.message}`);
    else setTransactions((current) => current.filter((item) => item.id !== transaction.id));
    setDeletingId(null);
  }

  return (
    <section className="card mt-8 overflow-hidden" aria-labelledby="ledger-heading">
      <h2 id="ledger-heading" className="sr-only">Transaction ledger</h2>
      <div className="border-b border-[#e7ebe7] p-5 sm:p-6">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <span className="sr-only">Search transactions</span>
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b877f]" aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="control !mt-0 pl-10" placeholder="Search merchant or category" />
          </label>
          <label className="block"><span className="sr-only">Sort transactions</span><select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="control !mt-0"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="high">Amount: high to low</option><option value="low">Amount: low to high</option><option value="merchant">Merchant: A–Z</option></select></label>
        </div>
        {error && <div role="alert" className="notice error mt-4">{error}</div>}
        {message && <div role="status" className="notice success mt-4"><Check size={17} />{message}</div>}
        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          <Metric label="Showing" value={String(visible.length)} detail={`${transactions.length} total`} />
          <Metric label="Visible total" value={money(visibleTotal)} detail="Adjusted spending" />
          <Metric label="Needs attention" value={String(uncategorized)} detail={uncategorized ? "Missing a category" : "All visible rows organized"} />
        </div>
      </div>

      {visible.length ? <div className="table-wrap"><table className="responsive-table"><thead><tr><th>Merchant</th><th>Category</th><th>Date</th><th className="text-right">Amount</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map((transaction) => <tr key={transaction.id}>
        <td data-primary="true"><div className="font-bold">{transaction.normalizedMerchant}</div><div className="mt-1 truncate text-xs text-[#7b877f]">{transaction.rawMerchant}</div></td>
        <td data-label="Category">{transaction.category ? <span className="pill">{transaction.category}</span> : <Link href="/categorize" className="pill attention hover:underline">Needs category</Link>}</td>
        <td data-label="Date" className="whitespace-nowrap text-sm text-[#59675e]">{dateLabel(transaction.transactionDate)}</td>
        <td data-label="Amount" className="text-right">
          {editingId === transaction.id ? <label className="inline-block">
            <span className="sr-only">Adjusted amount for {transaction.normalizedMerchant}</span>
            <span className="relative block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#68756d]">$</span>
              <input
                autoFocus
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={draftAmount}
                onChange={(event) => setDraftAmount(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") { event.preventDefault(); void saveAmount(transaction); }
                  if (event.key === "Escape") stopEditing();
                }}
                disabled={savingId === transaction.id}
                className="control !mt-0 w-32 pl-7 text-right font-bold tabular-nums"
              />
            </span>
          </label> : <div className="money">
            <div className="font-bold text-[#243129]">{money(transaction.amount, transaction.currency)}</div>
            {transaction.originalAmount !== null && transaction.originalAmount !== undefined && <div className="mt-1 text-[11px] font-semibold text-[#929d95]">Original {money(transaction.originalAmount, transaction.currency)}</div>}
          </div>}
        </td>
        <td data-action="true" className="w-24 text-right">
          <div className="flex justify-end gap-2">
            {editingId === transaction.id ? <>
              <button onClick={() => void saveAmount(transaction)} disabled={savingId === transaction.id} aria-label={`Save adjusted amount for ${transaction.normalizedMerchant}`} className="icon-button !h-9 !w-9 border-[#bfd7c5] bg-[#edf6ef] text-[#2f6844] hover:bg-[#e2f0e6]">{savingId === transaction.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}</button>
              <button onClick={stopEditing} disabled={savingId === transaction.id} aria-label="Cancel amount edit" className="icon-button !h-9 !w-9"><X size={15} /></button>
            </> : <>
              <button onClick={() => startEditing(transaction)} disabled={deletingId === transaction.id || savingId !== null} aria-label={`Edit amount for ${transaction.normalizedMerchant}`} className="icon-button !h-9 !w-9 border-[#cbd9ce] bg-[#f3f7f3] text-[#356748] hover:bg-[#eaf2ec]"><Pencil size={15} /></button>
              <button onClick={() => remove(transaction)} disabled={deletingId === transaction.id || savingId !== null} aria-label={`Delete ${transaction.normalizedMerchant} transaction`} className="icon-button !h-9 !w-9 border-[#eccbc7] bg-[#fff5f3] text-[#a63f37] hover:bg-[#ffe9e5]">{deletingId === transaction.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}</button>
            </>}
          </div>
        </td>
      </tr>)}</tbody></table></div> : <EmptyState title={transactions.length ? "No matching transactions" : "No transactions yet"} description={transactions.length ? "Try a different search or change the sort order." : "Import an RBC purchase notification to start your private ledger."} actionHref={transactions.length ? undefined : "/import"} actionLabel={transactions.length ? undefined : "Import transactions"} />}
    </section>
  );
}
