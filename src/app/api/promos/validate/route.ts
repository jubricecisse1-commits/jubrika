import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!code) {
    return NextResponse.json({ valide: false, message: "Code requis" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: promo } = await supabase
    .from("codes_promo")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("actif", true)
    .single();

  if (!promo) {
    return NextResponse.json({ valide: false, message: "Code promo invalide ou inactif" }, { status: 404 });
  }

  // Vérifier expiration
  if (promo.date_expiration && new Date(promo.date_expiration) < new Date()) {
    return NextResponse.json({ valide: false, message: "Ce code promo a expiré" }, { status: 400 });
  }

  // Vérifier limite utilisations
  if (promo.nb_utilisations_max && promo.nb_utilisations_actuel >= promo.nb_utilisations_max) {
    return NextResponse.json({ valide: false, message: "Ce code promo a atteint sa limite d'utilisations" }, { status: 400 });
  }

  return NextResponse.json({
    valide: true,
    id: promo.id,
    code: promo.code,
    reduction_pourcent: promo.reduction_pourcent,
    message: `Code valide : -${promo.reduction_pourcent}%`,
  });
}
