"use client";
import { useState, useEffect, useCallback } from "react";
import { Download, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Vente, Profile, ModePaiement } from "@/lib/types";
import { formatCFA, formatDateHeure, labelPaiement } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const MODES_PAIEMENT: ModePaiement[] = ["especes", "orange_money", "mtn_momo", "wave", "autre"];

export default function AdminVentesPage() {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [commercials, setCommercials] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCommercial, setFilterCommercial] = useState("");
  const [filterPaiement, setFilterPaiement] = useState<ModePaiement | "">("");
  const [filterDateDebut, setFilterDateDebut] = useState("");
  const [filterDateFin, setFilterDateFin] = useState("");
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("vue_ventes")
      .select("*")
      .order("date_vente", { ascending: false })
      .limit(500);

    if (filterCommercial) query = query.eq("commercial_id", filterCommercial);
    if (filterPaiement) query = query.eq("mode_paiement", filterPaiement);
    if (filterDateDebut) query = query.gte("date_vente", filterDateDebut);
    if (filterDateFin) query = query.lte("date_vente", filterDateFin + "T23:59:59");

    const { data } = await query;
    setVentes((data as Vente[]) || []);
    setLoading(false);
  }, [supabase, filterCommercial, filterPaiement, filterDateDebut, filterDateFin]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("role", "commercial").eq("statut", "actif").then(({ data }) => {
      setCommercials((data as Profile[]) || []);
    });
  }, [supabase]);

  const filtered = ventes.filter(v => {
    if (!search) return true;
    return (
      v.client_telephone.includes(search) ||
      (v.commercial_nom || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.client_ville || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalCA = filtered.reduce((sum, v) => sum + v.montant_apres_remise, 0);

  const exportCSV = () => {
    const headers = ["Date", "Commercial", "Ville Commercial", "Client", "Ville Client", "Montant", "Réduction", "Montant Final", "Paiement", "Code Promo"];
    const rows = filtered.map(v => [
      formatDateHeure(v.date_vente),
      v.commercial_nom || "",
      v.commercial_ville || "",
      v.client_telephone,
      v.client_ville || "",
      v.montant_total,
      v.reduction_appliquee + "%",
      v.montant_apres_remise,
      labelPaiement(v.mode_paiement),
      v.code_promo || "",
    ]);
    const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jubrika-ventes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Header title="Toutes les ventes" />
      <div className="px-4 md:px-6 py-6 space-y-5">

        {/* Total affiché */}
        <div className="bg-gradient-to-r from-jubrika-or/20 to-jubrika-or-sombre/10 border border-jubrika-or/30 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">CA filtré</p>
            <p className="text-2xl font-black text-jubrika-or">{formatCFA(totalCA)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{filtered.length} ventes</p>
            <Button variant="outline" size="sm" onClick={exportCSV} className="mt-2">
              <Download size={14} /> Export CSV
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="col-span-2 md:col-span-1"
          />
          <Select value={filterCommercial} onChange={e => setFilterCommercial(e.target.value)}>
            <option value="">Tous commerciaux</option>
            {commercials.map(c => <option key={c.id} value={c.id}>{c.nom_complet}</option>)}
          </Select>
          <Select value={filterPaiement} onChange={e => setFilterPaiement(e.target.value as ModePaiement | "")}>
            <option value="">Tout paiement</option>
            {MODES_PAIEMENT.map(m => <option key={m} value={m}>{labelPaiement(m)}</option>)}
          </Select>
          <div className="col-span-2 md:col-span-1 flex gap-2">
            <Input type="date" value={filterDateDebut} onChange={e => setFilterDateDebut(e.target.value)} className="text-xs" />
            <Input type="date" value={filterDateFin} onChange={e => setFilterDateFin(e.target.value)} className="text-xs" />
          </div>
        </div>

        {/* Liste ventes */}
        {loading ? <LoadingSpinner /> : (
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucune vente trouvée</p>
              </div>
            ) : filtered.map(v => (
              <div key={v.id} className="bg-[#111111] border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-white">{v.commercial_nom}</p>
                      <span className="text-gray-600">·</span>
                      <p className="text-sm text-gray-400">{v.client_telephone}</p>
                      {v.reduction_appliquee > 0 && (
                        <Badge variant="or">-{v.reduction_appliquee}%</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDateHeure(v.date_vente)} · {v.client_ville || "Ville inconnue"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="gris">{labelPaiement(v.mode_paiement)}</Badge>
                      {v.code_promo && <Badge variant="or">🎟 {v.code_promo}</Badge>}
                      <Badge variant={v.statut === "validee" ? "vert" : "rouge"}>
                        {v.statut === "validee" ? "Validée" : "Annulée"}
                      </Badge>
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
