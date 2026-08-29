import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { subjects, curricula, difficultyLabels, type Difficulty } from "@/data/questions";
import { ChevronRight, ChevronDown, Filter, Layers, GraduationCap, Zap, ArrowRight, BookOpen, Sparkles, SlidersHorizontal, X, Check, Globe, Lightbulb } from "lucide-react";
import { Icon3D } from "@/components/ui/icon-3d";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { getMascot } from "@/lib/mascots";
import { useTranslation } from "react-i18next";
import { useSubjectCounts } from "@/hooks/useSubjectCounts";


/* ───────────────── Country & Board Data ───────────────── */

const countryGroups = [
  { id: "uk", label: "United Kingdom", flag: "🇬🇧", keys: ["uk-gcse", "uk-alevel", "uk-btec", "uk-scottish-nat5", "uk-scottish-higher", "uk-scottish-adv-higher", "uni-uk"] },
  { id: "intl", label: "International", flag: "🌐", keys: ["uk-igcse", "uk-ial", "uk-olevel", "uni-intl"] },
  { id: "ib", label: "IB Programme", flag: "🌐", keys: ["ib-myp", "ib-dp-sl", "ib-dp-hl"] },
  { id: "us", label: "United States", flag: "🇺🇸", keys: ["us-middle", "us-highschool", "us-ap", "us-sat", "us-act", "uni-us"] },
  { id: "au", label: "Australia", flag: "🇦🇺", keys: ["au-hsc", "au-vce", "au-qce", "au-wace", "au-sace", "au-atar", "uni-au"] },
  { id: "nz", label: "New Zealand", flag: "🇳🇿", keys: ["nz-ncea-1", "nz-ncea-2", "nz-ncea-3", "nz-scholarship", "uni-nz"] },
  { id: "ca", label: "Canada", flag: "🇨🇦", keys: ["ca-ontario-12", "ca-bc-12", "ca-alberta-12", "ca-quebec-cegep", "uni-ca"] },
  { id: "in", label: "India", flag: "🇮🇳", keys: ["india-cbse-10", "india-cbse-12", "india-icse-10", "india-isc-12", "india-state", "india-jee", "india-neet", "india-olympiad", "uni-in"] },
  { id: "pk", label: "Pakistan", flag: "🇵🇰", keys: ["pakistan-matric", "pakistan-fsc", "pakistan-olevel", "pakistan-alevel", "pakistan-ecat-mdcat", "uni-pk"] },
  { id: "bd", label: "Bangladesh", flag: "🇧🇩", keys: ["bd-hsc", "bd-ssc", "uni-bd"] },
  { id: "lk", label: "Sri Lanka", flag: "🇱🇰", keys: ["lk-al", "lk-ol", "uni-lk"] },
  { id: "ae", label: "UAE", flag: "🇦🇪", keys: ["uae-moe-9", "uae-moe-10", "uae-moe-11", "uae-moe-12", "uae-emsat-legacy"] },
  { id: "fr", label: "France", flag: "🇫🇷", keys: ["fr-seconde", "fr-premiere", "fr-bac-general", "fr-bac-techno", "fr-bac-pro", "fr-bts", "fr-cpge", "fr-but", "uni-fr"] },
  { id: "ph", label: "Philippines", flag: "🇵🇭", keys: ["ph-grade10", "ph-grade11", "ph-grade12", "ph-stem", "ph-abm", "ph-humss"] },
  { id: "de", label: "Deutschland", flag: "🇩🇪", keys: ["de-mittlerer", "de-oberstufe", "de-abitur", "de-fachabitur", "de-berufliches-gym", "uni-de"] },
  { id: "lang", label: "Language Certs", flag: "🗣️", keys: ["ielts-academic", "ielts-general", "celta"] },
];

