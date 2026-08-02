import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="page grid min-h-[75vh] place-items-center">
      <div className="max-w-lg text-center"><span className="empty-state-icon"><Compass size={21} /></span><div className="eyebrow">Page not found</div><h1 className="mb-0 mt-3 font-serif text-5xl font-semibold tracking-[-.045em]">That path is off the map.</h1><p className="mt-4 text-sm leading-6 text-[#617067]">The page may have moved, or the address may be incomplete.</p><Link href="/dashboard" className="button mt-5">Return to overview</Link></div>
    </div>
  );
}
