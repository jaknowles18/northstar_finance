"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { EmptyState, PageHeader } from "@/components/ProductUI";

type Category = { id: string; name: string };
type Pending = { id: string; normalized_merchant: string; raw_merchant: string; amount: number; transaction_date: string | null };
type Scope = "only" | "future" | "all";

const money = (value: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value);
const dateLabel = (value: string | null) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" }) : "Date not available";

export default function CategorizePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [initialTotal, setInitialTotal] = useState(0);
  const [selected, setSelected] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [scope, setScope] = useState<Scope>("future");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const current = pending[0];

  useEffect(() => { void load(); }, []);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setError("Northstar could not connect to the database."); setLoading(false); return; }
    const [{ data: categoryRows, error: categoryError }, { data: transactions, error: transactionError }] = await Promise.all([
      supabase.from("categories").select("id,name").order("name"),
      supabase.from("transactions").select("id,normalized_merchant,raw_merchant,amount,transaction_date").is("category_id", null).order("transaction_date"),
    ]);
    setError(categoryError?.message ?? transactionError?.message ?? "");
    setCategories(categoryRows ?? []);
    const items = (transactions ?? []).map((transaction) => ({ ...transaction, amount: Number(transaction.amount) }));
    setPending(items);
    setInitialTotal(items.length);
    setLoading(false);
  }

  async function save() {
    if (!current || (!selected && !manualCategory.trim())) return;
    setLoading(true);
    setSaved(false);
    setError("");
    const supabase = createClient();
    if (!supabase) { setError("Northstar could not connect to the database."); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }

    let category = categories.find((item) => item.id === selected);
    if (manualCategory.trim()) {
      const { data: created, error: createError } = await supabase.from("categories").upsert({ user_id: user.id, name: manualCategory.trim() }, { onConflict: "user_id,name" }).select("id,name").single();
      if (createError) { setError(createError.message); setLoading(false); return; }
      category = created;
      setCategories((currentCategories) => [...currentCategories.filter((item) => item.id !== created.id), created].sort((a, b) => a.name.localeCompare(b.name)));
    }
    if (!category) { setLoading(false); return; }

    let query = supabase.from("transactions").update({ category_id: category.id });
    query = scope === "all" ? query.eq("normalized_merchant", current.normalized_merchant) : query.eq("id", current.id);
    const { error: updateError } = await query;
    if (!updateError && scope !== "only") {
      await supabase.from("merchant_rules").upsert({ user_id: user.id, match_text: current.raw_merchant, normalized_name: current.normalized_merchant, category_id: category.id }, { onConflict: "user_id,match_text" });
    }
    if (updateError) setError(updateError.message);
    else {
      setPending((items) => items.filter((transaction) => scope === "all" ? transaction.normalized_merchant !== current.normalized_merchant : transaction.id !== current.id));
      setSaved(true);
      setSelected("");
      setManualCategory("");
    }
    setLoading(false);
  }

  if (loading && !current && initialTotal === 0) return <div className="page"><div className="skeleton h-3 w-28" /><div className="skeleton mt-4 h-14 max-w-xl" /><div className="skeleton mt-10 h-[420px] max-w-4xl" /><span className="sr-only">Loading uncategorized transactions</span></div>;

  const completed = Math.max(0, initialTotal - pending.length);
  const progress = initialTotal ? Math.round(completed / initialTotal * 100) : 100;
  const scopeOptions: { value: Scope; title: string; description: string }[] = [
    { value: "future", title: "This purchase and future imports", description: "Recommended. Northstar remembers this merchant next time." },
    { value: "all", title: "All matching purchases", description: "Update past matches and remember the merchant going forward." },
    { value: "only", title: "Only this purchase", description: "Make no reusable merchant rule." },
  ];

  return (
    <div className="page">
      <PageHeader eyebrow="Review queue" title="Resolve what needs attention." description="Choose a category and decide whether Northstar should remember the merchant for other purchases." />
      {error && <div role="alert" className="notice error mt-6 max-w-4xl">{error}</div>}
      {saved && current && <div role="status" className="notice success mt-6 max-w-4xl"><CheckCircle2 size={18} />Saved. The next purchase is ready.</div>}

      {!current ? <section className="card mt-8 max-w-4xl"><EmptyState title="Everything is organized" description="There are no uncategorized purchases waiting for review." actionHref="/dashboard" actionLabel="Return to overview" /></section> :
        <div className="mt-8 grid max-w-6xl gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section className="card overflow-hidden" aria-labelledby="merchant-heading">
            <div className="border-b border-[#d7ddd7] bg-[#173e2b] p-6 text-white sm:p-8">
              <div className="text-[11px] font-extrabold uppercase tracking-[.13em] text-[#acc3b3]">Purchase to review</div>
              <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div className="min-w-0"><h2 id="merchant-heading" className="m-0 truncate font-serif text-3xl font-semibold tracking-[-.035em] sm:text-4xl">{current.normalized_merchant}</h2><p className="mb-0 mt-2 truncate text-sm text-[#bdd0c2]">{current.raw_merchant} · {dateLabel(current.transaction_date)}</p></div>
                <div className="display-number flex-none text-4xl">{money(current.amount)}</div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <fieldset className="border-0 p-0">
                <legend className="text-sm font-extrabold">1. Choose a category</legend>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="field-label">Existing category<select value={selected} onChange={(event) => { setSelected(event.target.value); setManualCategory(""); }} className="control"><option value="">Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                  <label className="field-label">Or create a new one<input value={manualCategory} onChange={(event) => { setManualCategory(event.target.value); setSelected(""); }} placeholder="For example, Pet care" className="control" /></label>
                </div>
              </fieldset>

              <fieldset className="mt-8 border-0 p-0">
                <legend className="text-sm font-extrabold">2. Decide where it applies</legend>
                <div className="mt-3 grid gap-2">
                  {scopeOptions.map((option) => <label key={option.value} className={`flex cursor-pointer items-start gap-3 rounded-[10px] border p-4 transition-colors ${scope === option.value ? "border-[#5d8a6d] bg-[#edf5ef]" : "border-[#d7ddd7] bg-white hover:border-[#aab8ae]"}`}>
                    <input type="radio" name="scope" value={option.value} checked={scope === option.value} onChange={() => setScope(option.value)} className="mt-1 h-4 w-4 accent-[#173e2b]" />
                    <span><span className="block text-sm font-bold">{option.title}</span><span className="mt-1 block text-xs leading-5 text-[#68756d]">{option.description}</span></span>
                  </label>)}
                </div>
              </fieldset>

              <button disabled={(!selected && !manualCategory.trim()) || loading} onClick={save} className="button mt-7 w-full sm:w-auto">{loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}Save and continue</button>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="surface p-5">
              <div className="flex items-center justify-between text-xs font-extrabold"><span>Review progress</span><span>{completed} of {initialTotal}</span></div>
              <div className="bar-track mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={initialTotal} aria-valuenow={completed} aria-label={`${completed} of ${initialTotal} reviewed`}><div className="bar-fill" style={{ width: `${progress}%` }} /></div>
              <p className="mb-0 mt-3 text-xs leading-5 text-[#68756d]">{pending.length} purchase{pending.length === 1 ? "" : "s"} remain in the queue.</p>
            </section>
            <section className="surface p-5"><Sparkles size={18} className="text-[#3b704e]" /><h2 className="section-heading mt-4">Why remember a merchant?</h2><p className="section-copy mt-2">A merchant rule categorizes matching imports automatically. You can still review or remove the transaction later.</p></section>
            <Link href="/transactions" className="button secondary w-full">Leave the review queue</Link>
          </aside>
        </div>}
    </div>
  );
}
