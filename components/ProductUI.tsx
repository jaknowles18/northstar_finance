import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="subtitle">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function EmptyState({ title, description, actionHref, actionLabel }: { title: string; description: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="empty-state">
      <div>
        <span className="empty-state-icon"><Inbox size={21} aria-hidden="true" /></span>
        <h2 className="m-0 font-serif text-2xl font-semibold tracking-[-.025em]">{title}</h2>
        <p className="mx-auto mb-0 mt-2 max-w-md text-sm leading-6 text-[#617067]">{description}</p>
        {actionHref && actionLabel && <Link href={actionHref} className="button mt-5">{actionLabel}<ArrowRight size={16} /></Link>}
      </div>
    </div>
  );
}

export function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="metric"><div className="metric-label">{label}</div><div className="metric-value">{value}</div>{detail && <div className="metric-detail">{detail}</div>}</div>;
}

export function CategoryBars({ items, total, limit = 5 }: { items: { name: string; value: number }[]; total: number; limit?: number }) {
  if (!items.length) return <p className="my-8 text-sm text-[#617067]">Categorize transactions to see what is driving your spending.</p>;
  return (
    <div className="mt-6 space-y-5" role="list" aria-label="Spending by category">
      {items.slice(0, limit).map((item) => {
        const share = total > 0 ? Math.round(item.value / total * 100) : 0;
        return <div key={item.name} role="listitem">
          <div className="mb-2 flex items-baseline justify-between gap-4 text-sm"><span className="font-bold">{item.name}</span><span className="money text-[#4f5e55]">{new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(item.value)} <span className="text-xs text-[#7b877f]">· {share}%</span></span></div>
          <div className="bar-track" aria-hidden="true"><div className="bar-fill" style={{ width: `${Math.max(share, 2)}%` }} /></div>
        </div>;
      })}
    </div>
  );
}
