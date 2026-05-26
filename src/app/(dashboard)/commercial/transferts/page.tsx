"use client";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeftRight, Plus, Phone, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { TransfertCommande, Profile, Produit, StatutTransfert } from "@/lib/types";
import { formatDateHeure } from "@/lib/utils";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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

export default function TransfertsPage() {
  const { profile } = useAuth();
  const [transferts, setTransferts] = useState<TransfertCommande[]>([]);
  const [commercials, setCommercials] = useState<Profile[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNew, setModalNew] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [tab, setTab] = useState<"envoyes" | "recus">("recus");

  const [form, setForm] = useState({
    destinataire_id: "",
    client_telephone: "",
    client_ville: "",
    produit_id: "",
    quantite: "1",
    notes: "",
  });

  const supabase = createClient();

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    const { data } = await supabase
      .from("transferts_commandes")
      .select(`
        *,
        expediteur:profiles!commercial_expediteur_id(nom_complet, ville),
        destinataire:profiles!commercial_destinataire_id(nom_complet, ville),
        produit:produits(nom, reference)
      `)
      .or(`commercial_expediteur_id.eq.${profile.id},commercial_destinataire_id.eq.${profile.id}`)
      .order("created_at", { ascending: false });

    setTransferts((data as TransfertCommande[]) || []);

    const [{ data: comms }, { data: prods }] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "commercial").eq("statut", "actif")
        .neq("id", profile.id),
      supabase.from("produits").select("*").eq("actif", true).order("nom"),
    ]);
    setCommercials((comms as Profile[]) || []);
    setProduits((prods as Produit[]) || []);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => { load(); }, [load]);

  const creerTransfert = async () => {
    if (!form.destinataire_id || !form.client_telephone || !form.client_ville) {
      toast.error("Remplissez tous les champs obligatoires");
      return;
    }
    setLoadingAction(true);

    const { error } = await supabase.from("transferts_commandes").insert({
      commercial_expediteur_id: profile!.id,
      commercial_destinataire_id: form.destinataire_id,
      client_telephone: form.client_telephone,
      client_ville: form.client_ville,
      produit_id: form.produit_id || null,
      quantite: parseInt(form.quantite) || 1,
      notes: form.notes || null,
      statut: "en_attente",
    });

    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      // Notifier le destinataire
      await supabase.from("notifications").insert({
        user_id: form.destinataire_id,
        titre: "Nouvelle commande transférée",
        message: `${profile!.nom_complet} vous a transféré une commande pour le client ${form.client_telephone} à ${form.client_ville}.`,
        type: "info",
      });
      toast.success("Transfert créé et destinataire notifié !");
      setModalNew(false);
      setForm({ destinataire_id: "", client_telephone: "", client_ville: "", produit_id: "", quantite: "1", notes: "" });
      load();
    }
    setLoadingAction(false);
  };

  const mettreAJourStatut = async (id: string, statut: StatutTransfert) => {
    const { error } = await supabase.from("transferts_commandes").update({ statut }).eq("id", id);
    if (!error) {
      toast.success("Statut mis à jour");
      load();
    }
  };

  const envoyes = transferts.filter(t => t.commercial_expediteur_id === profile?.id);
  const recus = transferts.filter(t => t.commercial_destinataire_id === profile?.id);
  const displayed = tab === "envoyes" ? envoyes : recus;

  return (
    <div>
      <Header title="Transferts" />
      <div className="px-4 md:px-6 py-6 space-y-5">

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setTab("recus")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === "recus" ? "bg-jubrika-or text-black" : "bg-white/5 text-gray-400"
              }`}
            >
              Reçus {recus.length > 0 && <span className="ml-1 bg-black/30 rounded-full px-1.5 py-0.5 text-xs">{recus.filter(t => t.statut === "en_attente").length}</span>}
            </button>
            <button
              onClick={() => setTab("envoyes")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === "envoyes" ? "bg-jubrika-or text-black" : "bg-white/5 text-gray-400"
              }`}
            >
              Envoyés
            </button>
          </div>
          <Button variant="primary" size="sm" onClick={() => setModalNew(true)}>
            <Plus size={14} /> Créer
          </Button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="space-y-3">
            {displayed.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <ArrowLeftRight size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucun transfert</p>
              </div>
            ) : displayed.map(t => (
              <div key={t.id} className="bg-[#111111] border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={STATUT_VARIANTS[t.statut]}>{STATUT_LABELS[t.statut]}</Badge>
                      <span className="text-xs text-gray-600">{formatDateHeure(t.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs mb-2">
                      <span className="text-blue-400">
                        {tab === "recus" ? (t.expediteur as { nom_complet: string })?.nom_complet : "Vous"}
                      </span>
                      <ArrowLeftRight size={12} className="text-gray-600" />
                      <span className="text-jubrika-or">
                        {tab === "envoyes" ? (t.destinataire as { nom_complet: string })?.nom_complet : "Vous"}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Phone size={10} /> {t.client_telephone}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {t.client_ville}
                    </p>
                    {t.produit && (
                      <p className="text-xs text-gray-600 mt-1">
                        {(t.produit as { nom: string }).nom} × {t.quantite}
                      </p>
                    )}
                    {t.notes && <p className="text-xs text-gray-600 italic mt-1">{t.notes}</p>}
                  </div>
                </div>

                {/* Actions pour le destinataire */}
                {tab === "recus" && t.statut === "en_attente" && (
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" fullWidth
                      onClick={() => mettreAJourStatut(t.id, "en_livraison")}>
                      Accepter & livrer
                    </Button>
                    <Button variant="danger" size="sm"
                      onClick={() => mettreAJourStatut(t.id, "annulee")}>
                      Annuler
                    </Button>
                  </div>
                )}
                {tab === "recus" && t.statut === "en_livraison" && (
                  <Button variant="primary" size="sm" fullWidth
                    onClick={() => mettreAJourStatut(t.id, "livree")}>
                    Marquer comme livrée
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal nouveau transfert */}
      <Modal isOpen={modalNew} onClose={() => setModalNew(false)} title="Nouveau transfert" size="md">
        <div className="space-y-4">
          <Select
            label="Commercial destinataire *"
            value={form.destinataire_id}
            onChange={e => setForm(p => ({ ...p, destinataire_id: e.target.value }))}
          >
            <option value="">Sélectionner un commercial...</option>
            {commercials.map(c => <option key={c.id} value={c.id}>{c.nom_complet} — {c.ville}</option>)}
          </Select>

          <Input
            label="Téléphone client *"
            type="tel"
            value={form.client_telephone}
            onChange={e => setForm(p => ({ ...p, client_telephone: e.target.value }))}
            placeholder="+225 00 00 00 00"
            leftIcon={<Phone size={16} />}
          />

          <Input
            label="Ville du client *"
            value={form.client_ville}
            onChange={e => setForm(p => ({ ...p, client_ville: e.target.value }))}
            placeholder="Abidjan"
            leftIcon={<MapPin size={16} />}
          />

          <Select
            label="Produit (optionnel)"
            value={form.produit_id}
            onChange={e => setForm(p => ({ ...p, produit_id: e.target.value }))}
          >
            <option value="">Sélectionner un produit...</option>
            {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </Select>

          <Input
            label="Quantité"
            type="number"
            min="1"
            value={form.quantite}
            onChange={e => setForm(p => ({ ...p, quantite: e.target.value }))}
          />

          <Input
            label="Notes"
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="Instructions de livraison..."
          />

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalNew(false)} fullWidth>Annuler</Button>
            <Button variant="primary" onClick={creerTransfert} loading={loadingAction} fullWidth>Transférer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
