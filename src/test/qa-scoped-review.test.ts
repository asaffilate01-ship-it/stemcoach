import { describe, expect, it } from "vitest";
import { QA_HISTORY_KEY, QA_BOOKMARKS_KEY, parseReviewHistory, parseBookmarks, recordReviewAttempt, serialiseBookmarks, serialiseReviewHistory } from "@/lib/qaPractice";
import { qaStorageKeys, getReviewFocusCounts, matchesReviewFocus, REVIEW_FOCUSES } from "@/lib/qaReviewFocus";

const entries = ["a", "b", "c", "d"].map(id => ({ id, subject: "maths", topic: "example", format: "single" }));

describe("scoped revision and quick-review focus", () => {
  it("separates guest, account identities, and legacy shared storage", () => {
    const guest = qaStorageKeys(null);
    const alice = qaStorageKeys("user-a");
    const bob = qaStorageKeys("user-b");
    expect(new Set([guest.history, alice.history, bob.history, QA_HISTORY_KEY]).size).toBe(4);
    expect(new Set([guest.bookmarks, alice.bookmarks, bob.bookmarks, QA_BOOKMARKS_KEY]).size).toBe(4);
    expect(qaStorageKeys("guest")).not.toEqual(guest);
    expect(qaStorageKeys("a:b")).not.toEqual(qaStorageKeys("a%3Ab"));
    expect(qaStorageKeys("user-a")).toEqual(alice);
    const storage = new Map<string, string>();
    const valid = new Set(entries.map(x => x.id));
    storage.set(QA_BOOKMARKS_KEY, serialiseBookmarks(["c"]));
    storage.set(alice.bookmarks, serialiseBookmarks(["a"]));
    storage.set(alice.history, serialiseReviewHistory(recordReviewAttempt({}, "a", false, true, 1000)));
    expect(parseBookmarks(storage.get(alice.bookmarks) ?? null, valid)).toEqual(["a"]);
    expect(parseBookmarks(storage.get(bob.bookmarks) ?? null, valid)).toEqual([]);
    expect(parseBookmarks(storage.get(guest.bookmarks) ?? null, valid)).toEqual([]);
    expect(parseReviewHistory(storage.get(alice.history) ?? null, valid).a.attempts).toBe(1);
    expect(parseReviewHistory(storage.get(bob.history) ?? null, valid)).toEqual({});
    expect(parseReviewHistory(storage.get(guest.history) ?? null, valid)).toEqual({});
  });
  it("counts scoped entries once, including overlapping review categories", () => {
    const now = 2000;
    let history = recordReviewAttempt({}, "a", false, true, now);
    history = recordReviewAttempt(history, "b", true, true, now);
    history = recordReviewAttempt(history, "outside", false, true, now);
    const context = { history, saved: new Set(["a", "c", "outside"]), now };
    expect(getReviewFocusCounts([...entries, entries[0]], context)).toEqual({ all: 4, due: 1, missed: 1, saved: 2, new: 2 });
    for (const focus of REVIEW_FOCUSES) {
      expect(getReviewFocusCounts(entries, context)[focus]).toBe(entries.filter(entry => matchesReviewFocus(entry.id, focus, context)).length);
    }
    expect(entries.filter(entry => matchesReviewFocus(entry.id, "new", context)).map(x => x.id)).toEqual(["c", "d"]);
    expect(getReviewFocusCounts([], context)).toEqual({ all: 0, due: 0, missed: 0, saved: 0, new: 0 });
  });
  it("uses the exact due boundary and does not count inherited history rows", () => {
    const history = recordReviewAttempt({}, "a", true, true, 1000);
    const context = { history, saved: new Set<string>(), now: history.a.dueAt - 1 };
    expect(matchesReviewFocus("a", "due", context)).toBe(false);
    expect(matchesReviewFocus("a", "due", { ...context, now: history.a.dueAt })).toBe(true);
    const inherited = Object.create({ a: history.a });
    expect(matchesReviewFocus("a", "new", { ...context, history: inherited })).toBe(true);
  });
});
