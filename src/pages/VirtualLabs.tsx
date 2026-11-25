import { useSearchParams } from "react-router-dom";
import { parseLabSelection } from "@/lib/labCatalogue";
import { AppHeader } from "@/components/layout/AppHeader";
import { VirtualLabWorkspace } from "@/components/learning/VirtualLabWorkspace";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { normalizeLanguage } from "@/i18n/language";

export default function VirtualLabs() {
  const {t,i18n}=useTranslation();
  const [params,setParams]=useSearchParams();
  const selectedLab=parseLabSelection(params.get("lab"));
  useDocumentTitle(t("nav.virtualLabs"));
  return <div className="min-h-screen bg-background"><AppHeader/><VirtualLabWorkspace selectedLab={selectedLab} onSelectLab={id=>setParams(previous=>{const next=new URLSearchParams(previous);next.set("lab",id);return next;})} language={normalizeLanguage(i18n.resolvedLanguage||i18n.language)==="de"?"de":"en"}/></div>;
}
