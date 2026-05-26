"use client";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeftRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { TransfertCommande, StatutTransfert } from "@/lib/types";
import { formatDateHeure } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const STATUTS: StatutTransfert[] = ["en_attente", "transferee", "en_livraison", "livree", "annulee"];
const STATUT_LABELS: Record<StatutTransfert, string> = {
  en_attente: "En attente",
  transferee: "Transférée",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
};
const STATUT_VARIANTS: Record<StatutTransfert, "orange" | "bleu" | "or" | "vert" | "rouge"> = {
  en_attente: "orange",
  transferee: "bleu",
  en_livraison: "or",
  livree: "vert",
  annulee: "rouge",
};

export default function AdminTransfertsPage() {
  const [transferts, setTransferts] = useState<TransfertCommande[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<StatutTransfert | "">("");
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("transferts_commandes")
      .select(`
        *,
        expediteur:profiles!commercial_expediteur_id(nom_complet, ville),
        destinataire:profiles!commercial_destinataire_id(nom_complet, ville),
        produit:produits(nom, reference)
      `)
      .order("created_at", { ascending: false });

    if (filterStatut) query = query.eq("statut", filterStatut);

    const { data } = await query;
    setTransferts((data as TransfertCommande[]) || []);
    setLoading(false);
  }, [supabase, filterStatut]);

  useEffect(() => { load(); }, [load]);

  const filtered = transferts.filter(t =>
    !search ||
    t.client_telephone.includes(search) ||
    t.client_ville.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header title="Transferts de commandes" />
      <div className="px-4 md:px-6 py-6 space-y-5">

        <div className="flex gap-3 flex-wrap">
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={filterStatut} onChange={e => setFilterStatut(e.target.value as StatutTransfert | "")} className="max-w-[200px]">
            <option value="">Tous les statuts</option>
            {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
          </Select>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="grid gap-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <ArrowLeftRight size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucun transfert</p>
              </div>
            ) : filtered.map(t => (
              <div key={t.id} className="bg-[#111111] border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={STATUT_VARIANTS[t.statut]}>{STATUT_LABELS[t.statut]}</Badge>
                      <span className="text-xs text-gray-600">{formatDateHeure(t.created_at)}</span>
                    </div>

                    {/* Trajet */}
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1">
                        <p className="text-xs text-blue-400 font-medium">{(t.expediteur as { nom_complet: string })?.nom_complet ?? "—"}</p>
                        <p className="text-[10px] text-gray-600">{(t.expediteur as { ville: string })?.ville ?? ""}</p>
                      </div>
                      <ArrowLeftRight size={14} className="text-gray-600 flex-shrink-0" />
                      <div className="bg-jubrika-or/10 border border-jubrika-or/20 rounded-lg px-2 py-1">
                        <p className="text-xs text-jubrika-or font-medium">{(t.destinataire as { nom_complet: string })?.nom_complet ?? "—"}</p>
                        <p className="text-[10px] text-gray-600">{(t.destinataire as { ville: string })?.ville ?? ""}</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      Client: {t.client_telephone} — {t.client_ville}
                    </p>
                    {t.produit && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        {(t.produit as { nom: string }).nom} × {t.quantite}
                      </p>
                    )}
                    {t.notes && <p className="text-xs text-gray-600 mt-1 italic">{t.notes}</p>}
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
