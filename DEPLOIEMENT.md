# 🚀 Guide de déploiement JUBRIKA

## Prérequis
- Node.js 18+
- Compte Supabase (gratuit)
- Compte Vercel (gratuit)
- (Optionnel) Compte Twilio pour les SMS OTP

---

## ÉTAPE 1 — Supabase

### 1.1 Créer le projet
1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet (nom : `jubrika`)
3. Choisir une région proche (ex: `eu-west-1` pour l'Afrique de l'Ouest)
4. Copier les clés : `SUPABASE_URL` et `ANON_KEY` depuis Settings > API

### 1.2 Exécuter le schéma SQL
1. Dans le dashboard Supabase → **SQL Editor**
2. Ouvrir le fichier `supabase/schema.sql` du projet
3. Coller tout le contenu et exécuter
4. Vérifier que toutes les tables sont créées

### 1.3 Créer le bucket de stockage (photos)
1. Supabase → **Storage** → Nouveau bucket
2. Nom : `photos`
3. Cocher "Public bucket"
4. Ajouter une politique : permettre l'upload pour les utilisateurs authentifiés

### 1.4 Créer le compte administrateur
1. Supabase → **Authentication** → Users → Add User
2. Email : `admin@jubrika.com` (ou votre email)
3. Password : choisir un mot de passe fort
4. Dans SQL Editor, insérer le profil admin :
```sql
INSERT INTO profiles (id, nom_complet, telephone, email, ville, pays, role, statut, otp_verifie)
VALUES (
  'REMPLACER_PAR_UUID_DU_USER',
  'Administrateur JUBRIKA',
  '+2250000000000',
  'admin@jubrika.com',
  'Abidjan',
  'Côte d''Ivoire',
  'admin',
  'actif',
  true
);
```
Remplacer `REMPLACER_PAR_UUID_DU_USER` par l'UUID visible dans Authentication > Users.

---

## ÉTAPE 2 — Variables d'environnement

Créer ou mettre à jour le fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=VOTRE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=VOTRE_SERVICE_ROLE_KEY

# Twilio SMS OTP (optionnel — sinon le code s'affiche dans les logs en dev)
TWILIO_ACCOUNT_SID=VOTRE_SID
TWILIO_AUTH_TOKEN=VOTRE_TOKEN
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

# Resend pour email (alternative Twilio)
RESEND_API_KEY=VOTRE_CLE_RESEND
RESEND_FROM_EMAIL=noreply@jubrika.com

NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
```

---

## ÉTAPE 3 — Lancement local

```bash
# Installer les dépendances
npm install

# Démarrer en développement
npm run dev
# → Ouvrir http://localhost:3000
```

---

## ÉTAPE 4 — Déploiement Vercel

### 4.1 Via CLI Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 4.2 Via GitHub (recommandé)
1. Pousser le code sur GitHub
2. Aller sur [vercel.com](https://vercel.com)
3. "Import Project" → sélectionner le repo
4. Ajouter les variables d'environnement dans Vercel → Settings → Environment Variables
5. Déployer

### 4.3 Variables Vercel à configurer
Dans Vercel Dashboard → Settings → Environment Variables :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_ACCOUNT_SID` (optionnel)
- `TWILIO_AUTH_TOKEN` (optionnel)
- `TWILIO_PHONE_NUMBER` (optionnel)
- `NEXT_PUBLIC_APP_URL` = URL de votre app Vercel

---

## ÉTAPE 5 — Import des données historiques

### Importer les 869 clients CSV
1. Se connecter comme admin
2. Aller dans Admin → Clients
3. Cliquer "Importer CSV"
4. Sélectionner votre fichier avec les colonnes :
   `Date, Ville, Produit, Numéro du client, Remise, Prix vendu, Chiffre d'affaires`

Le CA historique de **7 318 202 FCFA** est automatiquement inclus dans le tableau de bord.

---

## ÉTAPE 6 — Configuration OTP en production

### Option A : Twilio (SMS)
1. Créer un compte sur [twilio.com](https://twilio.com)
2. Obtenir un numéro de téléphone
3. Copier SID, Token et numéro dans les variables d'environnement

### Option B : Mode développement
Sans Twilio, le code OTP s'affiche dans les **logs serveur** (Vercel Functions logs).
Les commerciaux peuvent entrer n'importe quel code de 6 chiffres visible dans les logs.

---

## Architecture de l'application

```
jubrika/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Pages connexion / inscription
│   │   ├── (dashboard)/
│   │   │   ├── admin/       # Tableau de bord admin
│   │   │   └── commercial/  # Interface commercial
│   │   └── api/             # Routes API Next.js
│   ├── components/
│   │   ├── layout/          # Navigation, sidebar, header
│   │   └── ui/              # Composants réutilisables
│   ├── contexts/            # Auth et langue
│   └── lib/                 # Types, utils, Supabase clients
├── supabase/
│   └── schema.sql           # Schéma complet de la BDD
└── .env.local               # Variables d'environnement
```

---

## Support et maintenance

- **Supabase Dashboard** : surveillance des requêtes, logs, utilisateurs
- **Vercel Dashboard** : logs des fonctions, analytics, déploiements
- **Alertes stock** : configurables par produit dans le dashboard admin

---

*JUBRIKA — Luxe Valeur Impact — v1.0.0*
