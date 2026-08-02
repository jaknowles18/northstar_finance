import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { createClient } from "@/lib/supabaseServer";
import { EmptyState, Metric, PageHeader } from "@/components/ProductUI";

export const dynamic = "force-dynamic";
const categoryName = (value: any): string | null => Array.isArray(value) ? value[0]?.name ?? null : value?.name ?? null;
const money = (value: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value);

export default async function MerchantsPage() {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.from("transactions").select("raw_merchant,normalized_merchant,amount,categories(name)") : { data: [] };
  const grouped = new Map<string, { name: string; raw: Set<string>; category: string | null; spent: number; count: number }>();
  (data ?? []).forEach((transaction: any) => {
    const current = grouped.get(transaction.normalized_merchant) ?? { name: transaction.normalized_merchant, raw: new Set<string>(), category: categoryName(transaction.categories), spent: 0, count: 0 };
    current.raw.add(transaction.raw_merchant);
    current.spent += Number(transaction.amount);
    current.count += 1;
    if (!current.category) current.category = categoryName(transaction.categories);
    grouped.set(transaction.normalized_merchant, current);
  });
  const rows = [...grouped.values()].sort((a, b) => b.spent - a.spent);
  const total = rows.reduce((sum, row) => sum + row.spent, 0);
  const uncategorized = rows.filter((row) => !row.category).length;

  return (
    <div className="page">
      <PageHeader eyebrow="Merchant patterns" title="See repeat spending clearly." description="Northstar groups store numbers and location details under a consistent merchant name so totals are easier to understand." actions={uncategorized ? <Link href="/categorize" className="button secondary"><CircleAlert size={16} />Review uncategorized</Link> : undefined} />
      <section className="card mt-8 overflow-hidden" aria-labelledby="merchant-list-heading">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-b border-[#e7ebe7] p-5 sm:grid-cols-4 sm:p-6">
          <Metric label="Merchants" value={String(rows.length)} detail="Normalized names" />
          <Metric label="Recorded total" value={money(total)} detail="Across all dates" />
          <Metric label="Top merchant" value={rows[0]?.name ?? "—"} detail={rows[0] ? money(rows[0].spent) : "No purchases yet"} />
          <Metric label="Uncategorized" value={String(uncategorized)} detail={uncategorized ? "Merchant groups to review" : "All merchant groups organized"} />
        </div>
        {rows.length ? <div className="table-wrap"><table className="responsive-table"><thead><tr><th id="merchant-list-heading">Merchant</th><th>Raw names seen</th><th>Category</th><th>Purchases</th><th className="text-right">Recorded total</th></tr></thead><tbody>{rows.map((row) => <tr key={row.name}>
          <td data-primary="true" className="font-bold">{row.name}</td>
          <td data-label="Raw names" className="max-w-md text-sm text-[#6a776f]"><span className="line-clamp-2">{[...row.raw].join(", ")}</span></td>
          <td data-label="Category">{row.category ? <span className="pill">{row.category}</span> : <span className="pill attention">Uncategorized</span>}</td>
          <td data-label="Purchases" className="money text-sm">{row.count}</td>
          <td data-label="Total" className="money text-right font-bold">{money(row.spent)}</td>
        </tr>)}</tbody></table></div> : <EmptyState title="No merchant patterns yet" description="Merchant totals will appear after your first import." actionHref="/import" actionLabel="Import transactions" />}
      </section>
    </div>
  );
}
