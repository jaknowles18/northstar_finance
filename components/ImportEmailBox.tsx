"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, LockKeyhole, Save, Upload } from "lucide-react";
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

export function ImportEmailBox() {
  const [text, setText] = useState("");
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  function resetPreview(value: string) { setText(value); setTransactions([]); setError(""); setMessage(""); }
  async function parse() {
    setLoading(true); setError(""); setMessage(""); setTransactions([]);
    try {
      const response = await fetch("/api/parse-email", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({emailText:text}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setTransactions(data.transactions ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not parse those emails."); }
    finally { setLoading(false); }
  }
  async function pick(selected?: File) {
    if (!selected) return;
    if (!/\.(txt|eml)$/i.test(selected.name)) { setError("Choose a .txt or .eml file."); return; }
    resetPreview(await selected.text());
  }
  async function saveAll() {
    if (!transactions.length) return;
    setLoading(true); setError(""); setMessage("");
    const supabase = createClient();
    if (!supabase) { setError("Supabase is not configured."); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href="/login"; return; }

    const { data: rules, error: rulesError } = await supabase.from("merchant_rules").select("match_text,normalized_name,category_id");
    if (rulesError) { setError(rulesError.message); setLoading(false); return; }
    const categoryFor = (transaction: ParsedTransaction) => rules?.find((rule) => rule.match_text === transaction.rawMerchant)?.category_id ?? rules?.find((rule) => rule.normalized_name === transaction.normalizedMerchant)?.category_id ?? null;
    const rows = transactions.map((transaction) => ({ user_id:user.id, transaction_date:transaction.transactionDate, amount:transaction.amount, currency:transaction.currency, raw_merchant:transaction.rawMerchant, normalized_merchant:transaction.normalizedMerchant, category_id:categoryFor(transaction), confidence:transaction.confidence, source:"manual_paste" }));
    const { error: insertError } = await supabase.from("transactions").insert(rows);
    if (insertError) setError(insertError.message);
    else {
      await supabase.from("imports").insert({ user_id:user.id, source:"manual_paste", imported_count:rows.length, duplicate_count:0, failed_count:0 });
      setMessage(`${rows.length} transaction${rows.length===1?"":"s"} saved successfully.`);
      setTransactions([]); setText("");
    }
    setLoading(false);
  }

  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  return <div className="mt-8 grid gap-5 xl:grid-cols-[1.4fr_.7fr]"><div className="card p-5 md:p-7"><div className="mb-3 flex items-center justify-between"><label htmlFor="email" className="font-bold">Email contents</label><button className="text-xs font-bold text-[#3e6b4f]" onClick={()=>resetPreview(bulkSample)}>Use a bulk sample</button></div><textarea id="email" value={text} onChange={event=>resetPreview(event.target.value)} placeholder="Paste one or more RBC notifications here…" className="min-h-[300px] w-full resize-y rounded-xl border border-[#dce2dd] bg-[#fbfcfa] p-4 text-sm leading-6 outline-none focus:border-[#47785a] focus:ring-2 focus:ring-[#dcecdf]"/><div className="mt-4 flex flex-wrap gap-3"><button className="button" onClick={parse} disabled={loading||!text.trim()}>{loading?<Loader2 className="animate-spin" size={17}/>:<FileText size={17}/>}Parse transactions</button><input ref={file} hidden type="file" accept=".txt,.eml,text/plain,message/rfc822" onChange={event=>pick(event.target.files?.[0])}/><button className="button secondary" onClick={()=>file.current?.click()}><Upload size={17}/>Choose file</button></div>{error&&<div role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}{message&&<div className="mt-4 rounded-xl bg-[#edf7ef] p-3 text-sm font-semibold text-[#28583a]"><CheckCircle2 className="mr-2 inline" size={17}/>{message}</div>}{transactions.length>0&&<div className="mt-6 overflow-hidden rounded-2xl border border-[#bcd7c4]"><div className="flex flex-wrap items-center justify-between gap-3 bg-[#f0f8f2] p-4"><div><b>{transactions.length} transaction{transactions.length===1?"":"s"} recognized</b><div className="mt-1 text-xs text-[#657368]">Batch total: CAD ${total.toFixed(2)}</div></div><button disabled={loading} onClick={saveAll} className="button"><Save size={16}/>Save all transactions</button></div><div className="table-wrap"><table><thead><tr><th>#</th><th>Merchant</th><th>Date</th><th className="text-right">Amount</th></tr></thead><tbody>{transactions.map((transaction,index)=><tr key={`${transaction.rawMerchant}-${transaction.transactionDate}-${index}`}><td className="text-sm text-[#7a837b]">{index+1}</td><td><div className="font-semibold">{transaction.normalizedMerchant}</div><div className="mt-1 text-xs text-[#8a928b]">{transaction.rawMerchant}</div></td><td className="whitespace-nowrap text-sm">{transaction.transactionDate??"Date not found"}</td><td className="text-right font-bold">{transaction.currency} ${transaction.amount.toFixed(2)}</td></tr>)}</tbody></table></div></div>}</div><aside className="space-y-4"><div className="card p-5"><LockKeyhole className="text-[#356348]"/><h2 className="mb-2 mt-4 text-lg font-bold">Privacy by design</h2><p className="m-0 text-sm leading-6 text-[#6f7971]">Raw pasted email text is parsed in memory and never stored. Only the extracted transaction fields are saved.</p></div><div className="card p-5"><h2 className="mt-0 text-lg font-bold">Bulk paste format</h2><p className="text-sm leading-6 text-[#68726a]">Paste forwarded RBC alerts together. Each repeated Purchase Amount, Transaction Description, and Transaction Date block becomes a separate row.</p></div></aside></div>;
}
