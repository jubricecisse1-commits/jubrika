-- ============================================================
-- JUBRIKA — Schéma complet de la base de données Supabase
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE : profiles (utilisateurs / commerciaux)
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nom_complet TEXT NOT NULL,
  telephone TEXT UNIQUE NOT NULL,
  email TEXT,
  ville TEXT NOT NULL,
  pays TEXT NOT NULL DEFAULT 'Côte d''Ivoire',
  role TEXT NOT NULL DEFAULT 'commercial' CHECK (role IN ('admin', 'commercial')),
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'actif', 'desactive', 'rejete')),
  photo_url TEXT,
  otp_verifie BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : produits
-- ============================================================
CREATE TABLE produits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  categorie TEXT NOT NULL CHECK (categorie IN ('lunettes_photochromiques', 'lunettes_style', 'montres', 'accessoires')),
  prix_base NUMERIC(12, 0) NOT NULL,
  photo_url TEXT,
  qr_code TEXT,
  description TEXT,
  actif BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : stocks (stock par commercial)
-- ============================================================
CREATE TABLE stocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  commercial_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  produit_id UUID REFERENCES produits(id) ON DELETE CASCADE NOT NULL,
  quantite INTEGER NOT NULL DEFAULT 0,
  seuil_alerte INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(commercial_id, produit_id)
);

-- ============================================================
-- TABLE : arrivages (entrées de stock global)
-- ============================================================
CREATE TABLE arrivages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  produit_id UUID REFERENCES produits(id) ON DELETE CASCADE NOT NULL,
  quantite INTEGER NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : distributions (stock admin → commercial)
-- ============================================================
CREATE TABLE distributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  arrivage_id UUID REFERENCES arrivages(id),
  produit_id UUID REFERENCES produits(id) ON DELETE CASCADE NOT NULL,
  commercial_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  quantite INTEGER NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : codes_promo
