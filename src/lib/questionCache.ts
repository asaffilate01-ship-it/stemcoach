/**
 * IndexedDB-based question cache for offline PWA support.
 * Caches questions per subject so students can practice without internet.
 */

const DB_NAME = "stemcoach-offline";
const DB_VERSION = 1;
const STORE_NAME = "questions";
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "subject" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface CachedQuestionSet {
  subject: string;
  questions: any[];
  cachedAt: number;
}

export async function getCachedQuestions(subject: string): Promise<any[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(subject);
      req.onsuccess = () => {
        const result = req.result as CachedQuestionSet | undefined;
        if (result && Date.now() - result.cachedAt < CACHE_TTL) {
          resolve(result.questions);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function cacheQuestions(subject: string, questions: any[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ subject, questions, cachedAt: Date.now() } satisfies CachedQuestionSet);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silent fail — caching is best-effort
  }
}
