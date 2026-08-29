const STORAGE_KEY = "stemcoach_preview_access";

/** Cosmetic preview gate only. It is not an authentication boundary. */
export const PREVIEW_ACCESS_CODE = import.meta.env.VITE_PREVIEW_ACCESS_CODE || "";

export function isPreviewUnlocked(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === PREVIEW_ACCESS_CODE;
  } catch {
    return false;
  }
}

export function unlockPreview(code: string): boolean {
  const ok = Boolean(PREVIEW_ACCESS_CODE) && code.trim().toUpperCase() === PREVIEW_ACCESS_CODE.toUpperCase();
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
