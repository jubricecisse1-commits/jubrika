"use client";
import { useState, useEffect } from "react";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { Notification } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const { langue, toggleLangue } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!profile) return;
    const fetchNotifs = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .eq("lue", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setNotifications(data as Notification[]);
    };
    fetchNotifs();

    // Abonnement realtime
    const channel = supabase
      .channel(`notifs-${profile.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${profile.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile, supabase]);

  const marquerLues = async () => {
    if (!profile || notifications.length === 0) return;
    await supabase
      .from("notifications")
      .update({ lue: true })
      .eq("user_id", profile.id)
      .eq("lue", false);
    setNotifications([]);
  };

  return (
    <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-lg border-b border-white/10 px-4 md:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Titre page */}
        <h1 className="text-base md:text-lg font-bold text-white truncate">{title}</h1>

        <div className="flex items-center gap-2">
          {/* Bascule langue (mobile) */}
          <button
            onClick={toggleLangue}
            className="md:hidden text-sm text-gray-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
          >
            {langue === "fr" ? "EN" : "FR"}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) marquerLues(); }}
              className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-jubrika-or rounded-full" />
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-600 text-sm py-6">Aucune notification</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="px-4 py-3 border-b border-white/5 hover:bg-white/5">
                        <p className="text-sm text-white font-medium">{n.titre}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-gray-700 mt-1">{formatDate(n.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Avatar mobile */}
          <Link href={profile?.role === "admin" ? "/admin" : "/commercial/profil"} className="md:hidden">
            <div className="w-8 h-8 rounded-full bg-jubrika-or/20 flex items-center justify-center">
              {profile?.photo_url ? (
                <Image src={profile.photo_url} alt="" width={32} height={32} className="rounded-full" />
              ) : (
                <span className="text-jubrika-or text-xs font-bold">
                  {profile?.nom_complet?.[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
          </Link>

          {/* Déco mobile */}
          <button
            onClick={signOut}
            className="md:hidden p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
