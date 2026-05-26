"use client";
import { useState, useEffect, useCallback } from "react";
import { Package, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { Stock, CategorieProduct } from "@/lib/types";
import { formatCFA, labelCategorie } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Image from "next/image";

const CATEGORIES: CategorieProduct[] = ["lunettes_photochromiques", "lunettes_style", "montres", "accessoires"];

export default function MonStockPage() {
  const { profile } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("");
  const supabase = createClient();

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("vue_stocks")
      .select("*")
      .eq("commercial_id", profile.id)
      .order("alerte_stock_bas", { ascending: false })
      .order("produit_nom");
    setStocks((data as Stock[]) || []);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => { load(); }, [load]);

  const filtered = stocks.filter(s => {
    const matchSearch = !search ||
      s.produit_nom?.toLowerCase().includes(search.toLowerCase()) ||
      s.produit_reference?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategorie || s.produit_categorie === filterCategorie;
    return matchSearch && matchCat;
  });

  const alertes = filtered.filter(s => s.alerte_stock_bas);
  const totalProduits = filtered.length;
  const valeurStock = filtered.reduce((sum, s) => sum + (s.prix_base ?? 0) * s.quantite, 0);

  return (
    <div>
      <Header title="Mon stock" />
      <div className="px-4 md:px-6 py-6 space-y-5">

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#111111] border border-white/10 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-white">{totalProduits}</p>
            <p className="text-xs text-gray-600">Produits</p>
          </div>
          <div className="bg-[#111111] border border-white/10 rounded-xl p-3 text-center">
            <p className={`text-lg font-black ${alertes.length > 0 ? "text-red-400" : "text-white"}`}>{alertes.length}</p>
            <p className="text-xs text-gray-600">Alertes</p>
          </div>
          <div className="bg-[#111111] border border-jubrika-or/20 rounded-xl p-3 text-center">
            <p className="text-sm font-black text-jubrika-or truncate">{formatCFA(valeurStock)}</p>
            <p className="text-xs text-gray-600">Valeur</p>
          </div>
        </div>

        {/* Alertes */}
        {alertes.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-400" />
            <p className="text-sm text-red-300">
              {alertes.length} produit(s) en stock bas — contactez l&apos;administrateur
            </p>
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-2">
          <Input
            placeholder="Rechercher produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)} className="max-w-[160px]">
            <option value="">Toutes catégories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{labelCategorie(c)}</option>)}
          </Select>
        </div>

        {/* Liste */}
        {loading ? <LoadingSpinner /> : (
          <div className="grid gap-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <Package size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucun produit en stock</p>
              </div>
            ) : filtered.map(s => (
              <div key={s.id} className={`bg-[#111111] border rounded-xl p-4 flex items-center gap-4 ${
                s.alerte_stock_bas ? "border-red-500/30" : "border-white/10"
              }`}>
                {s.photo_url ? (
                  <Image src={s.photo_url} alt={s.produit_nom ?? ""} width={56} height={56}
                    className="rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Package size={24} className="text-gray-700" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white text-sm truncate">{s.produit_nom}</p>
                    {s.alerte_stock_bas && <Badge variant="rouge">Stock bas</Badge>}
                  </div>
                  <p className="text-xs text-gray-500">Réf: {s.produit_reference}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{labelCategorie(s.produit_categorie as CategorieProduct)}</p>
                  <p className="text-xs text-jubrika-or mt-0.5">{formatCFA(s.prix_base ?? 0)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-3xl font-black ${s.alerte_stock_bas ? "text-red-400" : "text-jubrika-or"}`}>
                    {s.quantite}
                  </p>
                  <p className="text-xs text-gray-600">unités</p>
                  <p className="text-xs text-gray-600 mt-1">Seuil: {s.seuil_alerte}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
