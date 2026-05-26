"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Tag, Trash2, ToggleLeft, ToggleRight, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { CodePromo } from "@/lib/types";
import { genererCodePromo, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<CodePromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNew, setModalNew] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    code: genererCodePromo(),
    reduction_pourcent: "",
    date_expiration: "",
    nb_utilisations_max: "",
  });

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("codes_promo")
      .select("*")
      .order("created_at", { ascending: false });
    setPromos((data as CodePromo[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const creerPromo = async () => {
    if (!form.code || !form.reduction_pourcent) {
      toast.error("Code et réduction sont obligatoires");
      return;
    }
    setLoadingAction(true);
    const { error } = await supabase.from("codes_promo").insert({
      code: form.code.toUpperCase(),
      reduction_pourcent: parseFloat(form.reduction_pourcent),
      date_expiration: form.date_expiration || null,
      nb_utilisations_max: form.nb_utilisations_max ? parseInt(form.nb_utilisations_max) : null,
      actif: true,
    });
    if (error) {
      toast.error(error.message.includes("unique") ? "Ce code existe déjà" : error.message);
    } else {
      toast.success("Code promo créé !");
      setModalNew(false);
      setForm({ code: genererCodePromo(), reduction_pourcent: "", date_expiration: "", nb_utilisations_max: "" });
      load();
    }
    setLoadingAction(false);
  };

  const toggleActif = async (promo: CodePromo) => {
    const { error } = await supabase.from("codes_promo").update({ actif: !promo.actif }).eq("id", promo.id);
    if (!error) {
      toast.success(promo.actif ? "Code désactivé" : "Code activé");
      load();
    }
  };

  const supprimerPromo = async (id: string) => {
    if (!confirm("Supprimer ce code promo ?")) return;
    const { error } = await supabase.from("codes_promo").delete().eq("id", id);
    if (!error) {
      toast.success("Code supprimé");
      load();
    }
  };

  const copierCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copié !");
  };

  const filteredPromos = promos.filter(p =>
    !search || p.code.toLowerCase().includes(search.toLowerCase())
  );

  const isExpire = (promo: CodePromo) =>
    promo.date_expiration ? new Date(promo.date_expiration) < new Date() : false;

  const isEpuise = (promo: CodePromo) =>
    promo.nb_utilisations_max ? promo.nb_utilisations_actuel >= promo.nb_utilisations_max : false;

  return (
    <div>
      <Header title="Codes promo" />
      <div className="px-4 md:px-6 py-6 space-y-6">

        <div className="flex items-center gap-3">
          <Input
            placeholder="Rechercher un code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="primary" onClick={() => setModalNew(true)} size="sm">
            <Plus size={16} /> Nouveau code
          </Button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="grid gap-3">
            {filteredPromos.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <Tag size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucun code promo</p>
              </div>
            ) : filteredPromos.map(promo => {
              const expire = isExpire(promo);
              const epuise = isEpuise(promo);
              const inactif = !promo.actif || expire || epuise;

              return (
                <div key={promo.id} className={`bg-[#111111] border rounded-xl p-4 ${inactif ? "border-white/5 opacity-60" : "border-white/10"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-black text-jubrika-or text-lg font-mono">{promo.code}</span>
                        <button onClick={() => copierCode(promo.code)} className="text-gray-600 hover:text-white">
                          <Copy size={14} />
                        </button>
                        {!promo.actif && <Badge variant="rouge">Désactivé</Badge>}
                        {expire && <Badge variant="rouge">Expiré</Badge>}
                        {epuise && <Badge variant="orange">Épuisé</Badge>}
                        {promo.actif && !expire && !epuise && <Badge variant="vert">Actif</Badge>}
                      </div>

                      <p className="text-sm text-white font-semibold">-{promo.reduction_pourcent}% de réduction</p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        <p className="text-xs text-gray-500">
                          Utilisations: <span className="text-white">{promo.nb_utilisations_actuel}</span>
                          {promo.nb_utilisations_max && <span className="text-gray-600">/{promo.nb_utilisations_max}</span>}
                        </p>
                        {promo.date_expiration && (
                          <p className="text-xs text-gray-500">
                            Expire: <span className={expire ? "text-red-400" : "text-white"}>
                              {formatDate(promo.date_expiration)}
                            </span>
                          </p>
                        )}
                        <p className="text-xs text-gray-600">Créé le {formatDate(promo.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleActif(promo)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title={promo.actif ? "Désactiver" : "Activer"}
                      >
                        {promo.actif ? <ToggleRight size={20} className="text-jubrika-or" /> : <ToggleLeft size={20} />}
                      </button>
                      <button
                        onClick={() => supprimerPromo(promo.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Barre de progression utilisations */}
                  {promo.nb_utilisations_max && promo.nb_utilisations_max > 0 && (
                    <div className="mt-3">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-jubrika-or rounded-full transition-all"
                          style={{ width: `${Math.min(100, (promo.nb_utilisations_actuel / promo.nb_utilisations_max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal création */}
      <Modal isOpen={modalNew} onClose={() => setModalNew(false)} title="Nouveau code promo">
        <div className="space-y-4">
          <div className="flex gap-2 items-end">
            <Input
              label="Code promo *"
              value={form.code}
              onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="JUBRIKA10"
              className="font-mono uppercase"
            />
            <Button
              variant="ghost"
              onClick={() => setForm(p => ({ ...p, code: genererCodePromo() }))}
              size="sm"
              className="flex-shrink-0 mb-0"
            >
              🔀
            </Button>
          </div>

          <Input
            label="Réduction (%) *"
            type="number"
            min="1"
            max="100"
            value={form.reduction_pourcent}
            onChange={e => setForm(p => ({ ...p, reduction_pourcent: e.target.value }))}
            placeholder="10"
          />

          <Input
            label="Date d'expiration (optionnel)"
            type="date"
            value={form.date_expiration}
            onChange={e => setForm(p => ({ ...p, date_expiration: e.target.value }))}
          />

          <Input
            label="Nb max d'utilisations (optionnel)"
            type="number"
            min="1"
            value={form.nb_utilisations_max}
            onChange={e => setForm(p => ({ ...p, nb_utilisations_max: e.target.value }))}
            placeholder="Ex: 100"
          />

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalNew(false)} fullWidth>Annuler</Button>
            <Button variant="primary" onClick={creerPromo} loading={loadingAction} fullWidth>Créer le code</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
