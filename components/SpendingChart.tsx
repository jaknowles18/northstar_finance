"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function SpendingChart({ data, variant = "light" }: { data: { day: string; amount: number }[]; variant?: "light" | "dark" }) {
  const total = data.reduce((sum, point) => sum + point.amount, 0);
  const highest = [...data].sort((a, b) => b.amount - a.amount)[0];
  const dark = variant === "dark";
  const label = `Daily spending chart. ${data.length} recorded days, ${new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(total)} total. Highest day was ${highest?.day ?? "not available"} at ${highest ? new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(highest.amount) : "$0"}.`;

  return (
    <div role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={data} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
          <defs><linearGradient id={`spend-${variant}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={dark ? "#9fceb0" : "#4f8060"} stopOpacity={dark ? .28 : .2} /><stop offset="1" stopColor={dark ? "#9fceb0" : "#4f8060"} stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke={dark ? "rgba(255,255,255,.11)" : "#e6eae6"} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: dark ? "#adc3b4" : "#748178", fontSize: 10 }} minTickGap={24} />
          <YAxis axisLine={false} tickLine={false} width={48} tick={{ fill: dark ? "#adc3b4" : "#748178", fontSize: 10 }} tickFormatter={(value) => `$${value}`} />
          <Tooltip formatter={(value) => [new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(value)), "Spent"]} labelStyle={{ color: "#14231b", fontWeight: 700 }} contentStyle={{ borderRadius: 9, border: "1px solid #d7ddd7", boxShadow: "0 8px 24px rgba(20,35,27,.08)" }} />
          <Area type="monotone" dataKey="amount" stroke={dark ? "#a8d3b7" : "#356d4a"} strokeWidth={2.25} fill={`url(#spend-${variant})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
