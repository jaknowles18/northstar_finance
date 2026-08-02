"use client";

import { useEffect, useState } from "react";
import { CalendarRange, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { resetBillingDates } from "@/lib/billingAnalytics";

const initial = resetBillingDates();

export function BillingSettingsForm() {
  const [name, setName] = useState("Main Credit Card");
  const [start, setStart] = useState(initial.startDate);
  const [end, setEnd] = useState(initial.endDate);
  const [due, setDue] = useState(initial.dueDate);
  const [limit, setLimit] = useState("");
  const [threshold, setThreshold] = useState("80");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { void load(); }, []);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setError("Northstar could not connect to the database."); setLoading(false); return; }
    const { data, error: loadError } = await supabase.from("billing_settings").select("*").maybeSingle();
    if (loadError) setError(loadError.message);
    if (data) {
      setName(data.billing_cycle_name);
      setStart(data.billing_period_start_date);
      setEnd(data.billing_period_end_date);
      setDue(data.statement_due_date);
      setLimit(data.monthly_credit_limit?.toString() ?? "");
      setThreshold(data.spending_warning_threshold?.toString() ?? "80");
    }
    setLoading(false);
  }

  function reset() {
    const dates = resetBillingDates();
    setStart(dates.startDate);
    setEnd(dates.endDate);
    setDue(dates.dueDate);
    setMessage("");
    setError("");
  }

  async function save() {
    setError("");
    setMessage("");
    if (start >= end) { setError("The billing period start must be before the end date."); return; }
    if (limit && Number(limit) <= 0) { setError("The credit limit must be greater than zero."); return; }
    if (Number(threshold) < 1 || Number(threshold) > 100) { setError("The warning threshold must be between 1% and 100%."); return; }
    if (due < end && !window.confirm("The due date is before the billing period ends. Save these dates anyway?")) return;

    setLoading(true);
    const supabase = createClient();
    if (!supabase) { setError("Northstar could not connect to the database."); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { error: saveError } = await supabase.from("billing_settings").upsert({ user_id: user.id, billing_cycle_name: name.trim() || "Main Credit Card", billing_period_start_date: start, billing_period_end_date: end, statement_due_date: due, monthly_credit_limit: limit ? Number(limit) : null, spending_warning_threshold: threshold ? Number(threshold) : 80, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (saveError) setError(saveError.message);
    else setMessage("Billing settings saved.");
    setLoading(false);
  }

  return (
    <section className="card p-5 sm:p-7" aria-labelledby="billing-heading">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-[#e2eee5] text-[#315e43]"><CalendarRange size={20} /></span>
        <div className="min-w-0 flex-1">
          <h2 id="billing-heading" className="section-heading">Billing period</h2>
          <p className="section-copy">Set the date window used by the dashboard estimate. This does not change your RBC statement.</p>
          {loading ? <div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="skeleton h-16 sm:col-span-2" /><div className="skeleton h-16" /><div className="skeleton h-16" /></div> : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="field-label sm:col-span-2 lg:col-span-3">Billing cycle name<input value={name} onChange={(event) => setName(event.target.value)} className="control" /></label>
            <label className="field-label">Period start<input type="date" value={start} onChange={(event) => setStart(event.target.value)} className="control" /></label>
            <label className="field-label">Period end<input type="date" value={end} onChange={(event) => setEnd(event.target.value)} className="control" /></label>
            <label className="field-label">Statement due<input type="date" value={due} onChange={(event) => setDue(event.target.value)} className="control" /></label>
            <label className="field-label">Credit limit <span className="font-medium text-[#7b877f]">(optional)</span><input type="number" min="0" step="0.01" value={limit} onChange={(event) => setLimit(event.target.value)} placeholder="For example, 5000" className="control" /></label>
            <label className="field-label">Warning threshold (%)<input type="number" min="1" max="100" value={threshold} onChange={(event) => setThreshold(event.target.value)} className="control" /></label>
            <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-1"><button onClick={save} className="button flex-1">Save settings</button><button onClick={reset} className="button secondary">Reset dates</button></div>
          </div>}
          {message && <div role="status" className="notice success mt-5"><CheckCircle2 size={17} />{message}</div>}
          {error && <div role="alert" className="notice error mt-5">{error}</div>}
        </div>
      </div>
    </section>
  );
}
