export function StatCard({ label, value, detail, tone = "plain" }: { label: string; value: string; detail: string; tone?: "plain" | "green" }) {
  return <div className={`card p-5 ${tone === "green" ? "!border-[#173f2b] !bg-[#173f2b] !text-white" : ""}`}><div className={`text-xs font-bold uppercase tracking-[.1em] ${tone === "green" ? "text-[#bcd0c1]" : "text-[#778078]"}`}>{label}</div><div className="mt-3 font-serif text-3xl tracking-[-.03em]">{value}</div><div className={`mt-2 text-xs ${tone === "green" ? "text-[#bcd0c1]" : "text-[#788179]"}`}>{detail}</div></div>;
}

