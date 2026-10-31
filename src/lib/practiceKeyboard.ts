/**
 * Practice keyboard shortcuts are an optional convenience; they must never
 * steal keys from editable fields, links, buttons or modal controls.
 */
const INTERACTIVE_SELECTOR =
  'input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="textbox"], [role="searchbox"], [role="combobox"], [role="spinbutton"], [role="menu"], [role="dialog"], [role="option"], [data-practice-shortcuts="off"]';

export function shouldIgnorePracticeShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) {
    return true;
  }

  const target = event.target;
  // SSR-safe: this helper can be imported by tests and by server-rendered pages.
  if (typeof Element === "undefined" || !(target instanceof Element)) return false;
  return Boolean(target.closest(INTERACTIVE_SELECTOR));
}

export function practiceOptionShortcutIndex(key: string, optionCount: number): number | null {
  // 1–9 only; never partially parse special keys or multi-character input.
  if (!/^[1-9]$/.test(key)) return null;
  const index = Number(key) - 1;
  return index < optionCount ? index : null;
}

export function togglePracticeSelection(current: ReadonlySet<string>, option: string): Set<string> {
  const next = new Set(current);
  if (next.has(option)) next.delete(option);
  else next.add(option);
  return next;
}
