/**
 * Lightweight i18n — EN / FR / AR (RTL for Arabic).
 * Usage: t('key') or t('daysCount', { n: 3 })
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { STRINGS } from '../i18n/strings';

const LangContext = createContext(null);

function format(template, vars) {
  if (!vars || !template) return template;
  return String(template).replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] != null ? String(vars[k]) : `{${k}}`
  );
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('tanmiya_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('tanmiya_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key, vars) => {
        const raw = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
        return format(raw, vars);
      },
      daysLabel: (n) => {
        const num = Number(n) || 0;
        const key = num === 1 ? 'daysCount' : 'daysCountPlural';
        const raw = STRINGS[lang]?.[key] ?? STRINGS.en[key];
        return format(raw, { n: num });
      },
      isRtl: lang === 'ar',
    }),
    [lang]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
