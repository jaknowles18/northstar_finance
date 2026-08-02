"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page grid min-h-[75vh] place-items-center">
      <div className="card max-w-lg p-7 text-center sm:p-10">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#fff0ed] text-[#a63f37]"><AlertTriangle size={21} /></span>
        <div className="eyebrow mt-6">Page interrupted</div>
        <h1 className="mb-0 mt-3 font-serif text-4xl font-semibold tracking-[-.04em]">Northstar could not finish this view.</h1>
        <p className="mt-4 text-sm leading-6 text-[#617067]">Your saved data was not changed. Try loading the page again, or return to the overview.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={reset} className="button"><RotateCcw size={16} />Try again</button><Link href="/dashboard" className="button secondary">Return to overview</Link></div>
      </div>
    </div>
  );
}
