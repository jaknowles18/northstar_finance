import { NextResponse } from "next/server";
import { parseRbcEmail, RbcParserError } from "@/lib/rbcParser";

export async function POST(request: Request) {
  try {
    const { emailText } = (await request.json()) as { emailText?: string };
    return NextResponse.json({ transactions: parseRbcEmail(emailText ?? "") });
  } catch (error) {
    const message = error instanceof RbcParserError ? error.message : "The email could not be parsed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
