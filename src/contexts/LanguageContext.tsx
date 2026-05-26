"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { translations, TranslationKey } from "@/lib/translations";
import { Langue } from "@/lib/types";

interface LanguageContextType {
  langue: Langue;
  t: (key: TranslationKey) => string;
  toggleLangue: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  langue: "fr",
  t: (key) => key,
  toggleLangue: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [langue, setLangue] = useState<Langue>("fr");

  const t = useCallback((key: TranslationKey): string => {
    return translations[langue][key] ?? key;
  }, [langue]);

  const toggleLangue = useCallback(() => {
    setLangue(prev => prev === "fr" ? "en" : "fr");
  }, []);

  return (
    <LanguageContext.Provider value={{ langue, t, toggleLangue }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
