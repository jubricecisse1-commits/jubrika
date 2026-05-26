"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Package, Trophy, User,
  Tag, Users, ArrowLeftRight, BarChart3, PlusCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/ventes", label: "Ventes", icon: ShoppingCart },
  { href: "/admin/stocks", label: "Stocks", icon: Package },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/comptes", label: "Comptes", icon: User },
];

const commercialNav: NavItem[] = [
  { href: "/commercial", label: "Vente", icon: PlusCircle },
  { href: "/commercial/historique", label: "Historique", icon: ShoppingCart },
  { href: "/commercial/stock", label: "Stock", icon: Package },
  { href: "/commercial/classement", label: "Classement", icon: Trophy },
  { href: "/commercial/profil", label: "Profil", icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const navItems = profile?.role === "admin" ? adminNav : commercialNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a] border-t border-white/10 safe-bottom md:hidden">
      <div className="flex items-center justify-around px-1 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/admin" && href !== "/commercial" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px]",
                isActive
                  ? "text-jubrika-or"
                  : "text-gray-600 hover:text-gray-400"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[9px] font-medium tracking-wide truncate">{label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-jubrika-or absolute -bottom-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
