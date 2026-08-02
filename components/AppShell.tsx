"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartNoAxesCombined,
  CircleAlert,
  FileUp,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Store,
} from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

const primaryLinks = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/transactions", "Transactions", ReceiptText],
  ["/categorize", "Needs attention", CircleAlert],
  ["/deep-dive", "Deep Dive", ChartNoAxesCombined],
  ["/import", "Import", FileUp],
] as const;

const manageLinks = [
  ["/merchants", "Merchants", Store],
  ["/settings", "Settings", Settings],
] as const;

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 text-[19px] font-extrabold tracking-[-.035em]" aria-label="Northstar overview">
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#c7e5d0] font-serif text-xl font-bold text-[#143b28]" aria-hidden="true">N</span>
      Northstar
    </Link>
  );
}

function NavLink({ href, label, Icon, path }: { href: string; label: string; Icon: typeof LayoutDashboard; path: string }) {
  const active = path === href;
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-[9px] px-3 text-sm font-semibold transition-colors ${active ? "bg-white/12 text-white" : "text-[#b8c9be] hover:bg-white/[.07] hover:text-white"}`}>
      <Icon size={18} strokeWidth={active ? 2.25 : 1.8} aria-hidden="true" />
      <span>{label}</span>
      {label === "Needs attention" && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#efc06d]" aria-hidden="true" />}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/login" || path === "/demo") return children;

  async function signOut() {
    const supabase = createClient();
    await supabase?.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
      <a className="skip-link" href="#main-content">Skip to main content</a>

      <aside className="sticky top-0 hidden h-screen flex-col bg-[#123523] px-4 py-5 text-white lg:flex" aria-label="Primary navigation">
        <div className="px-2"><Brand /></div>
        <nav className="mt-9 space-y-1" aria-label="Spending">
          <div className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#829d8b]">Spending</div>
          {primaryLinks.map(([href, label, Icon]) => <NavLink key={href} href={href} label={label} Icon={Icon} path={path} />)}
        </nav>
        <nav className="mt-7 space-y-1" aria-label="Manage">
          <div className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#829d8b]">Manage</div>
          {manageLinks.map(([href, label, Icon]) => <NavLink key={href} href={href} label={label} Icon={Icon} path={path} />)}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-4">
          <p className="px-3 text-xs leading-5 text-[#9fb5a7]">Private by default. Raw email bodies are not stored.</p>
          <button onClick={signOut} className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-[9px] px-3 text-sm font-semibold text-[#b8c9be] hover:bg-white/[.07] hover:text-white">
            <LogOut size={17} aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#d8ddd7] bg-[#f4f3ee]/95 px-4 backdrop-blur lg:hidden">
          <Brand />
          <details className="group relative">
            <summary className="icon-button list-none" aria-label="Open navigation menu"><Menu size={20} /><span className="sr-only">Menu</span></summary>
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#d8ddd7] bg-[#fffdfa] p-2 shadow-xl">
              <div className="px-3 pb-2 pt-1 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#7a867e]">All pages</div>
              {[...primaryLinks, ...manageLinks].map(([href, label, Icon]) => {
                const active = path === href;
                return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold ${active ? "bg-[#e2eee5] text-[#173e2b]" : "text-[#536159] hover:bg-[#f0f1ec]"}`}><Icon size={17} />{label}</Link>;
              })}
              <button onClick={signOut} className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-lg border-t border-[#e3e7e2] px-3 text-sm font-semibold text-[#7a4a45]"><LogOut size={17} />Sign out</button>
            </div>
          </details>
        </header>

        <main id="main-content" tabIndex={-1}>{children}</main>

        <nav className="fixed inset-x-3 bottom-3 z-20 grid grid-cols-5 rounded-[14px] border border-[#ccd4cd] bg-[#fffdfa]/95 p-1.5 shadow-[0_12px_35px_rgba(15,35,24,.16)] backdrop-blur lg:hidden" aria-label="Mobile navigation">
          {primaryLinks.map(([href, label, Icon]) => {
            const active = path === href;
            return <Link key={href} href={href} aria-label={label} aria-current={active ? "page" : undefined} className={`flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-[9px] text-[9px] font-bold ${active ? "bg-[#dceee1] text-[#143b28]" : "text-[#68756d]"}`}><Icon size={18} strokeWidth={active ? 2.4 : 1.8} /><span>{label === "Needs attention" ? "Review" : label === "Transactions" ? "Activity" : label}</span></Link>;
          })}
        </nav>
      </div>
    </div>
  );
}
