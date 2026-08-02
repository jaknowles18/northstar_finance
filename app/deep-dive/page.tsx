"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, CircleAlert, Filter, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CategoryBars, EmptyState, Metric, PageHeader } from "@/components/ProductUI";
import type { BillingSettings, DeepDiveFilters, Transaction } from "@/lib/types";
import {
  filterTransactions,
  generateDeepDiveInsights,
  getAverageDailySpend,
  getDailySpend,
  getDateRangeFromPreset,
  getLargestTransaction,
  getMonthlySpend,
  getPreviousComparableRange,
  getSpendByCategory,
  getSpendByMerchant,
  getSpendingChange,
  getTotalSpend,
  getUncategorizedCount,
  getWeekdaySpend,
} from "@/lib/deepDiveAnalytics";

type TrendView = "daily" | "monthly" | "cumulative";
type BreakdownView = "category" | "merchant" | "weekday";

const money = (value: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value);
const categoryName = (value: any): string | null => Array.isArray(value) ? value[0]?.name ?? null : value?.name ?? null;
const initialRange = getDateRangeFromPreset("last30");
const initialFilters: DeepDiveFilters = { preset: "last30", ...initialRange, categoryIds: [], merchantIds: [], minAmount: null, maxAmount: null, searchText: "", source: "", uncategorizedOnly: false, recurringOnly: false, weekdays: [], month: null, sortBy: "newest" };

