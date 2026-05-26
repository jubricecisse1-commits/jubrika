"use client";
import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, ShoppingBag, Users, Package, AlertTriangle, Award
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";
import StatCard from "@/components/ui/StatCard";
import { formatCFA, debutPeriode, medailleClassement } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type Periode = "jour" | "semaine" | "mois" | "annee" | "tout";

interface StatsGlobales {
  ca: number;
  nbVentes: number;
  panierMoyen: number;
}

interface RangCommercial {
  commercial_id: string;
  commercial_nom: string;
  commercial_ville: string;
  ca: number;
  nb_ventes: number;
}

const CA_HISTORIQUE = 7318202;

export default function AdminDashboardPage() {
  const [periode, setPeriode] = useState<Periode>("mois");
  const [stats, setStats] = useState<StatsGlobales>({ ca: 0, nbVentes: 0, panierMoyen: 0 });
  const [classement, setClassement] = useState<RangCommercial[]>([]);
  const [comptesEnAttente, setComptesEnAttente] = useState(0);
  const [alertesStock, setAlertesStock] = useState(0);
  const [totalCommercials, setTotalCommercials] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadStats = useCallback(async () => {
    setLoading(true);
    const debut = periode === "tout" ? null : debutPeriode(periode as "jour" | "semaine" | "mois" | "annee");

    let query = supabase
      .from("ventes")
      .select("montant_apres_remise, commercial_id")
      .eq("statut", "validee");

    if (debut) query = query.gte("date_vente", debut.toISOString());

    const { data: ventes } = await query;

    const ca = (ventes || []).reduce((sum, v) => sum + (v.montant_apres_remise ?? 0), 0);
    const nbVentes = ventes?.length ?? 0;
    const panierMoyen = nbVentes > 0 ? Math.round(ca / nbVentes) : 0;
    setStats({ ca, nbVentes, panierMoyen });

    // Classement des commerciaux
    const grouped: Record<string, { ca: number; nb: number }> = {};
    for (const v of ventes || []) {
      if (!grouped[v.commercial_id]) grouped[v.commercial_id] = { ca: 0, nb: 0 };
      grouped[v.commercial_id].ca += v.montant_apres_remise ?? 0;
      grouped[v.commercial_id].nb++;
    }

    // Récupérer les noms
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nom_complet, ville")
      .eq("role", "commercial")
      .eq("statut", "actif");

    const classementData: RangCommercial[] = (profiles || [])
      .map(p => ({
        commercial_id: p.id,
        commercial_nom: p.nom_complet,
        commercial_ville: p.ville,
        ca: grouped[p.id]?.ca ?? 0,
        nb_ventes: grouped[p.id]?.nb ?? 0,
      }))
      .sort((a, b) => b.ca - a.ca)
      .slice(0, 5);

    setClassement(classementData);

    // Stats globales
    const { count: enAttente } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("statut", "en_attente");
    setComptesEnAttente(enAttente ?? 0);

    const { count: actifs } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "commercial")
      .eq("statut", "actif");
    setTotalCommercials(actifs ?? 0);

    // Alertes stock bas
    const { count: alertes } = await supabase
      .from("stocks")
      .select("*", { count: "exact", head: true })
      .lte("quantite", 5);
    setAlertesStock(alertes ?? 0);

    setLoading(false);
  }, [periode, supabase]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const periodes: { key: Periode; label: string }[] = [
    { key: "jour", label: "Auj." },
    { key: "semaine", label: "Sem." },
    { key: "mois", label: "Mois" },
    { key: "annee", label: "Année" },
    { key: "tout", label: "Total" },
  ];

  const caAvecHistorique = stats.ca + (periode === "tout" ? CA_HISTORIQUE : 0);

  return (
    <div>
      <Header title="Tableau de bord" />

      <div className="px-4 md:px-6 py-6 space-y-6">
        {/* Sélecteur de période */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {periodes.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriode(p.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                periode === p.key
                  ? "bg-jubrika-or text-black font-bold"
                  : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            {/* Chiffres clés */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title="Chiffre d'affaires"
                value={formatCFA(caAvecHistorique)}
                icon={TrendingUp}
                highlight
                className="col-span-2"
              />
              <StatCard
                title="Ventes"
                value={stats.nbVentes.toLocaleString()}
                icon={ShoppingBag}
              />
              <StatCard
                title="Panier moyen"
                value={formatCFA(stats.panierMoyen)}
                icon={TrendingUp}
              />
              <StatCard
                title="Commerciaux"
                value={totalCommercials}
                icon={Users}
              />
              <StatCard
                title="En attente"
                value={comptesEnAttente}
                icon={Users}
                highlight={comptesEnAttente > 0}
              />
            </div>

            {/* Alertes */}
            {(comptesEnAttente > 0 || alertesStock > 0) && (
              <div className="space-y-2">
                {comptesEnAttente > 0 && (
                  <a href="/admin/comptes" className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3">
                    <Users size={18} className="text-orange-400" />
                    <p className="text-sm text-orange-300">
                      <span className="font-bold">{comptesEnAttente}</span> compte(s) en attente d&apos;approbation
                    </p>
                  </a>
                )}
                {alertesStock > 0 && (
                  <a href="/admin/stocks" className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertTriangle size={18} className="text-red-400" />
                    <p className="text-sm text-red-300">
                      <span className="font-bold">{alertesStock}</span> stock(s) en alerte basse
                    </p>
                  </a>
                )}
              </div>
            )}

            {/* Top 5 Commerciaux */}
            {classement.length > 0 && (
              <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                  <Award size={18} className="text-jubrika-or" />
                  <h2 className="font-bold text-white text-sm">Top Commerciaux — {periodes.find(p => p.key === periode)?.label}</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {classement.map((c, i) => (
                    <div key={c.commercial_id} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-lg w-8 text-center flex-shrink-0">{medailleClassement(i + 1)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{c.commercial_nom}</p>
                        <p className="text-xs text-gray-500">{c.commercial_ville} · {c.nb_ventes} ventes</p>
                      </div>
                      <p className="text-sm font-bold text-jubrika-or flex-shrink-0">{formatCFA(c.ca)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raccourcis rapides */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/admin/stocks", label: "Gérer les stocks", icon: Package },
                { href: "/admin/promos", label: "Codes promo", icon: Award },
                { href: "/admin/ventes", label: "Toutes les ventes", icon: ShoppingBag },
                { href: "/admin/comptes", label: "Gérer les comptes", icon: Users },
              ].map(({ href, label, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  className="bg-[#111111] border border-white/10 rounded-xl p-4 flex items-center gap-3 hover:border-jubrika-or/40 transition-all"
                >
                  <Icon size={20} className="text-jubrika-or" />
                  <span className="text-sm text-gray-300">{label}</span>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
