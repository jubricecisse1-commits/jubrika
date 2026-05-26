"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (profile?.role === "admin") {
      router.replace("/admin");
    } else if (profile?.statut === "actif") {
      router.replace("/commercial");
    } else {
      router.replace("/login");
    }
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl font-black tracking-widest text-jubrika-or mb-2">JUBRIKA</div>
        <div className="text-xs text-gray-500 tracking-widest uppercase">Luxe Valeur Impact</div>
        <div className="mt-8 flex justify-center">
          <div className="w-8 h-8 border-2 border-jubrika-or border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
