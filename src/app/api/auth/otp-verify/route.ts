import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { telephone, code } = await req.json();

  if (!telephone || !code) {
    return NextResponse.json({ error: "Téléphone et code requis" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const tel = telephone.replace(/[\s\-]/g, "");

  // Chercher le code OTP valide
  const { data: otpRecord } = await supabase
    .from("otp_codes")
    .select("*")
    .eq("telephone", tel)
    .eq("code", code)
    .eq("utilise", false)
    .gte("expire_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!otpRecord) {
    return NextResponse.json({ error: "Code OTP invalide ou expiré" }, { status: 400 });
  }

  // Marquer comme utilisé
  await supabase.from("otp_codes").update({ utilise: true }).eq("id", otpRecord.id);

  return NextResponse.json({ success: true, message: "Code OTP vérifié" });
}
