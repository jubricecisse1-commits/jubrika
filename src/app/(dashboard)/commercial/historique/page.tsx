"use client";
import { useState, useEffect, useCallback } from "react";
import { ShoppingBag, TrendingUp, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { Vente, ModePaiement } from "@/lib/types";
import { formatCFA, formatDateHeure, labelPaiement } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Button from "@/components/ui/Button";

const MODES_PAIEMENT: ModePaiement[] = ["especes", "orange_money", "mtn_momo", "wave", "autre"];

export default function HistoriquePage() {
  const { profile } = useAuth();
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPaiement, setFilterPaiement] = useState<ModePaiement | "">("");
  const [filterDateDebut, setFilterDateDebut] = useState("");
  const [filterDateFin, setFilterDateFin] = useState("");
  const supabase = createClient();

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    let query = supabase
      .from("vue_ventes")
      .select("*")
      .eq("commercial_id", profile.id)
      .order("date_vente", { ascending: false });

    if (filterPaiement) query = query.eq("mode_paiement", filterPaiement);
    if (filterDateDebut) query = query.gte("date_vente", filterDateDebut);
    if (filterDateFin) query = query.lte("date_vente", filterDateFin + "T23:59:59");

    const { data } = await query;
    setVentes((data as Vente[]) || []);
    setLoading(false);
  }, [profile, supabase, filterPaiement, filterDateDebut, filterDateFin]);

  useEffect(() => { load(); }, [load]);

  const filtered = ventes.filter(v =>
    !search ||
    v.client_telephone.includes(search) ||
    (v.client_ville || "").toLowerCase().includes(search.toLowerCase())
  );

  // Stats du jour
  const ventesAujourdhui = filtered.filter(v => v.date_vente.startsWith(today));
  const caAujourdhui = ventesAujourdhui.reduce((s, v) => s + v.montant_apres_remise, 0);
  const caTotal = filtered.reduce((s, v) => s + v.montant_apres_remise, 0);

  const exportCSV = () => {
    const headers = ["Date", "Client", "Ville", "Montant", "Réduction", "Final", "Paiement"];
    const rows = filtered.map(v => [
      formatDateHeure(v.date_vente), v.client_telephone, v.client_ville || "",
      v.montant_total, v.reduction_appliquee + "%", v.montant_apres_remise, labelPaiement(v.mode_paiement)
    ]);
    const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mes-ventes-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Header title="Mes ventes" />
      <div className="px-4 md:px-6 py-6 space-y-5">

        {/* Résumé du jour */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="CA aujourd'hui"
            value={formatCFA(caAujourdhui)}
            subtitle={`${ventesAujourdhui.length} vente(s)`}
            icon={TrendingUp}
            highlight
          />
          <StatCard
            title="Total filtré"
            value={formatCFA(caTotal)}
            subtitle={`${filtered.length} ventes`}
            icon={ShoppingBag}
          />
        </div>

        {/* Filtres */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Rechercher client, ville..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button variant="ghost" size="sm" onClick={exportCSV}>
              <Download size={16} />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={filterPaiement} onChange={e => setFilterPaiement(e.target.value as ModePaiement | "")}>
              <option value="">Tout paiement</option>
              {MODES_PAIEMENT.map(m => <option key={m} value={m}>{labelPaiement(m)}</option>)}
            </Select>
            <div className="flex gap-2">
              <Input type="date" value={filterDateDebut} onChange={e => setFilterDateDebut(e.target.value)} className="text-xs" />
              <Input type="date" value={filterDateFin} onChange={e => setFilterDateFin(e.target.value)} className="text-xs" />
            </div>
          </div>
        </div>

        {/* Liste */}
        {loading ? <LoadingSpinner /> : (
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucune vente</p>
              </div>
            ) : filtered.map(v => (
              <div key={v.id} className="bg-[#111111] border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{v.client_telephone}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDateHeure(v.date_vente)}
                      {v.client_ville && ` · ${v.client_ville}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="gris">{labelPaiement(v.mode_paiement)}</Badge>
                      {v.code_promo && <Badge variant="or">🎟 {v.code_promo}</Badge>}
                      {v.reduction_appliquee > 0 && <Badge variant="vert">-{v.reduction_appliquee}%</Badge>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {v.reduction_appliquee > 0 && (
                      <p className="text-xs text-gray-600 line-through">{formatCFA(v.montant_total)}</p>
                    )}
                    <p className="text-base font-bold text-jubrika-or">{formatCFA(v.montant_apres_remise)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
