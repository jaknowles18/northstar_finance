import Link from "next/link";
import { ArrowRight, CheckCircle2, Github, LockKeyhole, Sparkles } from "lucide-react";
import { SpendingChart } from "@/components/SpendingChart";
import { CategoryBars } from "@/components/ProductUI";
import { TransactionTable } from "@/components/TransactionTable";
import { demoTransactions } from "@/lib/demoData";

export const metadata = { title: "Interactive Demo" };

const money = (value: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value);

export default function DemoPage() {
  const total = demoTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const categorized = demoTransactions.filter((transaction) => transaction.category);
  const totals = new Map<string, number>();
  categorized.forEach((transaction) => totals.set(transaction.category!, (totals.get(transaction.category!) ?? 0) + transaction.amount));
  const categories = [...totals].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const chart = demoTransactions
    .slice()
    .reverse()
    .map((transaction) => ({
      day: new Date(`${transaction.transactionDate}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
      amount: transaction.amount,
    }));

  return (
    <main className="min-h-screen bg-[#f4f3ee] text-[#18231d]">
      <header className="border-b border-[#d8ddd7] bg-[#fffdfa]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/demo" className="flex items-center gap-3 text-[19px] font-extrabold tracking-[-.035em]">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#173e2b] font-serif text-xl text-white">N</span>Northstar
          </Link>
          <div className="flex items-center gap-2">
            <a href="https://github.com/jaknowles18/northstar_finance" className="button secondary small"><Github size={15} />Source</a>
            <Link href="/login" className="button small">Open app <ArrowRight size={15} /></Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="grid items-center gap-8 lg:grid-cols-[1fr_.85fr]">
          <div>
            <div className="eyebrow">Interactive portfolio demo</div>
            <h1 className="mb-0 mt-4 max-w-3xl font-serif text-[clamp(3rem,7vw,5.8rem)] font-semibold leading-[.93] tracking-[-.055em]">Spending clarity without the spreadsheet.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#617067]">Northstar turns RBC purchase-alert emails into a private, searchable spending picture. This demo uses fictional transactions and never connects to Gmail or a database.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Link href="/login" className="button">Try with an account <ArrowRight size={16} /></Link><a href="https://github.com/jaknowles18/northstar_finance#engineering-highlights" className="button secondary">Engineering details</a></div>
          </div>
          <div className="rounded-[16px] border border-[#c9dfcf] bg-[#edf6ef] p-6 sm:p-8">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#cfe8d5] text-[#285d3b]"><LockKeyhole size={19} /></span><div><div className="font-bold">Privacy by design</div><div className="text-sm text-[#617067]">Only purchase-alert content is parsed.</div></div></div>
            <ul className="mt-6 grid gap-4 pl-0 text-sm text-[#45534b]">{["Row Level Security isolates every account", "Refresh tokens are encrypted before storage", "Raw email bodies are parsed in memory, not saved"].map((item) => <li key={item} className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 flex-none text-[#3e7752]" size={17} />{item}</li>)}</ul>
          </div>
        </section>

        <section className="mt-12 overflow-hidden rounded-[18px] border border-[#d8ddd7] bg-[#fffdfa] shadow-[0_24px_70px_rgba(20,45,30,.08)]" aria-label="Northstar dashboard preview">
          <div className="flex items-center justify-between border-b border-[#e2e6e2] px-5 py-4 sm:px-7"><div><div className="eyebrow">Sample dashboard</div><div className="mt-1 text-sm font-bold">July spending overview</div></div><span className="pill"><Sparkles size={13} />Fictional data</span></div>
          <div className="grid gap-5 p-5 sm:p-7 xl:grid-cols-[1.25fr_.75fr]">
            <div className="overflow-hidden rounded-[16px] bg-[#153b28] p-6 text-white sm:p-8">
              <div className="text-[11px] font-extrabold uppercase tracking-[.13em] text-[#a9c3b1]">Recorded spending</div>
              <div className="display-number mt-3 text-5xl sm:text-6xl">{money(total)}</div>
              <div className="mt-6 rounded-xl bg-white/[.055] px-2 pt-2"><SpendingChart data={chart} variant="dark" /></div>
            </div>
            <div className="card p-6"><h2 className="section-heading">Category drivers</h2><p className="section-copy">Direct labels keep the breakdown readable without relying on colour.</p><CategoryBars items={categories} total={total} /></div>
          </div>
          <div className="border-t border-[#e7ebe7]"><div className="px-5 py-4 sm:px-7"><h2 className="section-heading">Recent activity</h2><p className="section-copy">Normalized merchants, confidence, and review state remain traceable.</p></div><TransactionTable transactions={demoTransactions} /></div>
        </section>

        <footer className="flex flex-col justify-between gap-4 py-8 text-xs text-[#6f7b73] sm:flex-row"><span>Built by James Knowles as a full-stack portfolio project.</span><span>Next.js · TypeScript · Supabase · Gmail API</span></footer>
      </div>
    </main>
  );
}
