import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ModePaiement, CategorieProduct } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCFA(montant: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(montant) + " FCFA";
}

export function formatDate(date: string | Date, format: "court" | "long" | "heure" = "court"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (format === "heure") {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  if (format === "long") {
    return d.toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
  }
  return d.toLocaleDateString("fr-FR");
}

export function formatDateHeure(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${formatDate(d)} à ${formatDate(d, "heure")}`;
}

export function labelPaiement(mode: ModePaiement): string {
  const labels: Record<ModePaiement, string> = {
    especes: "Espèces",
    orange_money: "Orange Money",
    mtn_momo: "MTN MoMo",
    wave: "Wave",
    autre: "Autre",
  };
  return labels[mode] || mode;
}

export function labelCategorie(cat: CategorieProduct): string {
  const labels: Record<CategorieProduct, string> = {
    lunettes_photochromiques: "Lunettes photochromiques",
    lunettes_style: "Lunettes de style",
    montres: "Montres",
    accessoires: "Accessoires",
  };
  return labels[cat] || cat;
}

export function genererCodePromo(prefix = "JUBRIKA"): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = prefix;
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function calculerPrixApresRemise(prix: number, remisePct: number): number {
  return Math.round(prix * (1 - remisePct / 100));
}

export function tronquer(texte: string, maxLen = 30): string {
  return texte.length > maxLen ? texte.substring(0, maxLen) + "..." : texte;
}

export function validerTelephone(tel: string): boolean {
  const clean = tel.replace(/[\s\-\+\(\)]/g, "");
  return /^\d{8,15}$/.test(clean);
}

export function normaliserTelephone(tel: string): string {
  return tel.replace(/[\s\-\(\)]/g, "");
}

export async function genererQRCode(texte: string): Promise<string> {
  const QRCode = await import("qrcode");
  return QRCode.toDataURL(texte, {
    width: 200,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
}

export function debutPeriode(periode: "jour" | "semaine" | "mois" | "annee"): Date {
  const now = new Date();
  switch (periode) {
    case "jour":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "semaine": {
      const jour = now.getDay();
      const diff = now.getDate() - jour + (jour === 0 ? -6 : 1);
      return new Date(now.getFullYear(), now.getMonth(), diff);
    }
    case "mois":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "annee":
      return new Date(now.getFullYear(), 0, 1);
  }
}

export const COULEURS_GRAPHIQUE = [
  "#C9960C", "#E5B820", "#A07A0A", "#FFD700", "#B8860B", "#DAA520",
];

export function medailleClassement(position: number): string {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return `#${position}`;
}
