"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Phone, User, MapPin, Globe, Mail, Lock, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import toast from "react-hot-toast";

const PAYS_AFRIQUE = [
  "Côte d'Ivoire", "Sénégal", "Mali", "Burkina Faso", "Ghana",
  "Nigeria", "Cameroun", "Guinée", "Togo", "Bénin",
  "Congo", "Gabon", "Maroc", "Tunisie", "Algérie", "Autre"
];

type Etape = "formulaire" | "otp" | "succes";

export default function InscriptionPage() {
  const [etape, setEtape] = useState<Etape>("formulaire");
  const [loading, setLoading] = useState(false);
  const [showMdp, setShowMdp] = useState(false);
  const [otp, setOtp] = useState("");

  const [form, setForm] = useState({
    nom_complet: "",
    telephone: "",
    email: "",
    ville: "",
    pays: "Côte d'Ivoire",
    mot_de_passe: "",
  });

  const supabase = createClient();

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const envoyerOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom_complet || !form.telephone || !form.ville || !form.mot_de_passe) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    if (form.mot_de_passe.length < 6) {
      toast.error("Le mot de passe doit faire au moins 6 caractères");
      return;
    }

    setLoading(true);

    // Vérifier si le téléphone est déjà utilisé
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("telephone", form.telephone.replace(/[\s\-]/g, ""))
      .single();

    if (existing) {
      toast.error("Ce numéro de téléphone est déjà utilisé");
      setLoading(false);
      return;
    }

    // Envoyer OTP via API
    const res = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telephone: form.telephone }),
    });

    if (!res.ok) {
      toast.error("Impossible d'envoyer le code OTP");
      setLoading(false);
      return;
    }

    toast.success("Code OTP envoyé !");
    setEtape("otp");
    setLoading(false);
  };

  const verifierOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Veuillez entrer le code à 6 chiffres");
      return;
    }
    setLoading(true);

    // Vérifier OTP
    const res = await fetch("/api/auth/otp-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telephone: form.telephone, code: otp }),
    });

    if (!res.ok) {
      toast.error("Code OTP invalide ou expiré");
      setLoading(false);
      return;
    }

    // Créer le compte Supabase Auth
    const email = form.email || `${form.telephone.replace(/[\s\-\+]/g, "")}@jubrika.app`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: form.mot_de_passe,
    });

    if (authError || !authData.user) {
      toast.error("Erreur lors de la création du compte: " + (authError?.message ?? ""));
      setLoading(false);
      return;
    }

    // Créer le profil
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      nom_complet: form.nom_complet,
      telephone: form.telephone.replace(/[\s\-]/g, ""),
      email: form.email || null,
      ville: form.ville,
      pays: form.pays,
      role: "commercial",
      statut: "en_attente",
      otp_verifie: true,
    });

    if (profileError) {
      toast.error("Erreur lors de la création du profil");
      setLoading(false);
      return;
    }

    // Se déconnecter (le compte doit être approuvé par l'admin)
    await supabase.auth.signOut();

    // Notifier l'admin
    await fetch("/api/auth/notify-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: form.nom_complet,
        telephone: form.telephone,
        ville: form.ville,
      }),
    });

    setEtape("succes");
    setLoading(false);
  };

  if (etape === "succes") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-jubrika-or/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <div className="text-2xl font-black text-jubrika-or mb-2">JUBRIKA</div>
          <h2 className="text-xl font-bold text-white mb-4">Demande envoyée !</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Merci pour votre demande. Votre compte sera activé par l&apos;administrateur.
            Vous recevrez une notification dès que votre compte sera approuvé.
          </p>
          <Link href="/login">
            <Button variant="outline" fullWidth>Retour à la connexion</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (etape === "otp") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-jubrika-or/20 flex items-center justify-center mx-auto mb-4">
              <KeyRound size={28} className="text-jubrika-or" />
            </div>
            <h2 className="text-xl font-bold text-white">Vérification OTP</h2>
            <p className="text-sm text-gray-500 mt-2">
              Code envoyé au <span className="text-jubrika-or">{form.telephone}</span>
            </p>
          </div>

          <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-6 shadow-2xl">
            <form onSubmit={verifierOTP} className="space-y-4">
              <Input
                label="Code OTP (6 chiffres)"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em] font-mono"
                leftIcon={<KeyRound size={16} />}
              />

              <Button type="submit" variant="primary" fullWidth loading={loading} size="lg" className="mt-4">
                Vérifier le code
              </Button>

              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => { setEtape("formulaire"); setOtp(""); }}
              >
                ← Retour
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-jubrika-or/5 rounded-full blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center mb-8">
          <div className="text-3xl font-black tracking-widest text-jubrika-or mb-1">JUBRIKA</div>
          <div className="text-xs text-gray-600 tracking-widest uppercase">Créer un compte</div>
        </div>

        <div className="w-full max-w-sm">
          <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-6 shadow-2xl">
            <h1 className="text-xl font-bold text-white mb-6">Inscription</h1>

            <form onSubmit={envoyerOTP} className="space-y-4">
              <Input
                label="Nom complet *"
                type="text"
                value={form.nom_complet}
                onChange={e => updateField("nom_complet", e.target.value)}
                placeholder="Jean Kouassi"
                leftIcon={<User size={16} />}
              />

              <Input
                label="Numéro de téléphone *"
                type="tel"
                value={form.telephone}
                onChange={e => updateField("telephone", e.target.value)}
                placeholder="+225 00 00 00 00 00"
                leftIcon={<Phone size={16} />}
              />

              <Input
                label="Adresse email (optionnel)"
                type="email"
                value={form.email}
                onChange={e => updateField("email", e.target.value)}
                placeholder="jean@exemple.com"
                leftIcon={<Mail size={16} />}
              />

              <Input
                label="Ville *"
                type="text"
                value={form.ville}
                onChange={e => updateField("ville", e.target.value)}
                placeholder="Abidjan"
                leftIcon={<MapPin size={16} />}
              />

              <Select
                label="Pays *"
                value={form.pays}
                onChange={e => updateField("pays", e.target.value)}
              >
                {PAYS_AFRIQUE.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>

              <Input
                label="Mot de passe *"
                type={showMdp ? "text" : "password"}
                value={form.mot_de_passe}
                onChange={e => updateField("mot_de_passe", e.target.value)}
                placeholder="Min. 6 caractères"
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button type="button" onClick={() => setShowMdp(!showMdp)} className="text-gray-500 hover:text-white">
                    {showMdp ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <Button type="submit" variant="primary" fullWidth loading={loading} size="lg" className="mt-6">
                Recevoir le code OTP
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-jubrika-or hover:text-jubrika-or-clair font-medium transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
