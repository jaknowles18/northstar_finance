"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CircleDollarSign, FileUp, LayoutDashboard, List, Settings, Tags, Telescope } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

const links = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/deep-dive", "Deep Dive", Telescope],
  ["/transactions", "Transactions", List],
  ["/import", "Import", FileUp],
  ["/categorize", "Needs Attention", Tags],
  ["/merchants", "Merchants", BarChart3],
  ["/settings", "Settings", Settings],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/login") return children;
  async function signOut() { const supabase = createClient(); await supabase?.auth.signOut(); window.location.href = "/login"; }
  return <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
    <aside className="hidden border-r border-[#dfe4df] bg-[#f2f5f1] p-5 md:flex md:flex-col">
      <Link href="/dashboard" className="mb-10 flex items-center gap-3 px-2 text-xl font-extrabold tracking-[-.03em]">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#173f2b] text-white"><CircleDollarSign size={20}/></span> Northstar
      </Link>
      <nav className="space-y-1">{links.map(([href, label, Icon]) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${path === href ? "bg-white text-[#173f2b] shadow-sm" : "text-[#667269] hover:bg-white/60"}`}><Icon size={18}/>{label}</Link>)}</nav>
      <div className="mt-auto"><div className="rounded-2xl bg-[#173f2b] p-4 text-white"><div className="mb-1 text-sm font-bold">Your data stays yours.</div><p className="m-0 text-xs leading-5 text-[#bfd1c4]">Raw email bodies are parsed in memory and never stored by default.</p></div><button onClick={signOut} className="mt-3 w-full rounded-xl border border-[#d9dfda] bg-transparent px-3 py-2 text-sm font-semibold text-[#667269]">Sign out</button></div>
    </aside>
    <main>{children}</main>
    <nav className="fixed inset-x-3 bottom-3 z-20 flex justify-around rounded-2xl border border-[#dfe4df] bg-white/95 p-2 shadow-xl backdrop-blur md:hidden">{links.slice(0,5).map(([href, label, Icon]) => <Link key={href} href={href} aria-label={label} className={`rounded-xl p-3 ${path === href ? "bg-[#e4f0e7] text-[#173f2b]" : "text-[#778078]"}`}><Icon size={19}/></Link>)}</nav>
  </div>;
}
