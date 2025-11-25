"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Language } from "../types";
import { TRANSLATIONS } from "../constants";

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>("FR");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("sol_lang") as Language | null;
    if (stored && ["FR", "EN", "ES", "KR"].includes(stored)) {
      setLangState(stored as Language);
    } else {
      const browser = typeof navigator !== "undefined" ? navigator.language : "fr";
      if (browser.startsWith("fr")) setLangState("FR");
      else if (browser.startsWith("es")) setLangState("ES");
      else if (browser.startsWith("ko")) setLangState("KR");
      else setLangState("EN");
    }
  }, []);

  const setLang = (value: Language) => {
    setLangState(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sol_lang", value);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

export const useI18n = () => {
  const { lang, setLang } = useLanguage();
  const t = TRANSLATIONS[lang];
  return { lang, setLang, t };
};

