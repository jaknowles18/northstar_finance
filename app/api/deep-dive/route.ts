import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Your session expired. Sign in again." }, { status: 401 });

  const [transactions, categories, billing] = await Promise.all([
    supabase.from("transactions").select("id,transaction_date,created_at,amount,currency,raw_merchant,normalized_merchant,category_id,notes,source,confidence,categories(name)").order("transaction_date", { ascending: false, nullsFirst: false }),
    supabase.from("categories").select("id,name").order("name"),
    supabase.from("billing_settings").select("*").maybeSingle(),
  ]);
  if (transactions.error) return NextResponse.json({ error: `Transactions could not be loaded: ${transactions.error.message}` }, { status: 500 });
  if (categories.error) return NextResponse.json({ error: `Categories could not be loaded: ${categories.error.message}` }, { status: 500 });
  if (billing.error && billing.error.code !== "PGRST116") return NextResponse.json({ error: `Billing settings could not be loaded: ${billing.error.message}` }, { status: 500 });
  return NextResponse.json({ transactions: transactions.data ?? [], categories: categories.data ?? [], billing: billing.data ?? null });
}
