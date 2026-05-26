"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Package, AlertTriangle, QrCode, Upload, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { Produit, Stock, Profile, CategorieProduct } from "@/lib/types";
import { formatCFA, labelCategorie, genererQRCode } from "@/lib/utils";
import toast from "react-hot-toast";
import Image from "next/image";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const CATEGORIES: CategorieProduct[] = ["lunettes_photochromiques", "lunettes_style", "montres", "accessoires"];

export default function AdminStocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [commercials, setCommercials] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCommercial, setFilterCommercial] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("");

  const [modalProduit, setModalProduit] = useState(false);
  const [modalDistrib, setModalDistrib] = useState(false);
  const [modalArrivage, setModalArrivage] = useState(false);

  const [formProduit, setFormProduit] = useState({
    nom: "", reference: "", categorie: "lunettes_photochromiques" as CategorieProduct,
    prix_base: "", description: "",
  });

  const [formArrivage, setFormArrivage] = useState({
    produit_id: "", quantite: "", notes: ""
  });

  const [formDistrib, setFormDistrib] = useState({
    produit_id: "", commercial_id: "", quantite: "", notes: ""
  });

  const [loadingAction, setLoadingAction] = useState(false);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: s }, { data: p }, { data: c }] = await Promise.all([
      supabase.from("vue_stocks").select("*").order("alerte_stock_bas", { ascending: false }),
      supabase.from("produits").select("*").eq("actif", true).order("nom"),
      supabase.from("profiles").select("*").eq("role", "commercial").eq("statut", "actif").order("nom_complet"),
    ]);
    setStocks((s as Stock[]) || []);
    setProduits((p as Produit[]) || []);
    setCommercials((c as Profile[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const creerProduit = async () => {
    if (!formProduit.nom || !formProduit.reference || !formProduit.prix_base) {
      toast.error("Remplissez tous les champs obligatoires");
      return;
    }
    setLoadingAction(true);

    const qrCode = await genererQRCode(formProduit.reference);

    const { error } = await supabase.from("produits").insert({
      nom: formProduit.nom,
      reference: formProduit.reference.toUpperCase(),
      categorie: formProduit.categorie,
      prix_base: parseInt(formProduit.prix_base),
      description: formProduit.description,
      qr_code: qrCode,
      actif: true,
    });

    if (error) {
      toast.error("Erreur: " + error.message);
    } else {
      toast.success("Produit créé avec succès !");
      setModalProduit(false);
      setFormProduit({ nom: "", reference: "", categorie: "lunettes_photochromiques", prix_base: "", description: "" });
      load();
    }
    setLoadingAction(false);
  };

  const enregistrerArrivage = async () => {
    if (!formArrivage.produit_id || !formArrivage.quantite) {
      toast.error("Sélectionnez un produit et une quantité");
      return;
    }
    setLoadingAction(true);
    const { error } = await supabase.from("arrivages").insert({
      produit_id: formArrivage.produit_id,
      quantite: parseInt(formArrivage.quantite),
      notes: formArrivage.notes,
    });
    if (error) {
      toast.error("Erreur: " + error.message);
    } else {
      toast.success("Arrivage enregistré !");
      setModalArrivage(false);
      setFormArrivage({ produit_id: "", quantite: "", notes: "" });
    }
    setLoadingAction(false);
  };

  const distribuer = async () => {
    if (!formDistrib.produit_id || !formDistrib.commercial_id || !formDistrib.quantite) {
      toast.error("Remplissez tous les champs");
      return;
    }
    setLoadingAction(true);
    const { error } = await supabase.from("distributions").insert({
      produit_id: formDistrib.produit_id,
      commercial_id: formDistrib.commercial_id,
      quantite: parseInt(formDistrib.quantite),
      notes: formDistrib.notes,
    });
    if (error) {
      toast.error("Erreur: " + error.message);
    } else {
      toast.success("Stock distribué avec succès !");
      setModalDistrib(false);
      setFormDistrib({ produit_id: "", commercial_id: "", quantite: "", notes: "" });
      load();
    }
    setLoadingAction(false);
  };

  const filteredStocks = stocks.filter(s => {
    const matchSearch = !searchTerm ||
      s.produit_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.commercial_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.produit_reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchComm = !filterCommercial || s.commercial_id === filterCommercial;
    const matchCat = !filterCategorie || s.produit_categorie === filterCategorie;
    return matchSearch && matchComm && matchCat;
  });

  return (
    <div>
      <Header title="Gestion des stocks" />
      <div className="px-4 md:px-6 py-6 space-y-6">

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => setModalProduit(true)} size="sm">
            <Plus size={16} /> Nouveau produit
          </Button>
          <Button variant="secondary" onClick={() => setModalArrivage(true)} size="sm">
            <Upload size={16} /> Enregistrer arrivage
          </Button>
          <Button variant="outline" onClick={() => setModalDistrib(true)} size="sm">
            <Package size={16} /> Distribuer
          </Button>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Rechercher produit, commercial..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Select value={filterCommercial} onChange={e => setFilterCommercial(e.target.value)}>
            <option value="">Tous les commerciaux</option>
            {commercials.map(c => <option key={c.id} value={c.id}>{c.nom_complet}</option>)}
          </Select>
          <Select value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)}>
            <option value="">Toutes catégories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{labelCategorie(c)}</option>)}
          </Select>
        </div>

        {/* Tableau de stocks */}
        {loading ? <LoadingSpinner /> : (
          <div className="grid gap-3">
            {filteredStocks.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <Package size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucun stock trouvé</p>
              </div>
            ) : filteredStocks.map(s => (
              <div key={s.id} className={`bg-[#111111] border rounded-xl p-4 flex items-center gap-4 ${
                s.alerte_stock_bas ? "border-red-500/30" : "border-white/10"
              }`}>
                {s.photo_url && (
                  <Image src={s.photo_url} alt={s.produit_nom ?? ""} width={48} height={48}
                    className="rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white text-sm truncate">{s.produit_nom}</p>
                    {s.alerte_stock_bas && <Badge variant="rouge">Stock bas</Badge>}
                    <Badge variant="gris">{labelCategorie(s.produit_categorie as CategorieProduct)}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {s.commercial_nom} · {s.commercial_ville} · Réf: {s.produit_reference}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{formatCFA(s.prix_base ?? 0)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-2xl font-black ${s.alerte_stock_bas ? "text-red-400" : "text-jubrika-or"}`}>
                    {s.quantite}
                  </p>
                  <p className="text-xs text-gray-600">unités</p>
                  {s.alerte_stock_bas && (
                    <AlertTriangle size={14} className="text-red-400 mt-1 ml-auto" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nouveau Produit */}
      <Modal isOpen={modalProduit} onClose={() => setModalProduit(false)} title="Nouveau produit" size="md">
        <div className="space-y-4">
          <Input label="Nom du produit *" value={formProduit.nom}
            onChange={e => setFormProduit(p => ({ ...p, nom: e.target.value }))} placeholder="Ex: Lunette Photochromique Pro" />
          <Input label="Référence *" value={formProduit.reference}
            onChange={e => setFormProduit(p => ({ ...p, reference: e.target.value }))} placeholder="Ex: JUB-001" />
          <Select label="Catégorie *" value={formProduit.categorie}
            onChange={e => setFormProduit(p => ({ ...p, categorie: e.target.value as CategorieProduct }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{labelCategorie(c)}</option>)}
          </Select>
          <Input label="Prix de base (FCFA) *" type="number" value={formProduit.prix_base}
            onChange={e => setFormProduit(p => ({ ...p, prix_base: e.target.value }))} placeholder="15000" />
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Description</label>
            <textarea
              value={formProduit.description}
              onChange={e => setFormProduit(p => ({ ...p, description: e.target.value }))}
              className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-jubrika-or resize-none"
              rows={3} placeholder="Description optionnelle..." />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalProduit(false)} fullWidth>Annuler</Button>
            <Button variant="primary" onClick={creerProduit} loading={loadingAction} fullWidth>
              <QrCode size={16} /> Créer + QR Code
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Arrivage */}
      <Modal isOpen={modalArrivage} onClose={() => setModalArrivage(false)} title="Enregistrer un arrivage">
        <div className="space-y-4">
          <Select label="Produit *" value={formArrivage.produit_id}
            onChange={e => setFormArrivage(p => ({ ...p, produit_id: e.target.value }))}>
            <option value="">Sélectionner un produit...</option>
            {produits.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.reference})</option>)}
          </Select>
          <Input label="Quantité reçue *" type="number" value={formArrivage.quantite}
            onChange={e => setFormArrivage(p => ({ ...p, quantite: e.target.value }))} placeholder="50" />
          <Input label="Notes" value={formArrivage.notes}
            onChange={e => setFormArrivage(p => ({ ...p, notes: e.target.value }))} placeholder="Ex: Livraison Dakar" />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalArrivage(false)} fullWidth>Annuler</Button>
            <Button variant="primary" onClick={enregistrerArrivage} loading={loadingAction} fullWidth>Enregistrer</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Distribution */}
      <Modal isOpen={modalDistrib} onClose={() => setModalDistrib(false)} title="Distribuer du stock">
        <div className="space-y-4">
          <Select label="Produit *" value={formDistrib.produit_id}
            onChange={e => setFormDistrib(p => ({ ...p, produit_id: e.target.value }))}>
            <option value="">Sélectionner un produit...</option>
            {produits.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.reference})</option>)}
          </Select>
          <Select label="Commercial *" value={formDistrib.commercial_id}
            onChange={e => setFormDistrib(p => ({ ...p, commercial_id: e.target.value }))}>
            <option value="">Sélectionner un commercial...</option>
            {commercials.map(c => <option key={c.id} value={c.id}>{c.nom_complet} — {c.ville}</option>)}
          </Select>
          <Input label="Quantité à distribuer *" type="number" value={formDistrib.quantite}
            onChange={e => setFormDistrib(p => ({ ...p, quantite: e.target.value }))} placeholder="10" />
          <Input label="Notes" value={formDistrib.notes}
            onChange={e => setFormDistrib(p => ({ ...p, notes: e.target.value }))} placeholder="Notes de distribution..." />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalDistrib(false)} fullWidth>Annuler</Button>
            <Button variant="primary" onClick={distribuer} loading={loadingAction} fullWidth>Distribuer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