/** Exam board visual identity — short code + brand color */
const boardBranding: Record<string, { abbr: string; color: string }> = {
  "AQA": { abbr: "AQA", color: "hsl(268,65%,50%)" },
  "Edexcel (Pearson)": { abbr: "EDX", color: "hsl(340,75%,45%)" },
  "OCR": { abbr: "OCR", color: "hsl(200,80%,45%)" },
  "WJEC/Eduqas": { abbr: "WJEC", color: "hsl(145,60%,38%)" },
  "CCEA": { abbr: "CCEA", color: "hsl(25,85%,50%)" },
  "Cambridge (CAIE)": { abbr: "CIE", color: "hsl(0,70%,48%)" },
  "Edexcel International": { abbr: "EDXi", color: "hsl(340,75%,45%)" },
  "Edexcel International (IAL)": { abbr: "IAL", color: "hsl(340,75%,45%)" },
  "Oxford AQA": { abbr: "OAQA", color: "hsl(210,60%,45%)" },
  "Oxford AQA International": { abbr: "OAQA", color: "hsl(210,60%,45%)" },
  "SQA": { abbr: "SQA", color: "hsl(220,65%,42%)" },
  "Pearson BTEC Level 2": { abbr: "BT2", color: "hsl(285,60%,45%)" },
  "Pearson BTEC Level 3": { abbr: "BT3", color: "hsl(285,60%,45%)" },
  "IB MYP": { abbr: "MYP", color: "hsl(200,70%,45%)" },
  "IB SL": { abbr: "SL", color: "hsl(200,70%,45%)" },
  "IB HL": { abbr: "HL", color: "hsl(200,70%,45%)" },
  "IB Further Maths": { abbr: "FM", color: "hsl(200,70%,45%)" },
  "IB HL Options": { abbr: "HLO", color: "hsl(200,70%,45%)" },
  "Common Core": { abbr: "CC", color: "hsl(220,60%,50%)" },
  "NGSS": { abbr: "NGSS", color: "hsl(160,50%,42%)" },
  "State Standards": { abbr: "SS", color: "hsl(35,70%,48%)" },
  "CBSE": { abbr: "CBSE", color: "hsl(120,50%,38%)" },
  "ICSE (CISCE)": { abbr: "ICSE", color: "hsl(30,70%,45%)" },
  "ISC (CISCE)": { abbr: "ISC", color: "hsl(30,70%,45%)" },
  "JEE Main": { abbr: "JEE", color: "hsl(15,80%,48%)" },
  "JEE Advanced": { abbr: "JEEa", color: "hsl(0,75%,45%)" },
  "NEET UG": { abbr: "NEET", color: "hsl(170,60%,38%)" },
  "Punjab Board (Lahore)": { abbr: "PB", color: "hsl(130,55%,38%)" },
  "Federal Board (FBISE)": { abbr: "FED", color: "hsl(210,60%,42%)" },
  "Sindh Board (Karachi)": { abbr: "SB", color: "hsl(35,65%,45%)" },
  "KPK Board (Peshawar)": { abbr: "KPK", color: "hsl(355,60%,45%)" },
  "Balochistan Board (Quetta)": { abbr: "BB", color: "hsl(280,50%,42%)" },
  "AJK Board (Mirpur)": { abbr: "AJK", color: "hsl(160,55%,38%)" },
  "ECAT (Engineering)": { abbr: "ECAT", color: "hsl(220,65%,48%)" },
  "MDCAT (Medical)": { abbr: "MDCAT", color: "hsl(145,60%,38%)" },
  "British Council": { abbr: "BC", color: "hsl(220,70%,45%)" },
  "IDP": { abbr: "IDP", color: "hsl(0,70%,50%)" },
  "Cambridge": { abbr: "CAM", color: "hsl(0,70%,48%)" },
  "Cambridge CELTA": { abbr: "CELTA", color: "hsl(0,70%,48%)" },
  // Australia
  "NESA": { abbr: "NESA", color: "hsl(210,65%,45%)" },
  "VCAA": { abbr: "VCAA", color: "hsl(220,60%,42%)" },
  "QCAA": { abbr: "QCAA", color: "hsl(340,65%,45%)" },
  "SCSA": { abbr: "SCSA", color: "hsl(35,70%,45%)" },
  "SACE Board": { abbr: "SACE", color: "hsl(160,55%,40%)" },
  // University boards
  "Russell Group": { abbr: "RG", color: "hsl(220,70%,38%)" },
  "UK University": { abbr: "UNI", color: "hsl(220,60%,45%)" },
  "US University": { abbr: "USU", color: "hsl(210,65%,42%)" },
  "Ivy League": { abbr: "IVY", color: "hsl(145,50%,35%)" },
  "Go8 (Group of Eight)": { abbr: "Go8", color: "hsl(35,60%,42%)" },
  "Australian University": { abbr: "AUU", color: "hsl(210,55%,45%)" },
  "NZ University": { abbr: "NZU", color: "hsl(200,60%,42%)" },
  "University of Auckland": { abbr: "UoA", color: "hsl(210,55%,40%)" },
  "U15 (Group of Canadian Research Universities)": { abbr: "U15", color: "hsl(0,65%,42%)" },
  "Canadian University": { abbr: "CAU", color: "hsl(355,55%,45%)" },
  "IIT": { abbr: "IIT", color: "hsl(15,75%,42%)" },
  "NIT": { abbr: "NIT", color: "hsl(200,60%,40%)" },
  "AIIMS": { abbr: "AIIMS", color: "hsl(160,55%,38%)" },
  "Indian University": { abbr: "INU", color: "hsl(30,60%,42%)" },
  "HEC Pakistan": { abbr: "HEC", color: "hsl(130,50%,38%)" },
  "LUMS": { abbr: "LUMS", color: "hsl(220,60%,42%)" },
  "NUST": { abbr: "NUST", color: "hsl(200,55%,40%)" },
  "Pakistan University": { abbr: "PKU", color: "hsl(145,50%,40%)" },
  "Dhaka University": { abbr: "DU", color: "hsl(130,55%,38%)" },
  "BUET": { abbr: "BUET", color: "hsl(210,60%,42%)" },
  "Bangladesh University": { abbr: "BDU", color: "hsl(160,50%,40%)" },
  "University of Colombo": { abbr: "UoC", color: "hsl(35,60%,42%)" },
  "University of Peradeniya": { abbr: "UoP", color: "hsl(145,50%,38%)" },
  "Sri Lanka University": { abbr: "LKU", color: "hsl(200,55%,42%)" },
  "International University": { abbr: "INTL", color: "hsl(270,50%,45%)" },
  // UAE
  "UAE MoE": { abbr: "MoE", color: "hsl(145,60%,38%)" },
  "EmSAT": { abbr: "EmSAT", color: "hsl(210,65%,42%)" },
  // France
  "Éducation Nationale": { abbr: "ÉN", color: "hsl(220,70%,45%)" },
  "Rectorat": { abbr: "REC", color: "hsl(220,60%,42%)" },
  "Concours CCP": { abbr: "CCP", color: "hsl(200,65%,45%)" },
  "Concours Mines-Ponts": { abbr: "M-P", color: "hsl(15,70%,45%)" },
  "Concours X-ENS": { abbr: "X", color: "hsl(0,70%,42%)" },
  "Concours Centrale-Supélec": { abbr: "CS", color: "hsl(210,65%,42%)" },
  "BCE": { abbr: "BCE", color: "hsl(340,60%,45%)" },
  "Ecricome": { abbr: "ECR", color: "hsl(270,55%,45%)" },
  "IUT / Éducation Nationale": { abbr: "IUT", color: "hsl(180,55%,40%)" },
  "Université de Paris": { abbr: "UdP", color: "hsl(220,65%,42%)" },
  "Sorbonne Université": { abbr: "SRB", color: "hsl(210,70%,40%)" },
  "Université Lyon": { abbr: "ULy", color: "hsl(0,65%,45%)" },
  "Université Toulouse": { abbr: "UTl", color: "hsl(340,60%,45%)" },
  "Université Bordeaux": { abbr: "UBx", color: "hsl(270,55%,42%)" },
  "Université Strasbourg": { abbr: "USt", color: "hsl(200,60%,42%)" },
  "Université Aix-Marseille": { abbr: "UAM", color: "hsl(25,65%,45%)" },
  "Grande École": { abbr: "GÉ", color: "hsl(45,70%,42%)" },
  // Philippines
  "DepEd Philippines": { abbr: "DepEd", color: "hsl(210,65%,45%)" },
  // Germany
  "Kultusministerkonferenz": { abbr: "KMK", color: "hsl(0,0%,15%)" },
  "Bayern Abitur": { abbr: "BAY", color: "hsl(200,60%,42%)" },
  "NRW Abitur": { abbr: "NRW", color: "hsl(130,50%,38%)" },
  "Baden-Württemberg Abitur": { abbr: "BW", color: "hsl(45,60%,42%)" },
  "Niedersachsen Abitur": { abbr: "NDS", color: "hsl(0,60%,42%)" },
  "Hessen Abitur": { abbr: "HE", color: "hsl(210,55%,42%)" },
  "Sachsen Abitur": { abbr: "SN", color: "hsl(145,50%,38%)" },
  "Berlin Abitur": { abbr: "BER", color: "hsl(355,55%,42%)" },
  "Hamburg Abitur": { abbr: "HH", color: "hsl(220,60%,42%)" },
  "FOS Bayern": { abbr: "FOS-B", color: "hsl(200,55%,42%)" },
  "FOS NRW": { abbr: "FOS-N", color: "hsl(130,45%,38%)" },
  "FOS Hessen": { abbr: "FOS-H", color: "hsl(210,50%,42%)" },
  "BG Baden-Württemberg": { abbr: "BG-BW", color: "hsl(45,55%,42%)" },
  "BG NRW": { abbr: "BG-NRW", color: "hsl(130,45%,38%)" },
  "TU9 Universitäten": { abbr: "TU9", color: "hsl(210,65%,40%)" },
  "Universität München (LMU)": { abbr: "LMU", color: "hsl(145,50%,38%)" },
  "TU München": { abbr: "TUM", color: "hsl(210,60%,42%)" },
  "Universität Heidelberg": { abbr: "UHD", color: "hsl(25,60%,42%)" },
  "Humboldt-Universität Berlin": { abbr: "HUB", color: "hsl(220,60%,40%)" },
  "RWTH Aachen": { abbr: "RWTH", color: "hsl(210,65%,42%)" },
  "Universität Freiburg": { abbr: "UFR", color: "hsl(160,50%,38%)" },
  "Fachhochschule": { abbr: "FH", color: "hsl(200,50%,42%)" },
  // New Zealand
  "NZQA": { abbr: "NZQA", color: "hsl(0,0%,20%)" },
  // Canada
  "Ontario Ministry": { abbr: "ONT", color: "hsl(0,70%,48%)" },
  "BC Ministry": { abbr: "BC", color: "hsl(210,65%,42%)" },
  "Alberta Education": { abbr: "ALB", color: "hsl(210,60%,45%)" },
  "Quebec Ministry": { abbr: "QC", color: "hsl(220,65%,48%)" },
  // Bangladesh
  "Dhaka Board": { abbr: "DHK", color: "hsl(130,55%,38%)" },
  "Rajshahi Board": { abbr: "RAJ", color: "hsl(200,60%,42%)" },
  "Chittagong Board": { abbr: "CTG", color: "hsl(340,65%,45%)" },
  "Comilla Board": { abbr: "COM", color: "hsl(25,70%,48%)" },
  "Jessore Board": { abbr: "JES", color: "hsl(160,55%,38%)" },
  "Sylhet Board": { abbr: "SYL", color: "hsl(280,50%,45%)" },
  "Dinajpur Board": { abbr: "DIN", color: "hsl(35,65%,45%)" },
  "Barisal Board": { abbr: "BAR", color: "hsl(220,55%,42%)" },
  "Madrasa Board": { abbr: "MAD", color: "hsl(145,50%,38%)" },
  "Technical Board": { abbr: "TEC", color: "hsl(200,50%,42%)" },
  // Sri Lanka
  "NIE Sri Lanka": { abbr: "NIE", color: "hsl(25,70%,45%)" },
};

