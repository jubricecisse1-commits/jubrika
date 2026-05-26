"use client";
import { useState, useEffect, useCallback } from "react";
import { User, Phone, MapPin, Globe, Lock, Eye, EyeOff, Camera, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import StatCard from "@/components/ui/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { formatCFA, debutPeriode } from "@/lib/utils";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ProfilPage() {
  const { profile, refreshProfile, signOut } = useAuth();
  const [stats, setStats] = useState({ ca: 0, nbVentes: 0, panierMoyen: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMdp, setLoadingMdp] = useState(false);
  const [showMdp, setShowMdp] = useState(false);
  const [formMdp, setFormMdp] = useState({ ancien: "", nouveau: "", confirmer: "" });
  const supabase = createClient();

  const loadStats = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const debut = debutPeriode("mois");

    const { data } = await supabase
      .from("ventes")
      .select("montant_apres_remise")
      .eq("commercial_id", profile.id)
      .eq("statut", "validee")
      .gte("date_vente", debut.toISOString());

    const ca = (data || []).reduce((s, v) => s + v.montant_apres_remise, 0);
    const nb = data?.length ?? 0;
    setStats({ ca, nbVentes: nb, panierMoyen: nb > 0 ? Math.round(ca / nb) : 0 });
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const changerMotDePasse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMdp.nouveau || !formMdp.ancien) { toast.error("Remplissez tous les champs"); return; }
    if (formMdp.nouveau !== formMdp.confirmer) { toast.error("Les mots de passe ne correspondent pas"); return; }
    if (formMdp.nouveau.length < 6) { toast.error("Le mot de passe doit faire au moins 6 caractères"); return; }

    setLoadingMdp(true);
    const { error } = await supabase.auth.updateUser({ password: formMdp.nouveau });
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success("Mot de passe modifié !");
      setFormMdp({ ancien: "", nouveau: "", confirmer: "" });
      setShowMdp(false);
    }
    setLoadingMdp(false);
  };

  if (!profile) return <LoadingSpinner fullPage />;

  return (
    <div>
      <Header title="Mon profil" />
      <div className="px-4 md:px-6 py-6 space-y-6">

        {/* Avatar et infos */}
        <div className="flex flex-col items-center text-center pb-4">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-jubrika-or/20 border-2 border-jubrika-or/40 flex items-center justify-center">
              <span className="text-4xl font-black text-jubrika-or">
                {profile.nom_complet[0].toUpperCase()}
              </span>
            </div>
          </div>
          <h2 className="text-xl font-black text-white">{profile.nom_complet}</h2>
          <p className="text-sm text-jubrika-or capitalize mt-1">{profile.role}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Phone size={12} /> {profile.telephone}</span>
            <span className="flex items-center gap-1"><MapPin size={12} /> {profile.ville}</span>
            <span className="flex items-center gap-1"><Globe size={12} /> {profile.pays}</span>
          </div>
        </div>

        {/* Stats ce mois */}
        {loading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-3 gap-3">
            <StatCard title="CA ce mois" value={formatCFA(stats.ca)} highlight />
            <StatCard title="Ventes" value={stats.nbVentes} />
            <StatCard title="Panier moyen" value={formatCFA(stats.panierMoyen)} />
          </div>
        )}

        {/* Changement mot de passe */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-4">
          <button
            onClick={() => setShowMdp(!showMdp)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-jubrika-or" />
              <span className="text-sm font-semibold text-white">Changer le mot de passe</span>
            </div>
            <span className="text-gray-600 text-xs">{showMdp ? "▲" : "▼"}</span>
          </button>

          {showMdp && (
            <form onSubmit={changerMotDePasse} className="mt-4 space-y-3">
              <Input
                label="Mot de passe actuel"
                type="password"
                value={formMdp.ancien}
                onChange={e => setFormMdp(p => ({ ...p, ancien: e.target.value }))}
                placeholder="••••••••"
              />
              <Input
                label="Nouveau mot de passe"
                type="password"
                value={formMdp.nouveau}
                onChange={e => setFormMdp(p => ({ ...p, nouveau: e.target.value }))}
                placeholder="Min. 6 caractères"
              />
              <Input
                label="Confirmer le nouveau"
                type="password"
                value={formMdp.confirmer}
                onChange={e => setFormMdp(p => ({ ...p, confirmer: e.target.value }))}
                placeholder="••••••••"
              />
              <Button type="submit" variant="primary" fullWidth loading={loadingMdp}>
                Mettre à jour
              </Button>
            </form>
          )}
        </div>

        {/* Déconnexion */}
        <Button variant="danger" fullWidth onClick={signOut}>
          <LogOut size={16} /> Se déconnecter
        </Button>

        {/* Infos compte */}
        <div className="text-center">
          <p className="text-xs text-gray-700">JUBRIKA · Luxe Valeur Impact</p>
          <p className="text-xs text-gray-800 mt-1">v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
