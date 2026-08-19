export const CONSENT_KEY = "stemcoach_cookie_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_EVENT = "stemcoach:cookie-consent";
export const CONSENT_OPEN_EVENT = "stemcoach:cookie-consent-open";

export interface CookiePrefs {
  essential: true;
  functional: boolean;
  analytics: boolean;
  version: number;
  updatedAt: string;
}

export const defaultPrefs: CookiePrefs = {
  essential: true,
  functional: false,
  analytics: false,
  version: CONSENT_VERSION,
  updatedAt: "",
};

/** Stored consent, or null if the user has not decided yet (or the policy version changed). */
export function getConsent(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookiePrefs>;
    if (parsed.version !== CONSENT_VERSION) return null;
    return {
      essential: true,
      functional: !!parsed.functional,
      analytics: !!parsed.analytics,
      version: CONSENT_VERSION,
      updatedAt: parsed.updatedAt || "",
    };
  } catch {
    return null;
  }
}

export function saveConsent(prefs: { functional: boolean; analytics: boolean }): CookiePrefs {
  const value: CookiePrefs = {
    essential: true,
    functional: prefs.functional,
    analytics: prefs.analytics,
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  } catch {
    /* storage blocked — consent applies to this session only */
  }
  applyConsent(value);
  window.dispatchEvent(new CustomEvent<CookiePrefs>(CONSENT_EVENT, { detail: value }));
  return value;
}

export function hasConsent(category: "functional" | "analytics"): boolean {
  const c = getConsent();
  return !!c && !!c[category];
}

/** Reopen the preferences banner from anywhere (footer link, settings, etc.). */
export function openCookieSettings() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

/** Non-essential client storage we own, cleared when consent is withdrawn. */
const FUNCTIONAL_KEYS = ["stemcoach_subject_counts", "theme", "i18nextLng"];
const ANALYTICS_KEY_PREFIX = "stemcoach_analytics_";

/** Enforce the stored choice: purge storage for categories the user declined. */
export function applyConsent(prefs: CookiePrefs | null) {
  if (!prefs) return;
  try {
    if (!prefs.functional) {
      FUNCTIONAL_KEYS.forEach((k) => localStorage.removeItem(k));
    }
    if (!prefs.analytics) {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(ANALYTICS_KEY_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    }
  } catch {
    /* ignore */
  }
  // Signal downstream consumers (e.g. future analytics tags) about the current state.
  (window as unknown as { __stemcoachConsent?: CookiePrefs }).__stemcoachConsent = prefs;
}

/** Call once on app boot so a previously stored choice is enforced. */
export function initConsent() {
  applyConsent(getConsent());
}
