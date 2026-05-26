import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { nom, telephone, ville } = await req.json();
  const supabase = createAdminClient();

  // Trouver l'admin
  const { data: admin } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .single();

  if (admin) {
    await supabase.from("notifications").insert({
      user_id: admin.id,
      titre: "Nouveau compte en attente",
      message: `${nom} (${telephone}, ${ville}) a demandé un compte commercial. En attente d'approbation.`,
      type: "info",
    });
  }

  return NextResponse.json({ success: true });
}
