"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [showMdp, setShowMdp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifiant || !motDePasse) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);

    // Déterminer si c'est un email ou un téléphone
    const isEmail = identifiant.includes("@");
    let email = isEmail ? identifiant : "";

    // Si téléphone → chercher l'email associé
    if (!isEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, id")
        .eq("telephone", identifiant.replace(/[\s\-]/g, ""))
        .single();

      if (!profile?.email) {
        // Utiliser téléphone comme identifiant fictif email
        email = `${identifiant.replace(/[\s\-\+]/g, "")}@jubrika.app`;
      } else {
        email = profile.email;
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    });

    if (error) {
      toast.error("Identifiant ou mot de passe incorrect");
      setLoading(false);
      return;
    }

    // Vérifier le statut du profil
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, statut")
      .eq("id", data.user.id)
      .single();

    if (!profile) {
      toast.error("Profil introuvable");
      setLoading(false);
      return;
    }

    if (profile.statut === "en_attente") {
      toast("Votre compte est en attente d'activation par l'administrateur.", { icon: "⏳" });
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (profile.statut === "desactive" || profile.statut === "rejete") {
      toast.error("Votre compte a été désactivé. Contactez l'administrateur.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    toast.success("Connexion réussie !");
    if (profile.role === "admin") router.push("/admin");
    else router.push("/commercial");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Arrière-plan décoratif */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-jubrika-or/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-jubrika-or/3 rounded-full blur-2xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-4xl font-black tracking-widest text-jubrika-or mb-1">JUBRIKA</div>
          <div className="text-xs text-gray-600 tracking-widest uppercase">Luxe · Valeur · Impact</div>
        </div>

        {/* Formulaire */}
        <div className="w-full max-w-sm">
          <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-6 shadow-2xl">
            <h1 className="text-xl font-bold text-white mb-6">Connexion</h1>

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Téléphone ou email"
                type="text"
                value={identifiant}
                onChange={e => setIdentifiant(e.target.value)}
                placeholder="+225 00 00 00 00"
                leftIcon={<Phone size={16} />}
                autoComplete="username"
              />

              <Input
                label="Mot de passe"
                type={showMdp ? "text" : "password"}
                value={motDePasse}
                onChange={e => setMotDePasse(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                rightIcon={
                  <button type="button" onClick={() => setShowMdp(!showMdp)} className="text-gray-500 hover:text-white transition-colors">
                    {showMdp ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <Button type="submit" variant="primary" fullWidth loading={loading} size="lg" className="mt-6">
                Se connecter
              </Button>
            </form>
          </div>

          {/* Lien inscription */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-jubrika-or hover:text-jubrika-or-clair font-medium transition-colors">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
