"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, LockKeyhole, Mail, RefreshCw, Unplug } from "lucide-react";
import { BillingSettingsForm } from "@/components/BillingSettingsForm";
import { PageHeader } from "@/components/ProductUI";

type Connection = { connected_email: string | null; subject_filter: string; last_synced_at: string | null };

export default function SettingsPage() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("gmail") === "connected") setMessage("Gmail connected successfully.");
    if (params.get("gmail_error")) setError(params.get("gmail_error") ?? "Gmail could not be connected.");
    void status();
  }, []);

  async function status() {
    try {
      const response = await fetch("/api/gmail/status", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) { setConnection(data.connection); if (data.connection) setSubject(data.connection.subject_filter); }
      else setError(data.error ?? "Gmail status could not be loaded.");
    } catch {
      setError("Gmail status could not be loaded. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function connect() {
    if (!subject.trim()) { setError("Enter the exact RBC email subject first."); return; }
    setError("");
    window.location.href = `/api/gmail/connect?subject=${encodeURIComponent(subject.trim())}`;
  }

  async function sync() {
    setSyncing(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/gmail/sync", { method: "POST" });
      const data = await response.json();
      if (response.ok) setMessage(`Sync complete: ${data.imported} imported, ${data.duplicates} duplicate${data.duplicates === 1 ? "" : "s"}, ${data.failed} failed.`);
      else setError(data.error ?? "Gmail sync failed.");
      await status();
    } catch {
      setError("Gmail sync could not finish. Check your connection and try again.");
    } finally {
      setSyncing(false);
    }
  }

  async function disconnect() {
    if (!window.confirm("Disconnect Gmail from Northstar? You can reconnect later.")) return;
    setError("");
    const response = await fetch("/api/gmail/status", { method: "DELETE" });
    if (response.ok) { setConnection(null); setMessage("Gmail disconnected."); }
    else { const data = await response.json(); setError(data.error ?? "Gmail could not be disconnected."); }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Preferences" title="Settings and connections." description="Define the billing window Northstar analyzes and manage the Gmail connection used for imports." />
      <div className="mt-8 grid max-w-5xl gap-5">
        <BillingSettingsForm />

        <section className="card p-5 sm:p-7" aria-labelledby="gmail-heading">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-[#e2eee5] text-[#315e43]"><Mail size={20} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="gmail-heading" className="section-heading">Gmail import</h2><p className="section-copy">Northstar processes unread messages only when their subject exactly matches your filter.</p></div>{connection && <span className="pill"><CheckCircle2 size={13} />Connected</span>}</div>

              {loading ? <div className="mt-6"><div className="skeleton h-20 w-full" /><span className="sr-only">Loading Gmail connection</span></div> : connection ? <div className="mt-6 grid gap-4 rounded-[11px] border border-[#d7ddd7] bg-[#f5f6f2] p-4 sm:grid-cols-2">
                <div><div className="text-[10px] font-extrabold uppercase tracking-[.11em] text-[#7b877f]">Connected account</div><div className="mt-2 break-all text-sm font-bold">{connection.connected_email || "Google account"}</div></div>
                <div><div className="text-[10px] font-extrabold uppercase tracking-[.11em] text-[#7b877f]">Last sync</div><div className="mt-2 text-sm font-bold">{connection.last_synced_at ? new Date(connection.last_synced_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : "Not synced yet"}</div></div>
                <div className="sm:col-span-2"><div className="text-[10px] font-extrabold uppercase tracking-[.11em] text-[#7b877f]">Exact subject filter</div><div className="mt-2 break-words font-mono text-xs text-[#526158]">{connection.subject_filter}</div></div>
              </div> : <label className="field-label mt-6 max-w-2xl">Exact RBC email subject<input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Paste the complete subject line" className="control" /><span className="field-hint">Capitalization and punctuation must match the incoming message.</span></label>}

              <div className="mt-5 flex flex-wrap gap-3">{connection ? <><button onClick={sync} disabled={syncing} className="button">{syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}Sync unread messages</button><button onClick={disconnect} disabled={syncing} className="button secondary"><Unplug size={16} />Disconnect</button></> : <button onClick={connect} disabled={loading} className="button">Connect Gmail</button>}</div>
              {message && <div role="status" className="notice success mt-5"><CheckCircle2 size={17} />{message}</div>}
              {error && <div role="alert" className="notice error mt-5">{error}</div>}
            </div>
          </div>
        </section>

        <section className="surface p-5 sm:p-7" aria-labelledby="privacy-heading"><div className="flex items-start gap-4"><span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-[#e2eee5] text-[#315e43]"><LockKeyhole size={20} /></span><div><h2 id="privacy-heading" className="section-heading">How Northstar handles email data</h2><p className="section-copy mt-2 max-w-3xl">Google refresh tokens are encrypted before storage. Matching email bodies are parsed in memory and are not saved. A message is marked read only after its purchases are saved or identified as duplicates.</p></div></div></section>
      </div>
    </div>
  );
}
