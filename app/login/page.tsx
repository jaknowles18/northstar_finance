"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  useEffect(() => {
    const message = new URLSearchParams(window.location.search).get("error");
    if (message) setError(message);
  }, []);

  const confirmationRedirect = () => `${window.location.origin}/auth/callback`;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setAwaitingConfirmation(false);
    const supabase = createClient();
    if (!supabase) { setError("Northstar is not connected to Supabase."); setLoading(false); return; }
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: confirmationRedirect() } });
    if (result.error) setError(result.error.message);
    else if (mode === "signup" && !result.data.session) {
      setMessage("Check your inbox to confirm your account. The newest link will return you to Northstar.");
      setAwaitingConfirmation(true);
    } else window.location.href = "/dashboard";
    setLoading(false);
  }

  async function resend() {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const result = await supabase?.auth.resend({ type: "signup", email, options: { emailRedirectTo: confirmationRedirect() } });
    if (result?.error) setError(result.error.message);
    else setMessage("A new confirmation email was sent. Use only the newest link.");
    setLoading(false);
  }

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError("");
    setMessage("");
    setAwaitingConfirmation(false);
  }

  return (
    <main className="min-h-screen bg-[#f4f3ee] lg:grid lg:grid-cols-[minmax(390px,.82fr)_minmax(520px,1.18fr)]">
      <section className="relative hidden overflow-hidden bg-[#123523] p-12 text-white lg:flex lg:min-h-screen lg:flex-col xl:p-16" aria-labelledby="login-intro">
        <div className="flex items-center gap-3 text-xl font-extrabold tracking-[-.035em]"><span className="grid h-10 w-10 place-items-center rounded-[11px] bg-[#c7e5d0] font-serif text-xl text-[#143b28]">N</span>Northstar</div>
        <div className="my-auto max-w-xl py-16">
          <div className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#9db6a5]">Private spending clarity</div>
          <h1 id="login-intro" className="mb-0 mt-5 font-serif text-[clamp(3.3rem,5.2vw,5.8rem)] font-semibold leading-[.93] tracking-[-.055em]">See where your money went—and what to do next.</h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[#bdd0c2]">Turn RBC purchase alerts into a private, searchable spending picture without giving up clarity or control.</p>
          <ul className="mt-9 grid gap-4 pl-0 text-sm text-[#d5e1d8]">{["Compare this month with the last", "Resolve uncategorized merchants once", "Trace every insight to a recorded purchase"].map((item) => <li key={item} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-white/10"><Check size={14} /></span>{item}</li>)}</ul>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#91a99a]"><LockKeyhole size={14} />Your account data is isolated with Supabase Row Level Security.</div>
      </section>

      <section className="grid min-h-screen place-items-center p-5 sm:p-8">
        <div className="w-full max-w-[470px]">
          <div className="mb-10 flex items-center gap-3 text-xl font-extrabold tracking-[-.035em] lg:hidden"><span className="grid h-10 w-10 place-items-center rounded-[11px] bg-[#173e2b] font-serif text-xl text-white">N</span>Northstar</div>
          <div className="mb-7">
            <div className="eyebrow">{mode === "login" ? "Welcome back" : "Explore Northstar"}</div>
            <h1 className="mb-0 mt-3 font-serif text-4xl font-semibold tracking-[-.045em] sm:text-5xl">{mode === "login" ? "Sign in to your spending." : "Create a private account."}</h1>
            <p className="mb-0 mt-3 text-sm leading-6 text-[#617067]">{mode === "login" ? "Pick up where you left off." : "Use a separate account to explore the interface with isolated data."}</p>
          </div>

          <div className="segmented mb-6 w-full" aria-label="Authentication mode"><button type="button" onClick={() => switchMode("login")} className={`segment min-h-10 flex-1 ${mode === "login" ? "active" : ""}`} aria-pressed={mode === "login"}>Sign in</button><button type="button" onClick={() => switchMode("signup")} className={`segment min-h-10 flex-1 ${mode === "signup" ? "active" : ""}`} aria-pressed={mode === "signup"}>Create account</button></div>

          <form onSubmit={submit} className="space-y-5">
            <label className="field-label">Email address<input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="control" /></label>
            <label className="field-label">Password<span className="relative block"><input required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="control pr-12" /><button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute bottom-1 right-1 grid h-10 w-10 place-items-center rounded-lg text-[#68756d]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span><span className="field-hint">At least 6 characters.</span></label>
            {error && <div role="alert" className="notice error">{error}</div>}
            {message && <div role="status" className="notice success">{message}</div>}
            <button disabled={loading} className="button w-full">{loading ? <Loader2 size={17} className="animate-spin" /> : <ArrowRight size={17} />}{mode === "login" ? "Sign in" : "Create account"}</button>
          </form>
          {awaitingConfirmation && <button onClick={resend} disabled={loading} className="button secondary mt-3 w-full">Resend confirmation email</button>}
          <div className="my-5 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#8a958e]"><span className="h-px flex-1 bg-[#d8ddd7]" />Portfolio preview<span className="h-px flex-1 bg-[#d8ddd7]" /></div>
          <Link href="/demo" className="button secondary w-full">Explore the demo <ArrowRight size={17} /></Link>
          <p className="mb-0 mt-6 text-center text-xs leading-5 text-[#7b877f]">Northstar analyzes imported transaction alerts. It does not connect to your full bank balance or provide financial advice.</p>
        </div>
      </section>
    </main>
  );
}
