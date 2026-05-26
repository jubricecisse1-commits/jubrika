-- ============================================================
-- JUBRIKA — Produits identifiés dans la base de ventes
-- Cameroun, mars-mai 2026
-- À exécuter dans Supabase SQL Editor après schema.sql
-- ============================================================

INSERT INTO produits (nom, reference, categorie, prix_base, description, actif)
VALUES
  ('Lunette Noir T1',       'LUN-T1',    'lunettes_style',            7500,  'Lunette noire unisexe modèle T1',                   true),
  ('Lunette Noir T2',       'LUN-T2',    'lunettes_style',           10000,  'Lunette noire unisexe modèle T2',                   true),
  ('Lunette Noire T3',      'LUN-T3',    'lunettes_style',           11000,  'Lunette noire unisexe modèle T3',                   true),
  ('Lunette Noir T4',       'LUN-T4',    'lunettes_style',           10000,  'Lunette noire unisexe modèle T4',                   true),
  ('Lunette Bleu D1',       'LUN-D1',    'lunettes_style',           15000,  'Lunette bleue modèle D1',                           true),
  ('Lunettes Chrome H1',    'PHOT-H1',   'lunettes_photochromiques', 15000,  'Lunettes photochromiques Chrome modèle H1',          true),
  ('Lunettes Chrome H2',    'PHOT-H2',   'lunettes_photochromiques', 11000,  'Lunettes photochromiques Chrome modèle H2',          true),
  ('Lunettes Réglable P1',  'LUN-P1',    'lunettes_style',           16500,  'Lunettes à branches réglables modèle P1',            true),
  ('Lunettes Pliables S1',  'LUN-S1',    'lunettes_style',            8000,  'Lunettes pliables modèle S1',                       true),
  ('Lunette Noire F1 Femme','LUN-F1',    'lunettes_style',            8500,  'Lunette noire femme modèle F1',                     true),
  ('Lunette Noire F2 Femme','LUN-F2',    'lunettes_style',            8500,  'Lunette noire femme modèle F2',                     true),
  ('Lunettes Conduite',     'LUN-COND',  'lunettes_style',            7000,  'Lunettes pour la conduite (teinte légère)',          true),
  ('Montre SABR',           'MON-SABR',  'montres',                  15000,  'Montre SABR — collection luxe',                     true),
  ('Montre Instang',        'MON-INST',  'montres',                  16500,  'Montre Instang — collection',                       true)
ON CONFLICT (reference) DO NOTHING;

-- Correspondance noms CSV → référence JUBRIKA (pour la documentation)
-- "Lunette noir T1"            → LUN-T1
-- "Lunette noir T2"            → LUN-T2
-- "Lunette noire T3"           → LUN-T3
-- "Lunette noir T4"            → LUN-T4
-- "Lunette Bleu D1"            → LUN-D1
-- "Lunettes Chome H1"          → PHOT-H1
-- "Lunettes Chome H2"          → PHOT-H2  (aussi: "Lunettes chromes H2", "Lunettes chrome")
-- "Lunettes Réglable P1"       → LUN-P1
-- "Lunettes Pliables S1"       → LUN-S1
-- "Lunette noire F1 femme"     → LUN-F1
-- "Lunette noire F2 femme"     → LUN-F2
-- "Lunettes conduite"          → LUN-COND
-- "Montre SABR"                → MON-SABR
-- "montre instang"             → MON-INST