function getBoardBrand(board: string) {
  return boardBranding[board] || { abbr: board.slice(0, 3).toUpperCase(), color: "hsl(var(--primary))" };
}

const subjectGradients: Record<string, string> = {
  mathematics: "from-[hsl(226,70%,50%)] to-[hsl(258,60%,52%)]",
  physics: "from-[hsl(250,80%,55%)] to-[hsl(280,70%,50%)]",
  chemistry: "from-[hsl(142,71%,40%)] to-[hsl(160,60%,38%)]",
  biology: "from-[hsl(38,92%,45%)] to-[hsl(25,85%,50%)]",
  "computer-science": "from-[hsl(340,75%,50%)] to-[hsl(0,84%,55%)]",
  economics: "from-[hsl(340,75%,50%)] to-[hsl(360,80%,55%)]",
  "english-literature": "from-[hsl(210,70%,45%)] to-[hsl(230,65%,50%)]",
  psychology: "from-[hsl(30,80%,50%)] to-[hsl(45,75%,45%)]",
  geography: "from-[hsl(160,60%,38%)] to-[hsl(180,50%,35%)]",
  "business-studies": "from-[hsl(270,60%,50%)] to-[hsl(290,55%,45%)]",
  ielts: "from-[hsl(200,80%,45%)] to-[hsl(220,70%,50%)]",
  celta: "from-[hsl(280,70%,50%)] to-[hsl(310,60%,50%)]",
  french: "from-[hsl(220,70%,45%)] to-[hsl(240,60%,50%)]",
  german: "from-[hsl(145,50%,35%)] to-[hsl(160,45%,30%)]",
};

