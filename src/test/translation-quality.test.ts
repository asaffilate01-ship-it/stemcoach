import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import en from "@/i18n/locales/en";
import fr from "@/i18n/locales/fr";
import de from "@/i18n/locales/de";
import { normalizeLanguage } from "@/i18n/language";

function flatten(value: Record<string, unknown>, prefix = "", result: Record<string, string> = {}) {
  for (const [key, entry] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (entry && typeof entry === "object") flatten(entry as Record<string, unknown>, path, result);
    else result[path] = String(entry);
  }
  return result;
}

function placeholders(value: string) {
  return [...value.matchAll(/{{\s*([^},\s]+)[^}]*}}/g)].map((match) => match[1]).sort();
}

const locales = { en: flatten(en), fr: flatten(fr), de: flatten(de) };

describe("translation quality", () => {
  it("keeps every locale structurally complete with matching interpolation variables", () => {
    const englishKeys = Object.keys(locales.en).sort();
    for (const locale of [locales.fr, locales.de]) {
      expect(Object.keys(locale).sort()).toEqual(englishKeys);
      for (const key of englishKeys) {
        expect(locale[key].trim(), `${key} must not be empty`).not.toBe("");
        expect(placeholders(locale[key]), `${key} placeholders must match English`).toEqual(placeholders(locales.en[key]));
      }
    }
  });

  it("defines every static translation key used by the application", () => {
    const root = resolve(process.cwd(), "src");
    const files = execFileSync("rg", ["--files", root, "-g", "*.ts", "-g", "*.tsx", "-g", "!i18n/locales/**", "-g", "!test/**"], { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
    const used = new Set<string>();
    const keyPattern = /\b(?:t|tr)\(\s*["'`]([^"'`$]+)["'`]/g;
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(keyPattern)) used.add(match[1]);
    }
    expect([...used].filter((key) => !(key in locales.en)).sort()).toEqual([]);
  });

  it("normalises browser regional language codes to supported translations", () => {
    expect(normalizeLanguage("fr-FR")).toBe("fr");
    expect(normalizeLanguage("de_DE")).toBe("de");
    expect(normalizeLanguage("en-GB")).toBe("en");
    expect(normalizeLanguage("es-ES")).toBe("en");
  });

  it("does not silently leave critical learner journeys in English", () => {
    for (const key of ["auth.createAccount", "support.formTitle", "cookies.acceptAll", "coach.premiumTitle", "tutorials.title"]) {
      expect(locales.fr[key]).not.toBe(locales.en[key]);
      expect(locales.de[key]).not.toBe(locales.en[key]);
    }
  });

  it("persists only supported signed-in language preferences", () => {
    const migration = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20260830143000_persistent_language_preference.sql"),
      "utf8",
    );
    const header = readFileSync(resolve(process.cwd(), "src/components/layout/AppHeader.tsx"), "utf8");

    expect(migration).toContain("preferred_language IN ('en', 'fr', 'de')");
    expect(header).toContain('preferred_language: language');
  });
});
