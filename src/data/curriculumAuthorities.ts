export interface CurriculumAuthority {
  region: string;
  authority: string;
  sourceUrl: string;
  scopeNote: string;
  reviewedAt: string;
}

/**
 * Provenance for curriculum labels shown by STEMCoach. These sources verify the
 * framework/qualification names; individual questions still require a named
 * specification version and human review before publication.
 */
export const curriculumAuthorities: CurriculumAuthority[] = [
  { region: "UK", authority: "Ofqual", sourceUrl: "https://www.gov.uk/government/publications/ofqual-guide-for-schools-and-colleges-2026/ofqual-guide-for-schools-and-colleges-2026", scopeNote: "Regulated qualifications and awarding organisations in England", reviewedAt: "2026-08-29" },
  { region: "International Baccalaureate", authority: "International Baccalaureate", sourceUrl: "https://ibo.org/programmes/diploma-programme/curriculum/", scopeNote: "MYP and Diploma Programme framework; subject guides must be versioned separately", reviewedAt: "2026-08-29" },
  { region: "United States", authority: "College Board", sourceUrl: "https://satsuite.collegeboard.org/sat/whats-on-the-test", scopeNote: "Digital SAT and AP programme labels; state standards remain jurisdiction-specific", reviewedAt: "2026-08-29" },
  { region: "Australia", authority: "Australian Curriculum, Assessment and Reporting Authority", sourceUrl: "https://www.australiancurriculum.edu.au/", scopeNote: "National curriculum plus separately listed state and territory senior certificates", reviewedAt: "2026-08-29" },
  { region: "New Zealand", authority: "NZQA", sourceUrl: "https://www2.nzqa.govt.nz/ncea/about-ncea/ncea-levels-and-certificates/", scopeNote: "NCEA Levels 1–3 and New Zealand Scholarship", reviewedAt: "2026-08-29" },
  { region: "Canada", authority: "Provincial and territorial ministries", sourceUrl: "https://www.canada.ca/en/canadian-heritage/services/official-languages-bilingualism/agreements/protocol.html", scopeNote: "Education is provincial/territorial; no single Canadian national school syllabus", reviewedAt: "2026-08-29" },
  { region: "India", authority: "CBSE Academic and National Testing Agency", sourceUrl: "https://cbseacademic.nic.in/curriculum_2027.html", scopeNote: "CBSE 2026–27; JEE/NEET specifications must follow their current examination bulletins", reviewedAt: "2026-08-29" },
  { region: "Pakistan", authority: "FBISE", sourceUrl: "https://mail.fbise.edu.pk/curriculum_model_paper.php", scopeNote: "Federal SLO curricula and model papers; provincial boards remain separately governed", reviewedAt: "2026-08-29" },
  { region: "Bangladesh", authority: "National Curriculum and Textbook Board", sourceUrl: "https://nctb.gov.bd/", scopeNote: "National curriculum and textbook authority; examination boards administer SSC and HSC examinations", reviewedAt: "2026-08-29" },
  { region: "Sri Lanka", authority: "National Institute of Education", sourceUrl: "https://nie.lk/selesyll", scopeNote: "Official syllabus and teacher-guide catalogue", reviewedAt: "2026-08-29" },
  { region: "UAE", authority: "UAE Ministry of Education", sourceUrl: "https://www.moe.gov.ae/En/ImportantLinks/Pages/Curriculum.aspx", scopeNote: "MoE curriculum; EmSAT Achieve is labelled legacy because the Grade 12 requirement ended in 2024", reviewedAt: "2026-08-29" },
  { region: "France", authority: "Ministère de l'Éducation nationale", sourceUrl: "https://www.education.gouv.fr/reussir-au-lycee/les-programmes-du-lycee-general-et-technologique-9812", scopeNote: "Official lycée programmes; higher-education programmes require programme-specific review", reviewedAt: "2026-08-29" },
  { region: "Germany", authority: "Kultusministerkonferenz", sourceUrl: "https://www.kmk.org/bildungsministerkonferenz/bildungsthemen/bildungsstandards.html", scopeNote: "KMK standards; Abitur details and duration vary by Land", reviewedAt: "2026-08-29" },
  { region: "Philippines", authority: "Department of Education", sourceUrl: "https://www.deped.gov.ph/k-to-12/about/k-to-12-basic-education-curriculum/", scopeNote: "K–12 and Senior High School strands", reviewedAt: "2026-08-29" },
];