/* ───────────────── Board Logo Chip ───────────────── */

function BoardChip({ board, selected, onClick }: { board: string; selected: boolean; onClick: () => void }) {
  const brand = getBoardBrand(board);
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all duration-200 ${
        selected
          ? "border-primary/30 bg-primary/5 shadow-sm"
          : "border-border/40 bg-card hover:border-primary/20 hover:bg-muted/30"
      }`}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-extrabold text-white shadow-sm"
        style={{ backgroundColor: brand.color }}
      >
        {brand.abbr.slice(0, 3)}
      </div>
      <span className={`text-xs font-semibold transition-colors ${selected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
        {board}
      </span>
      {selected && (
        <Check className="ml-auto h-3.5 w-3.5 text-primary" />
      )}
    </button>
  );
}

/* ───────────────── Filter Panel ───────────────── */

function FilterPanel({
  selectedCountries,
  toggleCountry,
  selectedLevels,
  toggleLevel,
  selectedBoards,
  toggleBoard,
  selectAllBoards,
  clearAllBoards,
  selectedDifficulty,
  setSelectedDifficulty,
  availableBoards,
  activeLevelOptions,
}: {
  selectedCountries: Set<string>;
  toggleCountry: (id: string) => void;
  selectedLevels: Set<string>;
  toggleLevel: (id: string) => void;
  selectedBoards: Set<string>;
  toggleBoard: (board: string) => void;
  selectAllBoards: () => void;
  clearAllBoards: () => void;
  selectedDifficulty: Difficulty | null;
  setSelectedDifficulty: (d: Difficulty | null) => void;
  availableBoards: string[];
  activeLevelOptions: typeof curricula;
}) {
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = useState<string | null>("countries");

  return (
    <div className="space-y-3">
      {/* 1. Country Selection */}
      <div className="overflow-hidden rounded-xl border border-border/40">
        <button
          onClick={() => setExpandedSection(expandedSection === "countries" ? null : "countries")}
          className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/30"
        >
          <Icon3D icon={Globe} variant="primary" size="sm" />
          <span className="flex-1 text-sm font-bold">Country / Region</span>
          {selectedCountries.size > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {selectedCountries.size}
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${expandedSection === "countries" ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {expandedSection === "countries" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border/30"
            >
              <div className="grid grid-cols-2 gap-1.5 p-3">
                {countryGroups.map((group) => {
                  const isSelected = selectedCountries.has(group.id);
                  return (
                    <button
                      key={group.id}
                      onClick={() => toggleCountry(group.id)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                        isSelected
                          ? "bg-primary/10 ring-1 ring-primary/25"
                          : "bg-muted/30 hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-lg leading-none">{group.flag}</span>
                      <span className={`flex-1 text-[11px] font-semibold ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                        {group.label}
                      </span>
                      {isSelected && <Check className="h-3 w-3 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Level / Curriculum */}
      {activeLevelOptions.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border/40">
          <button
            onClick={() => setExpandedSection(expandedSection === "levels" ? null : "levels")}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/30"
          >
          <Icon3D icon={Layers} variant="purple" size="sm" />
            <span className="flex-1 text-sm font-bold">{t("subjects.level")}</span>
            {selectedLevels.size > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {selectedLevels.size}
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${expandedSection === "levels" ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {expandedSection === "levels" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-border/30"
              >
                <div className="flex flex-wrap gap-1.5 p-3">
                  {activeLevelOptions.map((c) => {
                    const isSelected = selectedLevels.has(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleLevel(c.id)}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                            : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 3. Exam Board */}
      {availableBoards.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border/40">
          <button
            onClick={() => setExpandedSection(expandedSection === "boards" ? null : "boards")}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/30"
          >
          <Icon3D icon={Filter} variant="warning" size="sm" />
            <span className="flex-1 text-sm font-bold">{t("subjects.board")}</span>
            {selectedBoards.size > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {selectedBoards.size}
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${expandedSection === "boards" ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {expandedSection === "boards" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-border/30"
              >
                <div className="p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <button onClick={selectAllBoards} className="text-[11px] font-semibold text-primary hover:underline">
                      Select All
                    </button>
                    <button onClick={clearAllBoards} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline">
                      Clear
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {availableBoards.map((board) => (
                      <BoardChip
                        key={board}
                        board={board}
                        selected={selectedBoards.has(board)}
                        onClick={() => toggleBoard(board)}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 4. Difficulty */}
      <div className="overflow-hidden rounded-xl border border-border/40">
        <button
          onClick={() => setExpandedSection(expandedSection === "difficulty" ? null : "difficulty")}
          className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/30"
        >
          <Icon3D icon={Zap} variant="success" size="sm" />
          <span className="flex-1 text-sm font-bold">{t("subjects.difficulty")}</span>
          {selectedDifficulty && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {difficultyLabels[selectedDifficulty]}
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${expandedSection === "difficulty" ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {expandedSection === "difficulty" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border/30"
            >
              <div className="flex flex-wrap gap-1.5 p-3">
                <button
                  onClick={() => setSelectedDifficulty(null)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                    selectedDifficulty === null
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  All
                </button>
                {([1, 2, 3, 4, 5] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDifficulty(d)}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                      selectedDifficulty === d
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                        : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {difficultyLabels[d]}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active selection summary */}
      <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold text-primary">{t("subjects.activeFilters")}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {selectedCountries.size === 0 && (
            <span className="text-[11px] text-muted-foreground">{t("subjects.allCountriesShort")}</span>
          )}
          {[...selectedCountries].map(id => {
            const g = countryGroups.find(c => c.id === id);
            return g ? (
              <span key={id} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {g.flag} {g.label}
                <button onClick={() => toggleCountry(id)} className="ml-0.5 hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
              </span>
            ) : null;
          })}
          {[...selectedBoards].slice(0, 3).map(b => (
            <span key={b} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {b}
              <button onClick={() => toggleBoard(b)} className="ml-0.5 hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
            </span>
          ))}
          {selectedBoards.size > 3 && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              +{selectedBoards.size - 3} more
            </span>
          )}
          {selectedDifficulty && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {difficultyLabels[selectedDifficulty]}
              <button onClick={() => setSelectedDifficulty(null)} className="ml-0.5 hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Main Page ───────────────── */

export default function Subjects() {
  const { t } = useTranslation();
  useDocumentTitle(t("nav.subjects"));
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set(["uk"]));
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set());
  const [selectedBoards, setSelectedBoards] = useState<Set<string>>(new Set());
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const { isEmpty, countFor } = useSubjectCounts();

  // Subjects with real content first; empty ones fall to the end as "coming soon".
  const orderedSubjects = useMemo(
    () => [...subjects].sort((a, b) => Number(isEmpty(a.id)) - Number(isEmpty(b.id))),
    [isEmpty]
  );
  const availableCount = orderedSubjects.filter((s) => !isEmpty(s.id)).length;


  const toggleCountry = (id: string) => {
    setSelectedCountries(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Reset levels and boards when countries change
    setSelectedLevels(new Set());
    setSelectedBoards(new Set());
  };

  // Get curricula for selected countries
  const activeLevelOptions = useMemo(() => {
    if (selectedCountries.size === 0) return curricula;
    const activeKeys = new Set<string>();
    countryGroups
      .filter(g => selectedCountries.has(g.id))
      .forEach(g => g.keys.forEach(k => activeKeys.add(k)));
    return curricula.filter(c => activeKeys.has(c.id));
  }, [selectedCountries]);

  const toggleLevel = (id: string) => {
    setSelectedLevels(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectedBoards(new Set());
  };

  // Boards from selected levels (or all levels if none selected)
  const availableBoards = useMemo(() => {
    const relevantCurricula = selectedLevels.size > 0
      ? activeLevelOptions.filter(c => selectedLevels.has(c.id))
      : activeLevelOptions;
    const boardSet = new Set<string>();
    relevantCurricula.forEach(c => c.boards.forEach(b => boardSet.add(b)));
    return [...boardSet].sort();
  }, [activeLevelOptions, selectedLevels]);

  const toggleBoard = (board: string) => {
    setSelectedBoards(prev => {
      const next = new Set(prev);
      if (next.has(board)) next.delete(board);
      else next.add(board);
      return next;
    });
  };

  const selectAllBoards = () => setSelectedBoards(new Set(availableBoards));
  const clearAllBoards = () => setSelectedBoards(new Set());

  const activeFilterCount = selectedCountries.size + selectedLevels.size + selectedBoards.size + (selectedDifficulty ? 1 : 0);

  // Summary label
  const summaryLabel = useMemo(() => {
    if (selectedCountries.size === 0) return "All curricula";
    const names = [...selectedCountries].map(id => countryGroups.find(g => g.id === id)?.label).filter(Boolean);
    return names.join(", ");
  }, [selectedCountries]);

  const filterProps = {
    selectedCountries, toggleCountry,
    selectedLevels, toggleLevel,
    selectedBoards, toggleBoard,
    selectAllBoards, clearAllBoards,
    selectedDifficulty, setSelectedDifficulty,
    availableBoards, activeLevelOptions,
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <PageTransition>
        <main className="container mx-auto max-w-7xl px-4 py-6 pb-28 md:py-12">
          {/* Hero banner */}
          <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-[hsl(258,60%,52%)] px-5 py-6 text-primary-foreground md:mb-10 md:rounded-3xl md:px-12 md:py-14">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm md:h-8 md:w-8 md:rounded-xl">
                  <GraduationCap className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80 md:text-xs">{t("subjects.studyCentre")}</span>
              </div>
              <h1 className="mb-1 text-2xl font-extrabold tracking-tight md:mb-2 md:text-4xl">
                {t("subjects.chooseHeading")}
              </h1>
              <p className="max-w-lg text-xs leading-relaxed opacity-75 md:text-base">
                {t("subjects.chooseSub")}
              </p>
            </div>
          </div>

          {/* Mobile: Sticky filter bar */}
          <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
            <div>
              <h2 className="text-base font-bold tracking-tight">{availableCount} {t("subjects.subjectsHeading")}</h2>
              <p className="text-[11px] text-muted-foreground">{summaryLabel}</p>
            </div>
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <button className="relative flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition-colors active:bg-muted">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                  {t("subjects.filters")}
                  {activeFilterCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-safe-area-bottom">
                <SheetHeader className="pb-2">
                  <SheetTitle className="text-base">{t("subjects.filters")}</SheetTitle>
                </SheetHeader>
                <div className="pb-6">
                  <FilterPanel {...filterProps} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            {/* Desktop sidebar filters */}
            {!isMobile && (
              <aside className="hidden md:block">
                <div className="sticky top-20 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                  <FilterPanel {...filterProps} />
                </div>
              </aside>
            )}

            {/* Subject grid */}
            <div>
              <div className="mb-5 hidden items-center justify-between md:flex">
                <div>
                  <h2 className="text-lg font-bold tracking-tight md:text-xl">{t("subjects.subjectsHeading")}</h2>
                  <p className="text-xs text-muted-foreground">{t("subjects.subjectsAvailable", { count: availableCount })} · {summaryLabel}</p>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 md:gap-4">
                {orderedSubjects.map((subject, i) => {
                  const empty = isEmpty(subject.id);
                  const liveCount = countFor(subject.id, subject.questionCount);
                  return (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <button
                      onClick={() => !empty && navigate(`/practice/${subject.id}`)}
                      disabled={empty}
                      aria-disabled={empty}
                      className={`group relative w-full overflow-hidden rounded-2xl border border-border/50 bg-card text-left shadow-sm transition-all duration-300 ${empty ? "cursor-not-allowed opacity-60" : "hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/25 active:scale-[0.98]"}`}
                    >
                      {/* Gradient accent bar */}
                      <div className={`h-1 w-full bg-gradient-to-r md:h-1.5 ${subjectGradients[subject.id] || "from-primary to-primary/70"}`} />

                      <div className="flex items-center gap-4 p-4 md:block md:p-6">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br md:mb-5 md:h-12 md:w-12 md:rounded-2xl ${subjectGradients[subject.id] || "from-primary to-primary/70"} text-base font-bold text-white shadow-md md:text-lg md:shadow-lg overflow-hidden`}>
                          {subject.mascotImage ? (
                            <img src={subject.mascotImage} alt={`${subject.name} mascot`} className="h-full w-full object-cover" />
                          ) : (
                            subject.icon
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between md:mb-1">
                            <h3 className="text-sm font-bold tracking-tight md:text-base lg:text-lg">{subject.name}</h3>
                            {empty ? (
                              <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("subjects.comingSoon")}
                              </span>
                            ) : (
                              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary md:hidden" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground md:mb-3 md:text-xs">
                            <BookOpen className="h-3 w-3" />
                            {empty ? t("subjects.contentInProgress") : `${liveCount.toLocaleString()} ${t("subjects.qs")}`}
                            <span className="h-2.5 w-px bg-border" />
                            {subject.topics.length} {t("subjects.topics")}
                          </div>


                          {/* Mascot tip - desktop only */}
                          {(() => {
                            const mascot = getMascot(subject.id);
                            return mascot.tips?.[0] ? (
                              <div className="hidden md:flex items-start gap-2 rounded-lg bg-primary/5 px-2.5 py-2 mb-3">
                                <img src={mascot.image} alt={mascot.name} className="h-5 w-5 rounded-full object-cover mt-0.5 shrink-0" />
                                <p className="text-[10px] leading-relaxed text-primary font-medium">{mascot.tips[0]}</p>
                              </div>
                            ) : null;
                          })()}

                          {/* Topic pills - desktop only */}
                          <div className="hidden flex-wrap gap-1.5 md:flex">
                            {subject.topics.slice(0, 3).map((topic) => (
                              <span
                                key={topic}
                                className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors group-hover:bg-primary/5 group-hover:text-primary/80"
                              >
                                {topic}
                              </span>
                            ))}
                            {subject.topics.length > 3 && (
                              <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                +{subject.topics.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Desktop arrow */}
                        <div className="hidden md:flex absolute top-5 right-5 h-8 w-8 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all group-hover:bg-primary/10 group-hover:text-primary">
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>

                      {/* Hover glow */}
                      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 ring-1 ring-inset ring-primary/10" />
                    </button>
                  </motion.div>
                  );
                })}


              </div>
            </div>
          </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}
