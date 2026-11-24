/** Planning targets only: never use as a published inventory counter. */
export const marketProgramme = [
  { country: "PK", target: 400000, stages: ["Grade 5–8", "SSC 9–10", "HSSC 11–12", "Years 13–14 / institution-specific"], regions: ["Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Islamabad Capital Territory", "Azad Jammu and Kashmir", "Gilgit-Baltistan"], languages: ["arabic", "urdu", "turkish", "welsh"] },
  { country: "GB", target: 350000, stages: ["Secondary / Year 7 equivalent", "GCSE / National qualifications", "A level / Highers", "Higher education through bachelor's"], regions: ["England", "Wales", "Scotland", "Northern Ireland"], languages: ["welsh"] },
  { country: "DE", target: 250000, stages: ["Age 11+ Sekundarstufe I", "Sekundarstufe II / Abitur", "Vocational", "Bachelor", "Master"], regions: ["Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen", "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen"], languages: [] },
] as const;

export const coreSubjectTracks = ["mathematics", "biology", "chemistry", "physics", "english-language", "ielts", "german", "german-visa-preparation", "artificial-intelligence", "coding", "cyber-security", "cloud-computing", "commerce", "accounting", "business-studies", "economics"] as const;
export const questionTarget = marketProgramme.reduce((sum, market) => sum + market.target, 0);
