import { curricula, subjects } from "@/data/questions";
import { mockExamTemplates } from "@/data/mockExamTemplates";

// Public discovery only. Keep historic IDs and data intact.
const international = ["uk-igcse", "uk-ial", "uk-olevel", "ib-myp", "ib-dp-sl", "ib-dp-hl"];
const languageQualifications = ["ielts-academic", "ielts-general", "celta"];
export const launchCountryGroups = [
  { id: "uk", label: "United Kingdom", flag: "🇬🇧", range: "Year 7 to Level 6", keys: ["uk-gcse", "uk-alevel", "uk-btec", "uk-scottish-nat5", "uk-scottish-higher", "uk-scottish-adv-higher", "uni-uk", ...international, ...languageQualifications] },
  { id: "de", label: "Germany", flag: "🇩🇪", range: "Age 11 to master's", keys: ["de-mittlerer", "de-oberstufe", "de-abitur", "de-fachabitur", "de-berufliches-gym", "uni-de", ...international, ...languageQualifications] },
  { id: "pk", label: "Pakistan", flag: "🇵🇰", range: "Grades 5–14", keys: ["pakistan-matric", "pakistan-fsc", "pakistan-olevel", "pakistan-alevel", "pakistan-ecat-mdcat", "uni-pk", ...international, ...languageQualifications] },
];
const curriculumIds = new Set(launchCountryGroups.flatMap(market => market.keys));
const subjectIds = new Set(["mathematics", "physics", "chemistry", "biology", "computer-science", "economics", "english-literature", "psychology", "geography", "business-studies", "ielts", "celta", "german", "arabic", "english-language", "urdu", "welsh"]);
export const isLaunchCurriculum = (id: string) => curriculumIds.has(id);
export const isLaunchSubject = (id: string) => subjectIds.has(id);
export const launchCurricula = curricula.filter(item => isLaunchCurriculum(item.id));
export const launchSubjects = subjects.filter(item => isLaunchSubject(item.id));
export const launchExamTemplates = mockExamTemplates.filter(item => isLaunchCurriculum(item.curriculum) && isLaunchSubject(item.subject));
export const launchStudyLanguages = [
  { id: "english", name: "English", native: "English", subject: "ielts", available: true },
  { id: "german", name: "German", native: "Deutsch", subject: "german", available: true },
  { id: "arabic", name: "Arabic", native: "العربية", subject: "arabic", available: true },
  { id: "urdu", name: "Urdu", native: "اردو", subject: "urdu", available: false },
  { id: "welsh", name: "Welsh", native: "Cymraeg", subject: "welsh", available: false },
] as const;
