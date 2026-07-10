import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { accessToken, decryptToken, gmailFetch, messageText } from "@/lib/gmail";
import { parseRbcEmail } from "@/lib/rbcParser";

export async function POST(){
  const supabase=await createClient(); const {data:{user}}=await supabase!.auth.getUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {data:connection,error:connectionError}=await supabase!.from("gmail_connections").select("encrypted_refresh_token,subject_filter").single();
  if(connectionError||!connection)return NextResponse.json({error:"Connect Gmail in Settings first."},{status:400});
  try{
    const token=await accessToken(decryptToken(connection.encrypted_refresh_token));
    const escaped=connection.subject_filter.replace(/"/g,"\\\"");
    const list=await gmailFetch(token,`/messages?maxResults=100&q=${encodeURIComponent(`is:unread subject:"${escaped}"`)}`);
    let imported=0,duplicates=0,failed=0,matched=0;
    for(const item of list.messages??[]){
      try{
        const message=await gmailFetch(token,`/messages/${item.id}?format=full`);
        const subject=(message.payload?.headers??[]).find((h:any)=>h.name?.toLowerCase()==="subject")?.value?.trim();
        if(subject!==connection.subject_filter)continue; matched++;
        const [parsed]=parseRbcEmail(messageText(message.payload));
        let {data:rule}=await supabase!.from("merchant_rules").select("category_id").eq("match_text",parsed.rawMerchant).maybeSingle();
        if(!rule){const fallback=await supabase!.from("merchant_rules").select("category_id").eq("normalized_name",parsed.normalizedMerchant).limit(1).maybeSingle();rule=fallback.data}
        const emailHash=crypto.createHash("sha256").update(`gmail:${item.id}`).digest("hex");
        const {error:insertError}=await supabase!.from("transactions").insert({user_id:user.id,transaction_date:parsed.transactionDate,posted_at:new Date(Number(message.internalDate)).toISOString(),amount:parsed.amount,currency:parsed.currency,raw_merchant:parsed.rawMerchant,normalized_merchant:parsed.normalizedMerchant,category_id:rule?.category_id??null,source:"gmail_rbc",email_hash:emailHash,confidence:parsed.confidence});
        if(insertError?.code==="23505")duplicates++;else if(insertError)throw insertError;else imported++;
        await gmailFetch(token,`/messages/${item.id}/modify`,{method:"POST",body:JSON.stringify({removeLabelIds:["UNREAD"]})});
      }catch{failed++}
    }
    await supabase!.from("imports").insert({user_id:user.id,source:"gmail_rbc",imported_count:imported,duplicate_count:duplicates,failed_count:failed});
    await supabase!.from("gmail_connections").update({last_synced_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("user_id",user.id);
    return NextResponse.json({imported,duplicates,failed,matched});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Gmail sync failed."},{status:500})}
}
