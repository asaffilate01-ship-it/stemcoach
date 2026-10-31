import { describe, expect, it } from "vitest";
import {
  practiceOptionShortcutIndex,
  shouldIgnorePracticeShortcut,
  togglePracticeSelection,
} from "@/lib/practiceKeyboard";

function keyboard(target: HTMLElement, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe("practice keyboard shortcuts", () => {
  it("does not hijack keys from text inputs, numeric inputs, textareas or selects", () => {
    for (const element of [
      document.createElement("input"),
      document.createElement("textarea"),
      document.createElement("select"),
    ]) {
      const event = keyboard(element, "1");
      expect(shouldIgnorePracticeShortcut(event)).toBe(true);
    }
    const number = document.createElement("input");
    number.type = "number";
    expect(shouldIgnorePracticeShortcut(keyboard(number, "Enter"))).toBe(true);
  });

  it("leaves interactive controls and rich-text editors alone", () => {
    const button = document.createElement("button");
    const inner = document.createElement("span");
    button.append(inner);
    expect(shouldIgnorePracticeShortcut(keyboard(inner, "Enter"))).toBe(true);
    const link = document.createElement("a");
    expect(shouldIgnorePracticeShortcut(keyboard(link, "n"))).toBe(true);
    const editor = document.createElement("div");
    editor.setAttribute("contenteditable", "true");
    const child = document.createElement("span");
    editor.append(child);
    expect(shouldIgnorePracticeShortcut(keyboard(child, "1"))).toBe(true);
  });

  it("does not interfere with modified or composed keys", () => {
    const panel = document.createElement("div");
    expect(shouldIgnorePracticeShortcut(keyboard(panel, "1", { ctrlKey: true }))).toBe(true);
    expect(shouldIgnorePracticeShortcut(keyboard(panel, "1", { metaKey: true }))).toBe(true);
    expect(shouldIgnorePracticeShortcut(keyboard(panel, "1", { altKey: true }))).toBe(true);
    expect(shouldIgnorePracticeShortcut(keyboard(panel, "1", { isComposing: true }))).toBe(true);
    expect(shouldIgnorePracticeShortcut(keyboard(panel, "1"))).toBe(false);
  });

  it("only maps valid numbered options to a zero-based index", () => {
    expect(practiceOptionShortcutIndex("1", 4)).toBe(0);
    expect(practiceOptionShortcutIndex("4", 4)).toBe(3);
    expect(practiceOptionShortcutIndex("5", 4)).toBeNull();
    expect(practiceOptionShortcutIndex("0", 4)).toBeNull();
    expect(practiceOptionShortcutIndex("1e2", 4)).toBeNull();
    expect(practiceOptionShortcutIndex("Enter", 4)).toBeNull();
  });

  it("toggles multi-select choices without mutating the previous answer", () => {
    const original = new Set(["A"]);
    const added = togglePracticeSelection(original, "B");
    expect([...added]).toEqual(["A", "B"]);
    const removed = togglePracticeSelection(added, "A");
    expect([...removed]).toEqual(["B"]);
    expect([...original]).toEqual(["A"]);
  });
});
