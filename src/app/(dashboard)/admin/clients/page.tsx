"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, Users, Phone, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Client } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import Papa from "papaparse";

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [totalVentes, setTotalVentes] = useState<Record<string, number>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setClients((data as Client[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  // Import CSV
  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[];
        let importes = 0;
        let erreurs = 0;

        for (const row of rows) {
          // Colonnes possibles selon le format JUBRIKA
          const telephone = row["Numéro du client"] || row["telephone"] || row["phone"] || "";
          const ville = row["Ville"] || row["ville"] || row["city"] || "";
          const dateVente = row["Date"] || row["date"] || "";
          const produit = row["Produit"] || row["produit"] || "";
          const remise = parseFloat(row["Remise"] || row["remise"] || "0");
          const prixVendu = parseFloat(row["Prix vendu"] || row["prix_vendu"] || "0");
          const ca = parseFloat(row["Chiffre d'affaires"] || row["ca"] || "0");

          if (!telephone) continue;

          // Insérer dans import_clients_historique
          await supabase.from("import_clients_historique").insert({
            date_vente: dateVente || null,
            ville,
            produit,
            telephone_client: telephone.trim(),
            remise,
            prix_vendu: prixVendu || null,
            chiffre_affaires: ca || prixVendu || null,
          });

          // Upsert dans clients
          const { error } = await supabase
            .from("clients")
            .upsert({ telephone: telephone.trim(), ville: ville || null }, { onConflict: "telephone" });

          if (error) erreurs++;
          else importes++;
        }

        toast.success(`Import terminé : ${importes} clients, ${erreurs} erreurs`);
        setImportLoading(false);
        load();
        if (fileRef.current) fileRef.current.value = "";
      },
      error: () => {
        toast.error("Erreur lors de la lecture du fichier CSV");
        setImportLoading(false);
      }
    });
  };

  const filtered = clients.filter(c =>
    !search ||
    c.telephone.includes(search) ||
    (c.ville || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.nom || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header title="Base clients (CRM)" />
      <div className="px-4 md:px-6 py-6 space-y-6">

        {/* Actions */}
        <div className="flex gap-3 flex-wrap items-center">
          <Input
            placeholder="Rechercher par téléphone, ville..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileRef.current?.click()}
            loading={importLoading}
          >
            <Upload size={16} /> Importer CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          <p className="text-xs text-gray-600">{filtered.length} client(s)</p>
        </div>

        {/* Infos format CSV */}
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1 font-medium">Format CSV attendu :</p>
          <p className="text-xs text-gray-600 font-mono">Date, Ville, Produit, Numéro du client, Remise, Prix vendu, Chiffre d&apos;affaires</p>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="grid gap-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucun client</p>
                <p className="text-xs mt-1">Importez votre base CSV ou ajoutez des clients via les ventes</p>
              </div>
            ) : filtered.map(c => (
              <div key={c.id} className="bg-[#111111] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Phone size={16} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{c.telephone}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {c.ville && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={10} /> {c.ville}
                      </span>
                    )}
                    <span className="text-xs text-gray-600">Depuis {formatDate(c.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
