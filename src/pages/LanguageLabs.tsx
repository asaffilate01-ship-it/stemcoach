import { AppHeader } from "@/components/layout/AppHeader";
import { LanguageLabWorkspace } from "@/components/learning/LanguageLabWorkspace";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { normalizeLanguage } from "@/i18n/language";
export default function LanguageLabs(){
  const {t,i18n}=useTranslation();
  useDocumentTitle(t("nav.languageLabs"));
  return <div className="min-h-screen bg-background"><AppHeader/><LanguageLabWorkspace language={normalizeLanguage(i18n.resolvedLanguage||i18n.language)==="de"?"de":"en"}/></div>;
}
