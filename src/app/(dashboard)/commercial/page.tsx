"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, QrCode, Tag, CreditCard, Phone, MapPin,
  ChevronDown, CheckCircle, FileText
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { Produit, Stock, PanierItem, ModePaiement } from "@/lib/types";
import { formatCFA, calculerPrixApresRemise, labelPaiement } from "@/lib/utils";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const MODES_PAIEMENT: ModePaiement[] = ["especes", "orange_money", "mtn_momo", "wave", "autre"];

export default function NouvelleVentePage() {
  const { profile } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [panier, setPanier] = useState<PanierItem[]>([]);
  const [clientTel, setClientTel] = useState("");
  const [clientVille, setClientVille] = useState("");
  const [codePromo, setCodePromo] = useState("");
  const [promoValide, setPromoValide] = useState<{ id: string; reduction: number; code: string } | null>(null);
  const [modePaiement, setModePaiement] = useState<ModePaiement>("especes");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingVente, setLoadingVente] = useState(false);
  const [loadingPromo, setLoadingPromo] = useState(false);
  const [modalCatalogue, setModalCatalogue] = useState(false);
  const [searchProduit, setSearchProduit] = useState("");
  const [recu, setRecu] = useState<null | { id: string; montant: number }>(null);
  const [clientsSuggestions, setClientsSuggestions] = useState<string[]>([]);
  const supabase = createClient();

  const loadStocks = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("vue_stocks")
      .select("*")
      .eq("commercial_id", profile.id)
      .gt("quantite", 0)
      .order("produit_nom");
    setStocks((data as Stock[]) || []);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => { loadStocks(); }, [loadStocks]);

  // Autocomplétion client
  useEffect(() => {
    if (!clientTel || clientTel.length < 4) { setClientsSuggestions([]); return; }
    supabase.from("clients").select("telephone")
      .ilike("telephone", `%${clientTel}%`).limit(5)
      .then(({ data }) => setClientsSuggestions((data || []).map((c: { telephone: string }) => c.telephone)));
  }, [clientTel, supabase]);

  const ajouterAuPanier = (stock: Stock) => {
    const existant = panier.find(p => p.produit.id === stock.produit_id);
    if (existant) {
      if (existant.quantite >= stock.quantite) {
        toast.error("Stock insuffisant");
        return;
      }
      setPanier(prev => prev.map(p =>
        p.produit.id === stock.produit_id
          ? { ...p, quantite: p.quantite + 1, prix_total: (p.quantite + 1) * p.prix_unitaire }
          : p
      ));
    } else {
      const produit: Produit = {
        id: stock.produit_id,
        nom: stock.produit_nom ?? "",
        reference: stock.produit_reference ?? "",
        categorie: stock.produit_categorie as Produit["categorie"],
        prix_base: stock.prix_base ?? 0,
        actif: true,
        created_at: "",
        updated_at: "",
      };
      setPanier(prev => [...prev, {
        produit,
        quantite: 1,
        prix_unitaire: stock.prix_base ?? 0,
        prix_total: stock.prix_base ?? 0,
      }]);
    }
    setModalCatalogue(false);
  };

  const retirerDuPanier = (produitId: string) => {
    setPanier(prev => prev.filter(p => p.produit.id !== produitId));
  };

  const modifierQuantite = (produitId: string, delta: number) => {
    setPanier(prev => prev.map(p => {
      if (p.produit.id !== produitId) return p;
      const stock = stocks.find(s => s.produit_id === produitId);
      const nouvelleQte = p.quantite + delta;
      if (nouvelleQte < 1) return p;
      if (stock && nouvelleQte > stock.quantite) {
        toast.error("Stock insuffisant");
        return p;
      }
      return { ...p, quantite: nouvelleQte, prix_total: nouvelleQte * p.prix_unitaire };
    }));
  };

  const validerPromo = async () => {
    if (!codePromo) return;
    setLoadingPromo(true);
    const res = await fetch("/api/promos/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: codePromo }),
    });
    const data = await res.json();
    if (!res.ok || !data.valide) {
      toast.error(data.message || "Code promo invalide");
      setPromoValide(null);
    } else {
      setPromoValide({ id: data.id, reduction: data.reduction_pourcent, code: codePromo });
      toast.success(`Code -${data.reduction_pourcent}% appliqué !`);
    }
    setLoadingPromo(false);
  };

  const totalBrut = panier.reduce((sum, p) => sum + p.prix_total, 0);
  const reduction = promoValide ? promoValide.reduction : 0;
  const totalFinal = calculerPrixApresRemise(totalBrut, reduction);

  const validerVente = async () => {
    if (panier.length === 0) { toast.error("Le panier est vide"); return; }
    if (!clientTel) { toast.error("Le numéro de téléphone client est requis"); return; }
    if (!modePaiement) { toast.error("Sélectionnez un mode de paiement"); return; }

    setLoadingVente(true);

    // 1. Créer la vente
    const { data: vente, error: venteError } = await supabase.from("ventes").insert({
      commercial_id: profile!.id,
      client_telephone: clientTel.replace(/[\s\-]/g, ""),
      client_ville: clientVille || null,
      montant_total: totalBrut,
      montant_apres_remise: totalFinal,
      code_promo_id: promoValide?.id || null,
      reduction_appliquee: reduction,
      mode_paiement: modePaiement,
      notes: notes || null,
      statut: "validee",
    }).select().single();

    if (venteError || !vente) {
      toast.error("Erreur lors de la vente : " + venteError?.message);
      setLoadingVente(false);
      return;
    }

    // 2. Insérer les lignes de vente
    const lignes = panier.map(p => ({
      vente_id: vente.id,
      produit_id: p.produit.id,
      quantite: p.quantite,
      prix_unitaire: p.prix_unitaire,
      prix_total: p.prix_total,
    }));

    const { error: lignesError } = await supabase.from("vente_produits").insert(lignes);
    if (lignesError) {
      toast.error("Erreur lignes vente: " + lignesError.message);
      setLoadingVente(false);
      return;
    }

    // 3. Upsert client
    await supabase.from("clients").upsert({
      telephone: clientTel.replace(/[\s\-]/g, ""),
      ville: clientVille || null,
    }, { onConflict: "telephone" });

    toast.success("Vente enregistrée avec succès !");
    setRecu({ id: vente.id, montant: totalFinal });

    // Réinitialiser
    setPanier([]);
    setClientTel("");
    setClientVille("");
    setCodePromo("");
    setPromoValide(null);
    setNotes("");
    setModePaiement("especes");
    loadStocks();
    setLoadingVente(false);
  };

  const filteredStocks = stocks.filter(s =>
    !searchProduit ||
    s.produit_nom?.toLowerCase().includes(searchProduit.toLowerCase()) ||
    s.produit_reference?.toLowerCase().includes(searchProduit.toLowerCase())
  );

  if (recu) {
    return (
      <div>
        <Header title="Vente enregistrée" />
        <div className="px-4 py-12 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
            <CheckCircle size={48} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Vente validée !</h2>
          <p className="text-jubrika-or text-3xl font-black mb-6">{formatCFA(recu.montant)}</p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => setRecu(null)}>
              <Plus size={16} /> Nouvelle vente
            </Button>
            <Button variant="secondary" onClick={() => window.location.href = "/commercial/historique"}>
              <FileText size={16} /> Historique
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Nouvelle vente" />
      <div className="px-4 md:px-6 py-6 space-y-5">

        {/* Client */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Phone size={16} className="text-jubrika-or" /> Informations client
          </h2>
          <div className="relative">
            <Input
              label="Numéro de téléphone *"
              type="tel"
              value={clientTel}
              onChange={e => { setClientTel(e.target.value); }}
              placeholder="+225 00 00 00 00"
            />
            {clientsSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 bg-[#1a1a1a] border border-white/10 rounded-xl mt-1 overflow-hidden">
                {clientsSuggestions.map(tel => (
                  <button
                    key={tel}
                    onClick={() => { setClientTel(tel); setClientsSuggestions([]); }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <Phone size={14} className="text-gray-500" /> {tel}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Input
            label="Ville du client"
            value={clientVille}
            onChange={e => setClientVille(e.target.value)}
            placeholder="Abidjan"
            leftIcon={<MapPin size={16} />}
          />
        </div>

        {/* Produits */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Tag size={16} className="text-jubrika-or" /> Produits
            </h2>
            <Button variant="primary" size="sm" onClick={() => setModalCatalogue(true)}>
              <Plus size={14} /> Ajouter
            </Button>
          </div>

          {panier.length === 0 ? (
            <div className="text-center py-6 text-gray-600 text-sm">
              Aucun produit dans le panier
            </div>
          ) : (
            <div className="space-y-2">
              {panier.map(item => (
                <div key={item.produit.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.produit.nom}</p>
                    <p className="text-xs text-gray-500">{formatCFA(item.prix_unitaire)} / unité</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => modifierQuantite(item.produit.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center"
                    >−</button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantite}</span>
                    <button
                      onClick={() => modifierQuantite(item.produit.id, 1)}
                      className="w-7 h-7 rounded-lg bg-jubrika-or text-black hover:bg-jubrika-or-clair flex items-center justify-center"
                    >+</button>
                  </div>
                  <p className="text-sm font-bold text-jubrika-or w-24 text-right flex-shrink-0">
                    {formatCFA(item.prix_total)}
                  </p>
                  <button onClick={() => retirerDuPanier(item.produit.id)} className="text-gray-600 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Code promo */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Tag size={16} className="text-jubrika-or" /> Code promo (optionnel)
          </h2>
          <div className="flex gap-2">
            <Input
              value={codePromo}
              onChange={e => { setCodePromo(e.target.value.toUpperCase()); setPromoValide(null); }}
              placeholder="JUBRIKA10"
              className="font-mono uppercase"
              disabled={!!promoValide}
            />
            {promoValide ? (
              <Button variant="secondary" size="sm" onClick={() => { setPromoValide(null); setCodePromo(""); }}>
                ✕
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={validerPromo} loading={loadingPromo} disabled={!codePromo}>
                Valider
              </Button>
            )}
          </div>
          {promoValide && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="vert">✓ -{promoValide.reduction}% appliqué</Badge>
            </div>
          )}
        </div>

        {/* Paiement */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-jubrika-or" /> Mode de paiement
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {MODES_PAIEMENT.map(mode => (
              <button
                key={mode}
                onClick={() => setModePaiement(mode)}
                className={`py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                  modePaiement === mode
                    ? "bg-jubrika-or text-black font-bold"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                {labelPaiement(mode)}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Notes (optionnel)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-jubrika-or resize-none"
            rows={2}
            placeholder="Notes sur la vente..."
          />
        </div>

        {/* Récapitulatif + bouton valider */}
        {panier.length > 0 && (
          <div className="bg-gradient-to-br from-jubrika-or/20 to-jubrika-or-sombre/10 border border-jubrika-or/30 rounded-2xl p-5">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Sous-total</span>
                <span className="text-white">{formatCFA(totalBrut)}</span>
              </div>
              {reduction > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">Réduction ({reduction}%)</span>
                  <span className="text-green-400">-{formatCFA(totalBrut - totalFinal)}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-2 flex justify-between">
                <span className="font-bold text-white">Total à payer</span>
                <span className="text-2xl font-black text-jubrika-or">{formatCFA(totalFinal)}</span>
              </div>
            </div>
            <Button variant="primary" fullWidth size="lg" onClick={validerVente} loading={loadingVente}>
              <CheckCircle size={18} /> Valider la vente
            </Button>
          </div>
        )}
      </div>

      {/* Modal catalogue */}
      <Modal isOpen={modalCatalogue} onClose={() => setModalCatalogue(false)} title="Catalogue produits" size="lg">
        <div className="space-y-3">
          <Input
            placeholder="Rechercher..."
            value={searchProduit}
            onChange={e => setSearchProduit(e.target.value)}
          />
          {loading ? <LoadingSpinner /> : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredStocks.length === 0 ? (
                <p className="text-center text-gray-600 py-6">Aucun produit en stock</p>
              ) : filteredStocks.map(stock => (
                <button
                  key={stock.id}
                  onClick={() => ajouterAuPanier(stock)}
                  className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-all text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{stock.produit_nom}</p>
                    <p className="text-xs text-gray-500">{stock.produit_reference} · Stock: {stock.quantite}</p>
                  </div>
                  <p className="text-sm font-bold text-jubrika-or flex-shrink-0">{formatCFA(stock.prix_base ?? 0)}</p>
                  <Plus size={18} className="text-jubrika-or flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