-- ============================================================
CREATE TABLE codes_promo (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  reduction_pourcent NUMERIC(5, 2) NOT NULL CHECK (reduction_pourcent > 0 AND reduction_pourcent <= 100),
  date_expiration TIMESTAMPTZ,
  nb_utilisations_max INTEGER,
  nb_utilisations_actuel INTEGER DEFAULT 0,
  produit_ids UUID[],  -- NULL = valable sur tout
  actif BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : clients (CRM)
-- ============================================================
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  telephone TEXT UNIQUE NOT NULL,
  nom TEXT,
  ville TEXT,
  pays TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : ventes
-- ============================================================
CREATE TABLE ventes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  commercial_id UUID REFERENCES profiles(id) NOT NULL,
  client_telephone TEXT NOT NULL,
  client_ville TEXT,
  date_vente TIMESTAMPTZ DEFAULT NOW(),
  montant_total NUMERIC(12, 0) NOT NULL,
  montant_apres_remise NUMERIC(12, 0) NOT NULL,
  code_promo_id UUID REFERENCES codes_promo(id),
  reduction_appliquee NUMERIC(5, 2) DEFAULT 0,
  mode_paiement TEXT NOT NULL CHECK (mode_paiement IN ('especes', 'orange_money', 'mtn_momo', 'wave', 'autre')),
  notes TEXT,
  statut TEXT DEFAULT 'validee' CHECK (statut IN ('validee', 'annulee')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : vente_produits (lignes de vente)
-- ============================================================
CREATE TABLE vente_produits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vente_id UUID REFERENCES ventes(id) ON DELETE CASCADE NOT NULL,
  produit_id UUID REFERENCES produits(id) NOT NULL,
  quantite INTEGER NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC(12, 0) NOT NULL,
  prix_total NUMERIC(12, 0) NOT NULL
);

-- ============================================================
-- TABLE : transferts_commandes
-- ============================================================
CREATE TABLE transferts_commandes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  commercial_expediteur_id UUID REFERENCES profiles(id) NOT NULL,
  commercial_destinataire_id UUID REFERENCES profiles(id) NOT NULL,
  vente_id UUID REFERENCES ventes(id),
  client_telephone TEXT NOT NULL,
  client_ville TEXT NOT NULL,
  produit_id UUID REFERENCES produits(id),
  quantite INTEGER DEFAULT 1,
  notes TEXT,
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'transferee', 'en_livraison', 'livree', 'annulee')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : notifications
-- ============================================================
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'succes', 'alerte', 'erreur')),
  lue BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : otp_codes (vérification lors de l'inscription)
-- ============================================================
CREATE TABLE otp_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  telephone TEXT NOT NULL,
  code TEXT NOT NULL,
  expire_at TIMESTAMPTZ NOT NULL,
  utilise BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : ca_historique (CA de départ importé)
-- ============================================================
CREATE TABLE ca_historique (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  montant NUMERIC(12, 0) NOT NULL DEFAULT 7318202,
  description TEXT DEFAULT 'Chiffre d''affaires historique avant démarrage de l''application',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer le CA historique de départ
INSERT INTO ca_historique (montant, description)
VALUES (7318202, 'CA historique JUBRIKA importé depuis la base existante');

-- ============================================================
-- TABLE : import_clients_historique (données CSV importées)
-- ============================================================
CREATE TABLE import_clients_historique (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date_vente DATE,
  ville TEXT,
  produit TEXT,
  telephone_client TEXT,
  remise NUMERIC(5, 2) DEFAULT 0,
  prix_vendu NUMERIC(12, 0),
  chiffre_affaires NUMERIC(12, 0),
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VUES UTILES
-- ============================================================

-- Vue : stocks avec détails produit et commercial
CREATE OR REPLACE VIEW vue_stocks AS
SELECT
  s.id,
  s.commercial_id,
  p.nom AS commercial_nom,
  p.ville AS commercial_ville,
  s.produit_id,
  pr.nom AS produit_nom,
  pr.reference AS produit_reference,
  pr.categorie AS produit_categorie,
  pr.prix_base,
  pr.photo_url,
  s.quantite,
  s.seuil_alerte,
  CASE WHEN s.quantite <= s.seuil_alerte THEN TRUE ELSE FALSE END AS alerte_stock_bas,
  s.updated_at
FROM stocks s
JOIN profiles p ON s.commercial_id = p.id
JOIN produits pr ON s.produit_id = pr.id;

-- Vue : ventes avec détails
CREATE OR REPLACE VIEW vue_ventes AS
SELECT
  v.id,
  v.commercial_id,
  p.nom_complet AS commercial_nom,
  p.ville AS commercial_ville,
  v.client_telephone,
  v.client_ville,
  v.date_vente,
  v.montant_total,
  v.montant_apres_remise,
  v.reduction_appliquee,
  cp.code AS code_promo,
  v.mode_paiement,
  v.notes,
  v.statut,
  v.created_at
FROM ventes v
JOIN profiles p ON v.commercial_id = p.id
LEFT JOIN codes_promo cp ON v.code_promo_id = cp.id;

-- ============================================================
-- FONCTIONS ET TRIGGERS
-- ============================================================

-- Trigger : mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER produits_updated_at BEFORE UPDATE ON produits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER stocks_updated_at BEFORE UPDATE ON stocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER codes_promo_updated_at BEFORE UPDATE ON codes_promo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER transferts_updated_at BEFORE UPDATE ON transferts_commandes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Fonction : décrémenter le stock après une vente
CREATE OR REPLACE FUNCTION decrementer_stock_vente()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stocks
  SET quantite = quantite - NEW.quantite
  WHERE commercial_id = (SELECT commercial_id FROM ventes WHERE id = NEW.vente_id)
    AND produit_id = NEW.produit_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_stock
AFTER INSERT ON vente_produits
FOR EACH ROW EXECUTE FUNCTION decrementer_stock_vente();

-- Fonction : incrémenter le stock après distribution
CREATE OR REPLACE FUNCTION incrementer_stock_distribution()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stocks (commercial_id, produit_id, quantite)
  VALUES (NEW.commercial_id, NEW.produit_id, NEW.quantite)
  ON CONFLICT (commercial_id, produit_id)
  DO UPDATE SET quantite = stocks.quantite + NEW.quantite, updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_stock
AFTER INSERT ON distributions
FOR EACH ROW EXECUTE FUNCTION incrementer_stock_distribution();

-- Fonction : incrémenter l'utilisation d'un code promo
CREATE OR REPLACE FUNCTION incrementer_utilisation_promo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code_promo_id IS NOT NULL THEN
    UPDATE codes_promo
    SET nb_utilisations_actuel = nb_utilisations_actuel + 1
    WHERE id = NEW.code_promo_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_promo
AFTER INSERT ON ventes
FOR EACH ROW EXECUTE FUNCTION incrementer_utilisation_promo();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrivages ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE codes_promo ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vente_produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferts_commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Politique profiles : chaque utilisateur voit son profil, admin voit tout
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politique ventes : commercial voit ses ventes, admin voit tout
CREATE POLICY "ventes_select" ON ventes
  FOR SELECT USING (
    commercial_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "ventes_insert" ON ventes
  FOR INSERT WITH CHECK (commercial_id = auth.uid());

-- Politique stocks : commercial voit son stock, admin voit tout
CREATE POLICY "stocks_select" ON stocks
  FOR SELECT USING (
    commercial_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Politique produits : tous les actifs peuvent lire
CREATE POLICY "produits_select" ON produits
  FOR SELECT USING (actif = TRUE);

CREATE POLICY "produits_admin" ON produits
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politique notifications : chaque utilisateur voit ses notifications
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Politique codes_promo : tous les actifs peuvent lire, admin peut tout faire
CREATE POLICY "promos_select" ON codes_promo
  FOR SELECT USING (actif = TRUE OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "promos_admin" ON codes_promo
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politique vente_produits
CREATE POLICY "vente_produits_select" ON vente_produits
  FOR SELECT USING (
    (SELECT commercial_id FROM ventes WHERE id = vente_id) = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "vente_produits_insert" ON vente_produits
  FOR INSERT WITH CHECK (
    (SELECT commercial_id FROM ventes WHERE id = vente_id) = auth.uid()
  );

-- Politique transferts
CREATE POLICY "transferts_select" ON transferts_commandes
  FOR SELECT USING (
    commercial_expediteur_id = auth.uid()
    OR commercial_destinataire_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Politique clients : tous voient
CREATE POLICY "clients_select" ON clients
  FOR SELECT USING (TRUE);

CREATE POLICY "clients_insert" ON clients
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "clients_update" ON clients
  FOR UPDATE USING (TRUE);

-- ============================================================
-- INDEX POUR PERFORMANCE
-- ============================================================
CREATE INDEX idx_ventes_commercial ON ventes(commercial_id);
CREATE INDEX idx_ventes_date ON ventes(date_vente);
CREATE INDEX idx_ventes_client ON ventes(client_telephone);
CREATE INDEX idx_stocks_commercial ON stocks(commercial_id);
CREATE INDEX idx_stocks_produit ON stocks(produit_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, lue);
CREATE INDEX idx_clients_telephone ON clients(telephone);
CREATE INDEX idx_vente_produits_vente ON vente_produits(vente_id);
CREATE INDEX idx_distributions_commercial ON distributions(commercial_id);
