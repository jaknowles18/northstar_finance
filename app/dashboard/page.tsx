import Link from "next/link";
import { ArrowRight, CalendarClock, CircleAlert, CircleCheck, FileUp } from "lucide-react";
import { SpendingChart } from "@/components/SpendingChart";
import { TransactionTable } from "@/components/TransactionTable";
import { CategoryBars, EmptyState, Metric, PageHeader } from "@/components/ProductUI";
import { createClient } from "@/lib/supabaseServer";
import type { BillingSettings, Transaction } from "@/lib/types";
import { generateBillingSummary } from "@/lib/billingAnalytics";

export const dynamic = "force-dynamic";

const money = (value: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value);
const categoryName = (value: any): string | null => Array.isArray(value) ? value[0]?.name ?? null : value?.name ?? null;
const transactionDate = (value: string) => new Date(`${value}T12:00:00`);

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [{ data }, { data: billingRow }] = supabase ? await Promise.all([
    supabase.from("transactions").select("id,transaction_date,amount,currency,raw_merchant,normalized_merchant,confidence,categories(name)").order("transaction_date", { ascending: false }),
    supabase.from("billing_settings").select("*").maybeSingle(),
  ]) : [{ data: [] }, { data: null }];

  const rows = (data ?? []).map((row: any) => ({ ...row, amount: Number(row.amount), category: categoryName(row.categories) }));
  const thisMonth = rows.filter((row) => row.transaction_date && transactionDate(row.transaction_date) >= monthStart && transactionDate(row.transaction_date) <= now);
  const previousMonth = rows.filter((row) => row.transaction_date && transactionDate(row.transaction_date) >= previousMonthStart && transactionDate(row.transaction_date) <= previousMonthEnd);
  const total = thisMonth.reduce((sum, row) => sum + row.amount, 0);
  const previousTotal = previousMonth.reduce((sum, row) => sum + row.amount, 0);
  const change = previousTotal > 0 ? (total - previousTotal) / previousTotal * 100 : null;
  const uncategorized = rows.filter((row) => !row.category).length;
  const largest = [...thisMonth].sort((a, b) => b.amount - a.amount)[0];

  const categoryTotals = new Map<string, number>();
  thisMonth.forEach((row) => categoryTotals.set(row.category ?? "Uncategorized", (categoryTotals.get(row.category ?? "Uncategorized") ?? 0) + row.amount));
  const spendingByCategory = [...categoryTotals].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const daily = new Map<string, number>();
  thisMonth.forEach((row) => {
    if (row.transaction_date) daily.set(row.transaction_date, (daily.get(row.transaction_date) ?? 0) + row.amount);
  });
  const chart = [...daily].sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({
    day: transactionDate(date).toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
    amount,
  }));

  const recentTransactions: Transaction[] = rows.slice(0, 5).map((row) => ({
    id: row.id,
    transactionDate: row.transaction_date,
    amount: row.amount,
    currency: row.currency,
    rawMerchant: row.raw_merchant,
    normalizedMerchant: row.normalized_merchant,
    confidence: Number(row.confidence ?? 0),
    source: "rbc_email",
    category: row.category,
  }));
  const allTransactions: Transaction[] = rows.map((row) => ({
    id: row.id,
    transactionDate: row.transaction_date,
    amount: row.amount,
    currency: row.currency,
    rawMerchant: row.raw_merchant,
    normalizedMerchant: row.normalized_merchant,
    confidence: Number(row.confidence ?? 0),
    source: "rbc_email",
    category: row.category,
  }));

  const billing: BillingSettings | null = billingRow ? {
    id: billingRow.id,
    userId: billingRow.user_id,
    billingCycleName: billingRow.billing_cycle_name,
    billingPeriodStartDate: billingRow.billing_period_start_date,
    billingPeriodEndDate: billingRow.billing_period_end_date,
    statementDueDate: billingRow.statement_due_date,
    monthlyCreditLimit: billingRow.monthly_credit_limit ? Number(billingRow.monthly_credit_limit) : null,
    spendingWarningThreshold: billingRow.spending_warning_threshold ? Number(billingRow.spending_warning_threshold) : 80,
  } : null;
  const bill = billing ? generateBillingSummary(billing, allTransactions) : null;
  const periodName = now.toLocaleDateString("en-CA", { month: "long" });
  const comparison = change === null
    ? "No previous-month data to compare yet"
    : `${Math.abs(change).toFixed(0)}% ${change <= 0 ? "less" : "more"} than ${previousMonthStart.toLocaleDateString("en-CA", { month: "long" })}`;

  return (
    <div className="page">
      <PageHeader
        eyebrow={now.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
        title="Your month, at a glance."
        description="A clear check-in on what you have spent, what is driving it, and what needs a quick review."
        actions={<Link href="/import" className="button"><FileUp size={16} />Import transactions</Link>}
      />

      <section className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,.65fr)]" aria-label="Monthly spending overview">
        <div className="overflow-hidden rounded-[16px] bg-[#153b28] text-white">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[.13em] text-[#a9c3b1]">Spent in {periodName}</div>
              <div className="display-number mt-3 text-[clamp(3rem,7vw,5.25rem)] leading-none">{money(total)}</div>
              <p className="mb-0 mt-4 flex items-center gap-2 text-sm text-[#c6d7cb]">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10" aria-hidden="true">{change !== null && change <= 0 ? "↓" : change !== null ? "↑" : "·"}</span>
                {comparison}
              </p>
            </div>
            <div className="min-w-0 rounded-xl bg-white/[.055] px-2 pt-3">
              {chart.length > 1 ? <SpendingChart data={chart} variant="dark" /> : <div className="grid h-[220px] place-items-center px-5 text-center text-sm text-[#b8cbbf]">The monthly trend appears after spending is recorded on more than one day.</div>}
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-white/10 sm:grid-cols-3">
            <div className="border-r border-white/10 px-6 py-4"><div className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#9fb6a7]">Transactions</div><div className="mt-1 text-lg font-bold tabular-nums">{thisMonth.length}</div></div>
            <div className="px-6 py-4 sm:border-r sm:border-white/10"><div className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#9fb6a7]">Daily average</div><div className="mt-1 text-lg font-bold tabular-nums">{money(total / Math.max(now.getDate(), 1))}</div></div>
            <div className="col-span-2 border-t border-white/10 px-6 py-4 sm:col-span-1 sm:border-t-0"><div className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#9fb6a7]">Largest purchase</div><div className="mt-1 truncate text-lg font-bold tabular-nums">{largest ? money(largest.amount) : "—"}</div></div>
          </div>
        </div>

        <aside className={`flex flex-col rounded-[16px] border p-6 sm:p-7 ${uncategorized ? "border-[#e5c685] bg-[#fff4de]" : "border-[#c9dfcf] bg-[#edf6ef]"}`} aria-labelledby="attention-title">
          <div className={`grid h-10 w-10 place-items-center rounded-full ${uncategorized ? "bg-[#f5d89b] text-[#72490e]" : "bg-[#cfe8d5] text-[#285d3b]"}`}>
            {uncategorized ? <CircleAlert size={20} /> : <CircleCheck size={20} />}
          </div>
          <div className="mt-7 text-[11px] font-extrabold uppercase tracking-[.13em] text-[#6a725f]">Needs attention</div>
          <h2 id="attention-title" className="mb-0 mt-2 font-serif text-3xl font-semibold leading-[1.05] tracking-[-.035em]">
            {uncategorized ? `${uncategorized} purchase${uncategorized === 1 ? "" : "s"} need a category.` : "Everything is organized."}
          </h2>
          <p className="mb-6 mt-3 text-sm leading-6 text-[#626c62]">
            {uncategorized ? "Categorize a merchant once and Northstar can apply your choice to future imports." : "There are no uncategorized transactions in your ledger."}
          </p>
          <Link href={uncategorized ? "/categorize" : "/transactions"} className="button secondary mt-auto w-full">{uncategorized ? "Review now" : "View transactions"}<ArrowRight size={16} /></Link>
        </aside>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
        <div className="card p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="section-heading">What is driving your spending?</h2><p className="section-copy">Top categories in {periodName}, including uncategorized purchases.</p></div>
            <Link href="/deep-dive" className="button ghost small">Explore <ArrowRight size={14} /></Link>
          </div>
          <CategoryBars items={spendingByCategory} total={total} />
        </div>

        <div className="card p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[#e5ede7] text-[#315e42]"><CalendarClock size={19} /></span>
            <div><h2 className="section-heading">Next bill estimate</h2><p className="section-copy">Based on the billing period you set—not a bank statement.</p></div>
          </div>
          {bill && billing ? <>
            <div className="mt-7"><div className="display-number text-4xl">{money(bill.projected)}</div><p className="mt-2 text-sm text-[#617067]">Projected from {money(bill.spend)} recorded so far</p></div>
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5"><Metric label="Current period" value={money(bill.spend)} detail={bill.rangeLabel} /><Metric label="Due" value={bill.dueLabel.replace(`, ${now.getFullYear()}`, "")} detail={`${bill.daysRemaining} days remain in this cycle`} /></div>
            {bill.creditLimitUsage !== null && <div className="mt-6"><div className="mb-2 flex justify-between text-xs font-bold text-[#617067]"><span>Recorded credit-limit use</span><span>{bill.creditLimitUsage.toFixed(0)}%</span></div><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(bill.creditLimitUsage, 100)}%` }} /></div><p className="mb-0 mt-2 text-xs leading-5 text-[#7b877f]">This uses imported purchases only and may differ from RBC.</p></div>}
          </> : <div className="mt-7"><p className="text-sm leading-6 text-[#617067]">Add your statement dates to see current-cycle spending and a simple projection.</p><Link href="/settings" className="button secondary mt-3">Set billing period</Link></div>}
        </div>
      </section>

      <section className="card mt-5 overflow-hidden" aria-labelledby="recent-heading">
        <div className="flex items-center justify-between gap-4 border-b border-[#e7ebe7] px-5 py-4 sm:px-6">
          <div><h2 id="recent-heading" className="section-heading">Recent activity</h2><p className="section-copy">Your five newest recorded purchases.</p></div>
          <Link className="text-sm font-bold text-[#315e43] hover:underline" href="/transactions">View all</Link>
        </div>
        {recentTransactions.length ? <TransactionTable transactions={recentTransactions} /> : <EmptyState title="No transactions yet" description="Import an RBC purchase notification to create your private spending ledger." actionHref="/import" actionLabel="Import transactions" />}
      </section>

      <p className="mb-0 mt-5 text-xs leading-5 text-[#7b877f]">Northstar summarizes the transaction data you import. It is not financial advice and may not reflect pending charges, refunds, fees, or your official account balance.</p>
    </div>
  );
}
