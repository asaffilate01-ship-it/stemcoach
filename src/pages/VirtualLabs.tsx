import { AppHeader } from "@/components/layout/AppHeader";
import { VirtualLabWorkspace } from "@/components/learning/VirtualLabWorkspace";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { normalizeLanguage } from "@/i18n/language";

export default function VirtualLabs() {
  const {t,i18n}=useTranslation();
  useDocumentTitle(t("nav.virtualLabs"));
  return <div className="min-h-screen bg-background"><AppHeader/><VirtualLabWorkspace language={normalizeLanguage(i18n.resolvedLanguage||i18n.language)==="de"?"de":"en"}/></div>;
}
