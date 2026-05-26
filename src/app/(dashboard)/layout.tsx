"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) {
      router.replace("/login");
      return;
    }
    // Rediriger si mauvais rôle
    if (profile.role === "commercial" && pathname.startsWith("/admin")) {
      router.replace("/commercial");
    }
    if (profile.role === "admin" && pathname.startsWith("/commercial")) {
      router.replace("/admin");
    }
    // Compte non actif
    if (profile.statut !== "actif" && profile.role !== "admin") {
      router.replace("/login");
    }
  }, [user, profile, loading, pathname, router]);

  if (loading) return <LoadingSpinner fullPage />;
  if (!user || !profile) return <LoadingSpinner fullPage />;

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Sidebar desktop */}
      <Sidebar />

      {/* Contenu principal */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
        {children}
      </main>

      {/* Navigation mobile bas d'écran */}
      <MobileNav />
    </div>
  );
}
