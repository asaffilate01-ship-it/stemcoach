export const SUPPORTED_LANGUAGES = ["en", "fr", "de"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function normalizeLanguage(value?: string | null): SupportedLanguage {
  const base = (value || "en").trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(base as SupportedLanguage)
    ? (base as SupportedLanguage)
    : "en";
}

export function applyDocumentLanguage(value?: string | null) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = normalizeLanguage(value);
  document.documentElement.dir = "ltr";
}
