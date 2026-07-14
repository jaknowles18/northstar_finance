import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorDescription = url.searchParams.get("error_description");
  if (errorDescription) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorDescription)}`, url.origin));
  if (!code) return NextResponse.redirect(new URL("/login?error=Confirmation+link+is+invalid+or+has+expired", url.origin));

  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(new URL("/login?error=Supabase+is+not+configured", url.origin));
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
  return NextResponse.redirect(new URL("/dashboard?confirmed=true", url.origin));
}

