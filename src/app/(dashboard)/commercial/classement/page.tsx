"use client";
import { useState, useEffect, useCallback } from "react";
import { Trophy, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { formatCFA, debutPeriode, medailleClassement } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";

type Periode = "jour" | "semaine" | "mois";

interface RangCommercial {
  commercial_id: string;
  commercial_nom: string;
  commercial_ville: string;
  ca: number;
  nb_ventes: number;
}

export default function ClassementPage() {
  const { profile } = useAuth();
  const [periode, setPeriode] = useState<Periode>("mois");
  const [classement, setClassement] = useState<RangCommercial[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const debut = debutPeriode(periode);

    const { data: ventes } = await supabase
      .from("ventes")
      .select("commercial_id, montant_apres_remise")
      .eq("statut", "validee")
      .gte("date_vente", debut.toISOString());

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nom_complet, ville")
      .eq("role", "commercial")
      .eq("statut", "actif");

    const grouped: Record<string, { ca: number; nb: number }> = {};
    for (const v of ventes || []) {
      if (!grouped[v.commercial_id]) grouped[v.commercial_id] = { ca: 0, nb: 0 };
      grouped[v.commercial_id].ca += v.montant_apres_remise ?? 0;
      grouped[v.commercial_id].nb++;
    }

    const ranking: RangCommercial[] = (profiles || [])
      .map(p => ({
        commercial_id: p.id,
        commercial_nom: p.nom_complet,
        commercial_ville: p.ville,
        ca: grouped[p.id]?.ca ?? 0,
        nb_ventes: grouped[p.id]?.nb ?? 0,
      }))
      .sort((a, b) => b.ca - a.ca);

    setClassement(ranking);
    setLoading(false);
  }, [periode, supabase]);

  useEffect(() => { load(); }, [load]);

  const maPosition = classement.findIndex(c => c.commercial_id === profile?.id) + 1;
  const top3 = classement.slice(0, 3);
  const reste = classement.slice(3);

  const periodes: { key: Periode; label: string }[] = [
    { key: "jour", label: "Aujourd'hui" },
    { key: "semaine", label: "Cette semaine" },
    { key: "mois", label: "Ce mois" },
  ];

  return (
    <div>
      <Header title="Classement" />
      <div className="px-4 md:px-6 py-6 space-y-6">

        {/* Sélecteur période */}
        <div className="flex gap-2">
          {periodes.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriode(p.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                periode === p.key
                  ? "bg-jubrika-or text-black font-bold"
                  : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Ma position */}
        {maPosition > 0 && (
          <div className="bg-gradient-to-r from-jubrika-or/20 to-jubrika-or-sombre/10 border border-jubrika-or/30 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-jubrika-or" />
              <div>
                <p className="text-sm text-gray-400">Votre position</p>
                <p className="text-lg font-black text-jubrika-or">#{maPosition}</p>
              </div>
            </div>
            {classement[maPosition - 1] && (
              <div className="text-right">
                <p className="text-sm font-bold text-white">{formatCFA(classement[maPosition - 1].ca)}</p>
                <p className="text-xs text-gray-500">{classement[maPosition - 1].nb_ventes} ventes</p>
              </div>
            )}
          </div>
        )}

        {loading ? <LoadingSpinner /> : (
          <>
            {/* Podium Top 3 */}
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-3 py-4">
                {/* 2e place */}
                {top3[1] && (
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="text-3xl">🥈</div>
                    <div className={cn(
                      "w-full rounded-t-xl bg-gray-800 border border-white/10 flex flex-col items-center p-3",
                      "h-24",
                      top3[1].commercial_id === profile?.id && "border-jubrika-or/40 bg-jubrika-or/10"
                    )}>
                      <p className="text-xs font-bold text-white text-center truncate w-full">{top3[1].commercial_nom.split(" ")[0]}</p>
                      <p className="text-xs text-jubrika-or font-bold mt-1">{formatCFA(top3[1].ca)}</p>
                      <p className="text-[10px] text-gray-600">{top3[1].nb_ventes} ventes</p>
                    </div>
                  </div>
                )}

                {/* 1re place */}
                {top3[0] && (
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="text-4xl animate-bounce">🥇</div>
                    <div className={cn(
                      "w-full rounded-t-xl bg-jubrika-or/20 border border-jubrika-or/40 flex flex-col items-center p-3",
                      "h-32",
                      top3[0].commercial_id === profile?.id && "ring-2 ring-jubrika-or"
                    )}>
                      <p className="text-xs font-bold text-jubrika-or text-center truncate w-full">{top3[0].commercial_nom.split(" ")[0]}</p>
                      <p className="text-sm text-jubrika-or font-black mt-1">{formatCFA(top3[0].ca)}</p>
                      <p className="text-[10px] text-gray-400">{top3[0].nb_ventes} ventes</p>
                    </div>
                  </div>
                )}

                {/* 3e place */}
                {top3[2] && (
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="text-3xl">🥉</div>
                    <div className={cn(
                      "w-full rounded-t-xl bg-orange-900/20 border border-orange-700/20 flex flex-col items-center p-3",
                      "h-20",
                      top3[2].commercial_id === profile?.id && "border-jubrika-or/40 bg-jubrika-or/10"
                    )}>
                      <p className="text-xs font-bold text-white text-center truncate w-full">{top3[2].commercial_nom.split(" ")[0]}</p>
                      <p className="text-xs text-jubrika-or font-bold mt-1">{formatCFA(top3[2].ca)}</p>
                      <p className="text-[10px] text-gray-600">{top3[2].nb_ventes} ventes</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Liste complète */}
            {classement.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Trophy size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucune vente pour cette période</p>
              </div>
            ) : (
              <div className="space-y-2">
                {classement.map((c, i) => {
                  const estMoi = c.commercial_id === profile?.id;
                  return (
                    <div key={c.commercial_id} className={cn(
                      "flex items-center gap-4 rounded-xl px-4 py-3 border transition-all",
                      estMoi
                        ? "bg-jubrika-or/10 border-jubrika-or/30"
                        : "bg-[#111111] border-white/10"
                    )}>
                      <span className="text-lg w-8 text-center flex-shrink-0">{medailleClassement(i + 1)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-semibold truncate",
                          estMoi ? "text-jubrika-or" : "text-white"
                        )}>
                          {c.commercial_nom} {estMoi && "(Vous)"}
                        </p>
                        <p className="text-xs text-gray-500">{c.commercial_ville} · {c.nb_ventes} ventes</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={cn("text-sm font-bold", estMoi ? "text-jubrika-or" : "text-white")}>
                          {formatCFA(c.ca)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
