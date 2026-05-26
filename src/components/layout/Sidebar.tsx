"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Package, Trophy, User,
  Tag, Users, ArrowLeftRight, BarChart3, PlusCircle, LogOut, Bell
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  // Admin
  { href: "/admin", label: "nav.dashboard", icon: BarChart3, adminOnly: true },
  { href: "/admin/ventes", label: "nav.sales", icon: ShoppingCart, adminOnly: true },
  { href: "/admin/stocks", label: "nav.stock", icon: Package, adminOnly: true },
  { href: "/admin/promos", label: "nav.promos", icon: Tag, adminOnly: true },
  { href: "/admin/clients", label: "nav.clients", icon: Users, adminOnly: true },
  { href: "/admin/transferts", label: "nav.transfers", icon: ArrowLeftRight, adminOnly: true },
  { href: "/admin/comptes", label: "nav.accounts", icon: User, adminOnly: true },
  // Commercial
  { href: "/commercial", label: "nav.new_sale", icon: PlusCircle },
  { href: "/commercial/historique", label: "nav.sales", icon: ShoppingCart },
  { href: "/commercial/stock", label: "nav.stock", icon: Package },
  { href: "/commercial/transferts", label: "nav.transfers", icon: ArrowLeftRight },
  { href: "/commercial/classement", label: "nav.leaderboard", icon: Trophy },
  { href: "/commercial/profil", label: "nav.profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { t, langue, toggleLangue } = useLanguage();

  const filteredItems = navItems.filter(item =>
    profile?.role === "admin" ? item.adminOnly === true : !item.adminOnly
  );

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#080808] border-r border-white/10 min-h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <Link href={profile?.role === "admin" ? "/admin" : "/commercial"}>
          <div className="text-2xl font-black tracking-widest text-jubrika-or">JUBRIKA</div>
          <div className="text-[9px] text-gray-600 tracking-widest uppercase">Luxe Valeur Impact</div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {filteredItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href.length > 10 && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium",
                  isActive
                    ? "bg-jubrika-or/15 text-jubrika-or border border-jubrika-or/20"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                {t(label as Parameters<typeof t>[0])}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        {/* Bascule langue */}
        <button
          onClick={toggleLangue}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
        >
          <span className="text-base">{langue === "fr" ? "🇫🇷" : "🇬🇧"}</span>
          {langue === "fr" ? "Français" : "English"}
        </button>

        {/* Profil mini */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
          <div className="w-8 h-8 rounded-full bg-jubrika-or/20 flex items-center justify-center flex-shrink-0">
            {profile?.photo_url ? (
              <Image src={profile.photo_url} alt="" width={32} height={32} className="rounded-full" />
            ) : (
              <span className="text-jubrika-or text-sm font-bold">
                {profile?.nom_complet?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{profile?.nom_complet}</p>
            <p className="text-[10px] text-gray-600 truncate capitalize">{profile?.role}</p>
          </div>
        </div>

        {/* Déconnexion */}
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm font-medium"
        >
          <LogOut size={16} />
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}
