import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Génère un code OTP à 6 chiffres
function genererOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const { telephone } = await req.json();

  if (!telephone) {
    return NextResponse.json({ error: "Numéro de téléphone requis" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const code = genererOTP();
  const expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Sauvegarder le code OTP
  const { error } = await supabase.from("otp_codes").insert({
    telephone: telephone.replace(/[\s\-]/g, ""),
    code,
    expire_at: expireAt.toISOString(),
    utilise: false,
  });

  if (error) {
    return NextResponse.json({ error: "Erreur lors de la génération du code" }, { status: 500 });
  }

  // Essayer d'envoyer par SMS via Twilio (optionnel)
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioToken && twilioPhone) {
    try {
      const message = `Votre code JUBRIKA : ${code}. Valable 10 minutes.`;
      const authHeader = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: twilioPhone,
          To: telephone,
          Body: message,
        }),
      });
    } catch {
      // Ignorer les erreurs Twilio en développement
      console.log(`[DEV] OTP pour ${telephone}: ${code}`);
    }
  } else {
    // Mode développement : afficher dans les logs
    console.log(`[DEV] OTP pour ${telephone}: ${code}`);
  }

  return NextResponse.json({ success: true, message: "Code OTP envoyé" });
}
