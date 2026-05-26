// ============================================================
// JUBRIKA — Types TypeScript centraux
// ============================================================

export type Role = "admin" | "commercial";
export type StatutCompte = "en_attente" | "actif" | "desactive" | "rejete";
export type StatutTransfert = "en_attente" | "transferee" | "en_livraison" | "livree" | "annulee";
export type ModePaiement = "especes" | "orange_money" | "mtn_momo" | "wave" | "autre";
export type CategorieProduct = "lunettes_photochromiques" | "lunettes_style" | "montres" | "accessoires";
export type TypeNotification = "info" | "succes" | "alerte" | "erreur";

export interface Profile {
  id: string;
  nom_complet: string;
  telephone: string;
  email?: string;
  ville: string;
  pays: string;
  role: Role;
  statut: StatutCompte;
  photo_url?: string;
  otp_verifie: boolean;
  created_at: string;
  updated_at: string;
}

export interface Produit {
  id: string;
  nom: string;
  reference: string;
  categorie: CategorieProduct;
  prix_base: number;
  photo_url?: string;
  qr_code?: string;
  description?: string;
  actif: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: string;
  commercial_id: string;
  produit_id: string;
  quantite: number;
  seuil_alerte: number;
  updated_at: string;
  commercial_nom?: string;
  commercial_ville?: string;
  produit_nom?: string;
  produit_reference?: string;
  produit_categorie?: string;
  prix_base?: number;
  photo_url?: string;
  alerte_stock_bas?: boolean;
}

export interface Arrivage {
  id: string;
  produit_id: string;
  quantite: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  produit?: Produit;
}

export interface Distribution {
  id: string;
  arrivage_id?: string;
  produit_id: string;
  commercial_id: string;
  quantite: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  produit?: Produit;
  commercial?: Profile;
}

export interface CodePromo {
  id: string;
  code: string;
  reduction_pourcent: number;
  date_expiration?: string;
  nb_utilisations_max?: number;
  nb_utilisations_actuel: number;
  produit_ids?: string[];
  actif: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  telephone: string;
  nom?: string;
  ville?: string;
  pays?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LigneVente {
  produit_id: string;
  produit?: Produit;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
}

export interface Vente {
  id: string;
  commercial_id: string;
  client_telephone: string;
  client_ville?: string;
  date_vente: string;
  montant_total: number;
  montant_apres_remise: number;
  code_promo_id?: string;
  reduction_appliquee: number;
  mode_paiement: ModePaiement;
  notes?: string;
  statut: "validee" | "annulee";
  created_at: string;
  commercial_nom?: string;
  commercial_ville?: string;
  code_promo?: string;
  lignes?: LigneVente[];
}

export interface VenteProduit {
  id: string;
  vente_id: string;
  produit_id: string;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
  produit?: Produit;
}

export interface TransfertCommande {
  id: string;
  commercial_expediteur_id: string;
  commercial_destinataire_id: string;
  vente_id?: string;
  client_telephone: string;
  client_ville: string;
  produit_id?: string;
  quantite: number;
  notes?: string;
  statut: StatutTransfert;
  created_at: string;
  updated_at: string;
  expediteur?: Profile | Record<string, unknown>;
  destinataire?: Profile | Record<string, unknown>;
  produit?: Produit | Record<string, unknown>;
}

export interface Notification {
  id: string;
  user_id: string;
  titre: string;
  message: string;
  type: TypeNotification;
  lue: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

export interface StatsPeriode {
  ca_total: number;
  nb_ventes: number;
  panier_moyen: number;
}

export interface StatsCommercial extends StatsPeriode {
  commercial_id: string;
  commercial_nom: string;
  commercial_ville: string;
  photo_url?: string;
}

export interface PanierItem {
  produit: Produit;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
}

export type Langue = "fr" | "en";

export interface Traductions {
  [cle: string]: string;
}
