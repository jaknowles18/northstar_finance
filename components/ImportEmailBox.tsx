"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, LockKeyhole, Save, ShieldCheck, Upload } from "lucide-react";
import type { ParsedTransaction } from "@/lib/types";
import { createClient } from "@/lib/supabaseClient";

const bulkSample = `Purchase Amount:
CAD $42.16
Transaction Description:
TIM HORTONS 1234
Transaction Date:
July 10, 2026

Purchase Amount:
$84.26
Transaction Description:
LOBLAWS #1024
Transaction Date:
July 11, 2026

Purchase Amount:
$19.53
Transaction Description:
CHICK-FIL-A CAMBRIDGE
Transaction Date:
July 12, 2026`;

const money = (value: number, currency = "CAD") => new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(value);
const dateLabel = (value: string | null) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) : "Date not found";

export function ImportEmailBox() {
  const [text, setText] = useState("");
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  function resetPreview(value: string) { setText(value); setTransactions([]); setError(""); setMessage(""); }

  async function parse() {
    setLoading(true);
    setError("");
    setMessage("");
    setTransactions([]);
    try {
      const response = await fetch("/api/parse-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emailText: text }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setTransactions(data.transactions ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Northstar could not recognize purchases in that text.");
    } finally {
      setLoading(false);
    }
  }

  async function pick(selected?: File) {
    if (!selected) return;
    if (!/\.(txt|eml)$/i.test(selected.name)) { setError("Choose a .txt or .eml file."); return; }
    resetPreview(await selected.text());
  }

  async function saveAll() {
    if (!transactions.length) return;
    setLoading(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    if (!supabase) { setError("Northstar could not connect to the database."); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }

    const { data: rules, error: rulesError } = await supabase.from("merchant_rules").select("match_text,normalized_name,category_id");
    if (rulesError) { setError(rulesError.message); setLoading(false); return; }
    const categoryFor = (transaction: ParsedTransaction) => rules?.find((rule) => rule.match_text === transaction.rawMerchant)?.category_id ?? rules?.find((rule) => rule.normalized_name === transaction.normalizedMerchant)?.category_id ?? null;
    const rows = transactions.map((transaction) => ({ user_id: user.id, transaction_date: transaction.transactionDate, amount: transaction.amount, currency: transaction.currency, raw_merchant: transaction.rawMerchant, normalized_merchant: transaction.normalizedMerchant, category_id: categoryFor(transaction), confidence: transaction.confidence, source: "manual_paste" }));
    const { error: insertError } = await supabase.from("transactions").insert(rows);
    if (insertError) setError(`The batch was not saved. ${insertError.message}`);
    else {
      await supabase.from("imports").insert({ user_id: user.id, source: "manual_paste", imported_count: rows.length, duplicate_count: 0, failed_count: 0 });
      setMessage(`${rows.length} transaction${rows.length === 1 ? "" : "s"} saved to your ledger.`);
      setTransactions([]);
      setText("");
    }
    setLoading(false);
  }

  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_320px]">
      <div className="space-y-5">
        <section className="card p-5 sm:p-7" aria-labelledby="paste-heading">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="paste-heading" className="section-heading">1. Add email content</h2><p id="paste-help" className="section-copy">Paste the full alert text. Forwarded batches can include several repeated purchase blocks.</p></div><button type="button" className="button ghost small" onClick={() => resetPreview(bulkSample)}>Use sample data</button></div>
          <label className="sr-only" htmlFor="email-content">RBC email contents</label>
          <textarea id="email-content" aria-describedby="paste-help" value={text} onChange={(event) => resetPreview(event.target.value)} placeholder="Paste one or more RBC purchase notifications here…" className="control mt-5 min-h-[320px] font-mono text-[13px]" />
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="button" onClick={parse} disabled={loading || !text.trim()}>{loading ? <Loader2 className="animate-spin" size={17} /> : <FileText size={17} />}Recognize purchases</button>
            <input ref={file} hidden type="file" accept=".txt,.eml,text/plain,message/rfc822" onChange={(event) => void pick(event.target.files?.[0])} />
            <button type="button" className="button secondary" onClick={() => file.current?.click()}><Upload size={17} />Choose .txt or .eml</button>
          </div>
          {error && <div role="alert" className="notice error mt-4">{error}</div>}
          {message && <div role="status" className="notice success mt-4"><CheckCircle2 size={18} />{message}</div>}
        </section>

        {transactions.length > 0 && <section className="card overflow-hidden" aria-labelledby="review-heading">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d7ddd7] bg-[#edf5ef] p-5 sm:px-6">
            <div><h2 id="review-heading" className="section-heading">2. Review {transactions.length} recognized purchase{transactions.length === 1 ? "" : "s"}</h2><p className="section-copy">Batch total: {money(total)}. Nothing is saved until you confirm.</p></div>
            <button disabled={loading} onClick={saveAll} className="button">{loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}Save all to ledger</button>
          </div>
          <div className="table-wrap"><table className="responsive-table"><thead><tr><th>Merchant</th><th>Date</th><th>Confidence</th><th className="text-right">Amount</th></tr></thead><tbody>{transactions.map((transaction, index) => <tr key={`${transaction.rawMerchant}-${transaction.transactionDate}-${index}`}>
            <td data-primary="true"><div className="font-bold">{transaction.normalizedMerchant}</div><div className="mt-1 truncate text-xs text-[#7b877f]">{transaction.rawMerchant}</div></td>
            <td data-label="Date" className="whitespace-nowrap text-sm text-[#59675e]">{dateLabel(transaction.transactionDate)}</td>
            <td data-label="Confidence"><span className="pill neutral">{Math.round(transaction.confidence * 100)}% match</span></td>
            <td data-label="Amount" className="money text-right font-bold">{money(transaction.amount, transaction.currency)}</td>
          </tr>)}</tbody></table></div>
        </section>}
      </div>

      <aside className="space-y-4">
        <section className="surface p-5"><LockKeyhole size={20} className="text-[#356748]" /><h2 className="section-heading mt-4">Parsed in memory</h2><p className="section-copy mt-2">Northstar does not save the pasted email body. Only the purchase fields you review and confirm are stored.</p></section>
        <section className="surface p-5"><ShieldCheck size={20} className="text-[#356748]" /><h2 className="section-heading mt-4">What the parser expects</h2><ul className="mb-0 mt-3 space-y-2 pl-5 text-xs leading-5 text-[#617067]"><li>Purchase amount</li><li>Transaction description</li><li>Transaction date when available</li></ul><p className="mb-0 mt-4 text-xs leading-5 text-[#7b877f]">Each repeated set becomes a separate row. Review merchant names and dates before saving.</p></section>
      </aside>
    </div>
  );
}
