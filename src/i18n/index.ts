import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en';
import fr from './locales/fr';
import de from './locales/de';
import { applyDocumentLanguage, normalizeLanguage, SUPPORTED_LANGUAGES } from './language';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, fr: { translation: fr }, de: { translation: de } },
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    cleanCode: true,
    returnNull: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      convertDetectedLanguage: normalizeLanguage,
    },
  });

applyDocumentLanguage(i18n.resolvedLanguage || i18n.language);
i18n.on('languageChanged', applyDocumentLanguage);

export default i18n;