export default function DeepDivePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [billing, setBilling] = useState<BillingSettings | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [trendView, setTrendView] = useState<TrendView>("daily");
  const [breakdownView, setBreakdownView] = useState<BreakdownView>("category");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/deep-dive", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Deep Dive data could not be loaded.");
      setTransactions((payload.transactions ?? []).map((row: any) => ({
        id: row.id,
        transactionDate: row.transaction_date ?? row.created_at?.slice(0, 10) ?? null,
        amount: Number(row.amount),
        currency: row.currency,
        rawMerchant: row.raw_merchant,
        normalizedMerchant: row.normalized_merchant,
        categoryId: row.category_id,
        category: categoryName(row.categories),
        notes: row.notes,
        transactionSource: row.source,
        confidence: Number(row.confidence ?? 0),
        source: "rbc_email",
      })));
      setCategories(payload.categories ?? []);
      const bill = payload.billing;
      if (bill) setBilling({ id: bill.id, userId: bill.user_id, billingCycleName: bill.billing_cycle_name, billingPeriodStartDate: bill.billing_period_start_date, billingPeriodEndDate: bill.billing_period_end_date, statementDueDate: bill.statement_due_date, monthlyCreditLimit: bill.monthly_credit_limit ? Number(bill.monthly_credit_limit) : null, spendingWarningThreshold: bill.spending_warning_threshold ? Number(bill.spending_warning_threshold) : 80 });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Deep Dive data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function setFilter<K extends keyof DeepDiveFilters>(key: K, value: DeepDiveFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function setPreset(value: string) {
    const range = value === "custom" ? { startDate: filters.startDate, endDate: filters.endDate } : getDateRangeFromPreset(value, billing);
    setFilters((current) => ({ ...current, preset: value, ...range }));
    setPage(1);
  }

  function resetFilters() {
    const range = getDateRangeFromPreset("last30", billing);
    setFilters({ ...initialFilters, ...range });
    setPage(1);
  }

  const filtered = useMemo(() => filterTransactions(transactions, filters), [transactions, filters]);
  const previousRange = filters.startDate && filters.endDate ? getPreviousComparableRange(filters.startDate, filters.endDate) : null;
  const previous = previousRange ? filterTransactions(transactions, { ...filters, startDate: previousRange.startDate, endDate: previousRange.endDate }) : [];
  const total = getTotalSpend(filtered);
  const change = getSpendingChange(filtered, previous);
  const categorySpend = getSpendByCategory(filtered);
  const merchantSpend = getSpendByMerchant(filtered);
  const daily = getDailySpend(filtered);
  const monthly = getMonthlySpend(filtered);
  const weekday = getWeekdaySpend(filtered);
  const largest = getLargestTransaction(filtered);
  const insights = filters.startDate && filters.endDate ? generateDeepDiveInsights(filtered, previous, filters) : [];
  let cumulative = 0;
  const cumulativeData = daily.map((item) => ({ name: item.name, value: cumulative += item.value }));
  const trendData = trendView === "monthly" ? monthly : trendView === "cumulative" ? cumulativeData : daily;
  const breakdownData = breakdownView === "merchant" ? merchantSpend : breakdownView === "weekday" ? weekday : categorySpend;
  const merchants = [...new Set(transactions.map((transaction) => transaction.normalizedMerchant))].sort();
  const sources = [...new Set(transactions.map((transaction) => transaction.transactionSource).filter(Boolean))] as string[];
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const advancedFilterCount = filters.categoryIds.length + filters.merchantIds.length + (filters.minAmount !== null ? 1 : 0) + (filters.maxAmount !== null ? 1 : 0) + (filters.source ? 1 : 0) + (filters.uncategorizedOnly ? 1 : 0) + (filters.recurringOnly ? 1 : 0) + filters.weekdays.length;
  const changeLabel = change === null ? "No comparison" : `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  const changeDetail = change === null ? "No purchases in the prior period" : `${Math.abs(change).toFixed(0)}% ${change <= 0 ? "lower" : "higher"} than the prior period`;
  const trendSummary = trendData.length ? `${trendView === "cumulative" ? "Cumulative" : trendView === "monthly" ? "Monthly" : "Daily"} spending has ${trendData.length} points. The highest value shown is ${money(Math.max(...trendData.map((item) => item.value)))}.` : "No trend data matches these filters.";

  if (loading) return <div className="page"><div className="skeleton h-3 w-32" /><div className="skeleton mt-4 h-14 max-w-xl" /><div className="mt-10 grid gap-5 lg:grid-cols-4"><div className="skeleton h-28" /><div className="skeleton h-28" /><div className="skeleton h-28" /><div className="skeleton h-28" /></div><div className="skeleton mt-5 h-[380px]" /><span className="sr-only">Loading spending analysis</span></div>;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Analysis workspace"
        title="Understand the pattern."
        description="Compare a period, explore what contributed, and trace every result back to its recorded transactions."
        actions={<button onClick={resetFilters} className="button secondary"><RotateCcw size={15} />Reset filters</button>}
      />

      {error && <div role="alert" className="notice error mt-6"><span className="flex-1">{error}</span><button onClick={load} className="button secondary small">Try again</button></div>}

      <section className="card mt-8 p-5 sm:p-6" aria-labelledby="filter-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 id="filter-heading" className="section-heading flex items-center gap-2"><Filter size={17} />Choose what to analyze</h2><p className="section-copy">{filtered.length} of {transactions.length} recorded transactions match.</p></div>
          {advancedFilterCount > 0 && <span className="pill neutral">{advancedFilterCount} advanced filter{advancedFilterCount === 1 ? "" : "s"}</span>}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
          <label className="field-label">Period<select value={filters.preset} onChange={(event) => setPreset(event.target.value)} className="control"><option value="last7">Last 7 days</option><option value="last30">Last 30 days</option><option value="month">This month</option><option value="lastMonth">Last month</option><option value="3months">Last 3 months</option><option value="6months">Last 6 months</option><option value="year">This year</option>{billing && <option value="billing">Current billing period</option>}<option value="custom">Custom range</option></select></label>
          <label className="field-label">Search merchant or notes<span className="relative block"><Search size={16} className="pointer-events-none absolute left-3 top-[22px] text-[#7b877f]" /><input value={filters.searchText} onChange={(event) => setFilter("searchText", event.target.value)} placeholder="For example, Loblaws" className="control pl-9" /></span></label>
        </div>
        {filters.preset === "custom" && <div className="mt-3 grid gap-3 sm:grid-cols-2 md:max-w-[455px]"><label className="field-label">Start date<input type="date" value={filters.startDate ?? ""} onChange={(event) => setFilter("startDate", event.target.value)} className="control" /></label><label className="field-label">End date<input type="date" value={filters.endDate ?? ""} onChange={(event) => setFilter("endDate", event.target.value)} className="control" /></label></div>}

        <details className="disclosure mt-4">
          <summary><span className="flex items-center gap-2"><SlidersHorizontal size={16} />Advanced filters and sorting</span><ChevronDown size={16} aria-hidden="true" /></summary>
          <div className="p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="field-label">Category<select value={filters.categoryIds[0] ?? ""} onChange={(event) => setFilter("categoryIds", event.target.value ? [event.target.value] : [])} className="control"><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="field-label">Merchant<select value={filters.merchantIds[0] ?? ""} onChange={(event) => setFilter("merchantIds", event.target.value ? [event.target.value] : [])} className="control"><option value="">All merchants</option>{merchants.map((merchant) => <option key={merchant}>{merchant}</option>)}</select></label>
              <label className="field-label">Minimum amount<input type="number" min="0" value={filters.minAmount ?? ""} onChange={(event) => setFilter("minAmount", event.target.value ? Number(event.target.value) : null)} className="control" /></label>
              <label className="field-label">Maximum amount<input type="number" min="0" value={filters.maxAmount ?? ""} onChange={(event) => setFilter("maxAmount", event.target.value ? Number(event.target.value) : null)} className="control" /></label>
              <label className="field-label">Source<select value={filters.source} onChange={(event) => setFilter("source", event.target.value)} className="control"><option value="">All sources</option>{sources.map((source) => <option key={source}>{source}</option>)}</select></label>
              <label className="field-label">Sort by<select value={filters.sortBy} onChange={(event) => setFilter("sortBy", event.target.value)} className="control"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amountHigh">Amount: high to low</option><option value="amountLow">Amount: low to high</option><option value="merchant">Merchant: A–Z</option><option value="category">Category: A–Z</option></select></label>
              <label className="flex min-h-11 items-center gap-3 rounded-[9px] border border-[#d7ddd7] px-3 text-sm font-semibold"><input type="checkbox" checked={filters.uncategorizedOnly} onChange={(event) => setFilter("uncategorizedOnly", event.target.checked)} className="h-4 w-4 accent-[#173e2b]" />Uncategorized only</label>
              <label className="flex min-h-11 items-center gap-3 rounded-[9px] border border-[#d7ddd7] px-3 text-sm font-semibold"><input type="checkbox" checked={filters.recurringOnly} onChange={(event) => setFilter("recurringOnly", event.target.checked)} className="h-4 w-4 accent-[#173e2b]" />Recurring-looking merchants</label>
            </div>
            <fieldset className="mt-5 border-0 p-0"><legend className="text-xs font-extrabold">Days of the week</legend><div className="mt-2 flex flex-wrap gap-2">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => <button key={day} type="button" aria-pressed={filters.weekdays.includes(index)} onClick={() => setFilter("weekdays", filters.weekdays.includes(index) ? filters.weekdays.filter((item) => item !== index) : [...filters.weekdays, index])} className={`button small ${filters.weekdays.includes(index) ? "" : "secondary"}`}>{day}</button>)}</div></fieldset>
          </div>
        </details>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Period summary">
        <div className="card p-5"><Metric label="Total spent" value={money(total)} detail={`${filtered.length} matching purchase${filtered.length === 1 ? "" : "s"}`} /></div>
        <div className="card p-5"><Metric label="Change" value={changeLabel} detail={changeDetail} /></div>
        <div className="card p-5"><Metric label="Daily average" value={money(filters.startDate && filters.endDate ? getAverageDailySpend(filtered, filters.startDate, filters.endDate) : 0)} detail="Across the selected calendar days" /></div>
        <div className="card p-5"><Metric label="Largest purchase" value={largest ? money(largest.amount) : "—"} detail={largest?.normalizedMerchant ?? "No matching purchase"} /></div>
      </section>

      {!filtered.length ? <section className="card mt-5"><EmptyState title="No purchases match" description="Reset the filters or choose a different period to continue exploring." /></section> : <>
        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,.75fr)]">
          <div className="card min-w-0 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="section-heading">How did spending move?</h2><p className="section-copy">View recorded spending by day, month, or as a running total.</p></div>
              <div className="segmented" aria-label="Trend view">{(["daily", "monthly", "cumulative"] as TrendView[]).map((view) => <button key={view} onClick={() => setTrendView(view)} className={`segment ${trendView === view ? "active" : ""}`} aria-pressed={trendView === view}>{view[0].toUpperCase() + view.slice(1)}</button>)}</div>
            </div>
            <div className="mt-6" role="img" aria-label={trendSummary}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData} margin={{ left: -12, right: 12, top: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e7ebe7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#748178" }} minTickGap={28} />
                  <YAxis axisLine={false} tickLine={false} width={55} tick={{ fontSize: 10, fill: "#748178" }} tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => [money(Number(value)), trendView === "cumulative" ? "Running total" : "Spent"]} contentStyle={{ borderRadius: 9, border: "1px solid #d7ddd7" }} />
                  <Line type="monotone" dataKey="value" stroke="#356d4a" strokeWidth={2.4} dot={trendData.length < 16} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="section-heading">What contributed most?</h2><p className="section-copy">Direct values and shares of the selected total.</p></div>
              <div className="segmented" aria-label="Breakdown view">{(["category", "merchant", "weekday"] as BreakdownView[]).map((view) => <button key={view} onClick={() => setBreakdownView(view)} className={`segment ${breakdownView === view ? "active" : ""}`} aria-pressed={breakdownView === view}>{view === "weekday" ? "Day" : view[0].toUpperCase() + view.slice(1)}</button>)}</div>
            </div>
            <CategoryBars items={breakdownData} total={total} limit={7} />
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.55fr)]">
          <div className="card p-5 sm:p-6"><h2 className="section-heading">What stands out</h2><p className="section-copy">Plain-language observations based only on the purchases currently shown.</p><ul className="mb-0 mt-5 grid gap-3 pl-5 text-sm leading-6 text-[#526158]">{insights.map((insight) => <li key={insight}>{insight}</li>)}</ul><p className="mb-0 mt-5 text-xs leading-5 text-[#7b877f]">These are descriptive patterns, not financial advice.</p></div>
          <div className={`rounded-[14px] border p-5 sm:p-6 ${getUncategorizedCount(filtered) ? "border-[#e5c685] bg-[#fff4de]" : "border-[#c9dfcf] bg-[#edf6ef]"}`}><CircleAlert size={20} className={getUncategorizedCount(filtered) ? "text-[#805416]" : "text-[#2f6844]"} /><h2 className="section-heading mt-4">Data completeness</h2><p className="section-copy mt-2">{getUncategorizedCount(filtered) ? `${getUncategorizedCount(filtered)} matching purchase${getUncategorizedCount(filtered) === 1 ? " is" : "s are"} uncategorized, which can weaken category comparisons.` : "Every matching purchase has a category."}</p>{getUncategorizedCount(filtered) > 0 && <Link href="/categorize" className="button secondary mt-5 w-full">Review categories</Link>}</div>
        </section>
      </>}

      <section className="card mt-5 overflow-hidden" aria-labelledby="filtered-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7ebe7] p-5 sm:px-6"><div><h2 id="filtered-heading" className="section-heading">Transactions behind this view</h2><p className="section-copy">Every summary above traces back to these rows.</p></div><span className="text-xs font-bold text-[#68756d]">Page {safePage} of {pages}</span></div>
        {visible.length ? <div className="table-wrap"><table className="responsive-table"><thead><tr><th>Merchant</th><th>Category</th><th>Date</th><th>Source</th><th className="text-right">Amount</th></tr></thead><tbody>{visible.map((transaction) => <tr key={transaction.id}><td data-primary="true"><div className="font-bold">{transaction.normalizedMerchant}</div>{transaction.notes && <div className="mt-1 text-xs text-[#7b877f]">{transaction.notes}</div>}</td><td data-label="Category">{transaction.category ? <span className="pill">{transaction.category}</span> : <span className="pill attention">Needs attention</span>}</td><td data-label="Date" className="whitespace-nowrap text-sm text-[#59675e]">{transaction.transactionDate}</td><td data-label="Source"><span className="pill neutral">{(transaction.transactionSource ?? "unknown").replaceAll("_", " ")}</span></td><td data-label="Amount" className="money text-right font-bold">{money(transaction.amount)}</td></tr>)}</tbody></table></div> : <EmptyState title="No transactions to show" description="Change or reset the current filters." />}
        {filtered.length > pageSize && <div className="flex items-center justify-between border-t border-[#e7ebe7] p-4 text-sm"><button className="button secondary small" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><span className="text-xs font-bold text-[#68756d]">{(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}</span><button className="button secondary small" disabled={safePage === pages} onClick={() => setPage((current) => Math.min(pages, current + 1))}>Next</button></div>}
      </section>
    </div>
  );
}
