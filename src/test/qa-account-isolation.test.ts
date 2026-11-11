import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  QA_HISTORY_KEY, QA_BOOKMARKS_KEY, qaScopedStorageKeys,
  parseReviewHistory, parseBookmarks, recordReviewAttempt,
  serialiseReviewHistory, serialiseBookmarks,
} from "@/lib/qaPractice";

const ids = new Set(["lesson-one-0", "lesson-two-0"]);

describe("shared browser: per-learner Q&A practice isolation", () => {
  it("provides separate keys for guest, each signed-in learner and each storage type", () => {
    const guest = qaScopedStorageKeys(null);
    const alice = qaScopedStorageKeys("learner-alice");
    const bob = qaScopedStorageKeys("learner-bob");
    expect(guest.history).not.toBe(alice.history);
    expect(alice.history).not.toBe(bob.history);
    expect(alice.bookmarks).not.toBe(bob.bookmarks);
    expect(alice.history).not.toBe(alice.bookmarks);
    expect(guest.history).not.toBe(QA_HISTORY_KEY);
    expect(guest.bookmarks).not.toBe(QA_BOOKMARKS_KEY);
    expect(qaScopedStorageKeys("learner-alice")).toEqual(alice);
    expect(qaScopedStorageKeys("learner-alice:2").history).not.toBe(alice.history);
  });

  it("keeps first-attempt evidence and bookmarks independent for separate profiles", () => {
    const store = new Map<string, string>();
    const alice = qaScopedStorageKeys("learner-alice");
    const bob = qaScopedStorageKeys("learner-bob");
    const guest = qaScopedStorageKeys(null);
    const now = Date.UTC(2026, 10, 11, 14, 0);
    const progress = recordReviewAttempt({}, "lesson-one-0", false, true, now);
    store.set(alice.history, serialiseReviewHistory(progress));
    store.set(alice.bookmarks, serialiseBookmarks(["lesson-one-0"]));
    expect(parseReviewHistory(store.get(alice.history) || null, ids)).toEqual(progress);
    expect(parseBookmarks(store.get(alice.bookmarks) || null, ids)).toEqual(["lesson-one-0"]);
    for (const profile of [bob, guest]) {
      expect(parseReviewHistory(store.get(profile.history) || null, ids)).toEqual({});
      expect(parseBookmarks(store.get(profile.bookmarks) || null, ids)).toEqual([]);
    }
  });

  it("never migrates unattributable shared-device legacy history to another account", () => {
    const old = new Map<string, string>([
      [QA_HISTORY_KEY, serialiseReviewHistory(recordReviewAttempt({}, "lesson-two-0", true, true, Date.now()))],
      [QA_BOOKMARKS_KEY, serialiseBookmarks(["lesson-two-0"])],
    ]);
    const alice = qaScopedStorageKeys("learner-alice");
    const guest = qaScopedStorageKeys(null);
    expect(old.has(alice.history)).toBe(false);
    expect(old.has(guest.bookmarks)).toBe(false);
    const page = readFileSync(resolve(process.cwd(), "src/pages/QAClinic.tsx"), "utf8");
    expect(page).toContain("qaScopedStorageKeys(ownerId)");
    expect(page).toContain('key={ownerId ? "account:" + ownerId : "guest"}');
    expect(page).toContain("localStorage.getItem(historyKey)");
    expect(page).toContain("localStorage.getItem(bookmarksKey)");
    expect(page).not.toContain("localStorage.getItem(QA_HISTORY_KEY)");
    expect(page).not.toContain("localStorage.getItem(QA_BOOKMARKS_KEY)");
  });
});
