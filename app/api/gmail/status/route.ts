import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
export async function GET(){const supabase=await createClient();const {data:{user}}=await supabase!.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});const {data,error}=await supabase!.from("gmail_connections").select("connected_email,subject_filter,last_synced_at").maybeSingle();if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({connection:data})}
export async function DELETE(){const supabase=await createClient();const {data:{user}}=await supabase!.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});const {error}=await supabase!.from("gmail_connections").delete().eq("user_id",user.id);return error?NextResponse.json({error:error.message},{status:500}):NextResponse.json({ok:true})}

