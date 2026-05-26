"use client";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, UserCheck, UserX, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Profile, StatutCompte } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AdminComptesPage() {
  const [comptes, setComptes] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<StatutCompte | "">("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "commercial")
      .order("created_at", { ascending: false });
    setComptes((data as Profile[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const changerStatut = async (id: string, statut: StatutCompte, nom: string) => {
    setLoadingAction(id);
    const { error } = await supabase.from("profiles").update({ statut }).eq("id", id);
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      // Créer une notification pour l'utilisateur
      if (statut === "actif") {
        await supabase.from("notifications").insert({
          user_id: id,
          titre: "Compte activé !",
          message: `Bienvenue ${nom} ! Votre compte JUBRIKA est maintenant actif.`,
          type: "succes",
        });
        toast.success("Compte approuvé et notifié !");
      } else if (statut === "rejete") {
        await supabase.from("notifications").insert({
          user_id: id,
          titre: "Demande refusée",
          message: "Votre demande de compte JUBRIKA a été refusée. Contactez l'administrateur.",
          type: "erreur",
        });
        toast("Compte rejeté", { icon: "❌" });
      } else {
        toast(statut === "desactive" ? "Compte désactivé" : "Statut mis à jour");
      }
      load();
    }
    setLoadingAction(null);
  };

  const statutVariant = (statut: StatutCompte) => {
    const map: Record<StatutCompte, "or" | "vert" | "rouge" | "orange" | "gris"> = {
      en_attente: "orange",
      actif: "vert",
      desactive: "rouge",
      rejete: "rouge",
    };
    return map[statut];
  };

  const statutLabel = (statut: StatutCompte) => {
    const map: Record<StatutCompte, string> = {
      en_attente: "En attente",
      actif: "Actif",
      desactive: "Désactivé",
      rejete: "Rejeté",
    };
    return map[statut];
  };

  const filtered = comptes.filter(c => {
    const matchSearch = !search ||
      c.nom_complet.toLowerCase().includes(search.toLowerCase()) ||
      c.telephone.includes(search) ||
      c.ville.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || c.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const enAttente = comptes.filter(c => c.statut === "en_attente");

  return (
    <div>
      <Header title="Gestion des comptes" />
      <div className="px-4 md:px-6 py-6 space-y-6">

        {/* Badge en attente */}
        {enAttente.length > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <RefreshCw size={18} className="text-orange-400 animate-spin" />
            <p className="text-sm text-orange-300">
              <span className="font-bold">{enAttente.length}</span> compte(s) en attente d&apos;approbation
            </p>
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-3 flex-wrap">
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={filterStatut} onChange={e => setFilterStatut(e.target.value as StatutCompte | "")} className="max-w-[180px]">
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="actif">Actifs</option>
            <option value="desactive">Désactivés</option>
            <option value="rejete">Rejetés</option>
          </Select>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="grid gap-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-600">Aucun compte trouvé</div>
            ) : filtered.map(c => (
              <div key={c.id} className="bg-[#111111] border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-9 h-9 rounded-full bg-jubrika-or/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-jubrika-or font-bold text-sm">
                          {c.nom_complet[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{c.nom_complet}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={statutVariant(c.statut)}>{statutLabel(c.statut)}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 ml-11 mt-1">
                      <p className="text-xs text-gray-500">📞 {c.telephone}</p>
                      <p className="text-xs text-gray-500">📍 {c.ville}, {c.pays}</p>
                      {c.email && <p className="text-xs text-gray-500">✉️ {c.email}</p>}
                      <p className="text-xs text-gray-600">Inscrit le {formatDate(c.created_at)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {c.statut === "en_attente" && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          loading={loadingAction === c.id}
                          onClick={() => changerStatut(c.id, "actif", c.nom_complet)}
                        >
                          <CheckCircle size={14} /> Approuver
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={loadingAction === c.id}
                          onClick={() => changerStatut(c.id, "rejete", c.nom_complet)}
                        >
                          <XCircle size={14} /> Rejeter
                        </Button>
                      </>
                    )}
                    {c.statut === "actif" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={loadingAction === c.id}
                        onClick={() => changerStatut(c.id, "desactive", c.nom_complet)}
                      >
                        <UserX size={14} /> Désactiver
                      </Button>
                    )}
                    {(c.statut === "desactive" || c.statut === "rejete") && (
                      <Button
                        variant="outline"
                        size="sm"
                        loading={loadingAction === c.id}
                        onClick={() => changerStatut(c.id, "actif", c.nom_complet)}
                      >
                        <UserCheck size={14} /> Réactiver
                      </Button>
                    )}
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
