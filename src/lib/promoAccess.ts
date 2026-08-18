const STORAGE_KEY = "stemcoach_preview_access";

/** Promo/demo access code. Change this to rotate access for reviewers. */
export const PREVIEW_ACCESS_CODE = "STEMCOACH2026";

export function isPreviewUnlocked(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === PREVIEW_ACCESS_CODE;
  } catch {
    return false;
  }
}

export function unlockPreview(code: string): boolean {
  const ok = code.trim().toUpperCase() === PREVIEW_ACCESS_CODE;
  if (ok) {
    try {
      localStorage.setItem(STORAGE_KEY, PREVIEW_ACCESS_CODE);
    } catch {
      /* storage unavailable */
    }
  }
  return ok;
}

export function lockPreview() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
