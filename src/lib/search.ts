// Pure, dependency-free filtering for the dashboard backlog. Layered *before*
// the existing type-tab grouping in src/app/page.tsx, so it composes with
// sortItems/TYPE_ORDER without touching them.

import { Item } from "./types";

export interface ItemFilter {
  /** Free-text, case-insensitive substring over title + person + source. */
  query?: string;
  /** Exact-match on person, when set. */
  person?: string | null;
  /** Exact-match on source, when set. */
  source?: string | null;
}

/** True when no filter is active (search box empty, no chips selected). */
export function isFilterActive(f: ItemFilter): boolean {
  return Boolean(f.query?.trim() || f.person || f.source);
}

/** Apply the dashboard search box + person/source chips to a list of items. */
export function filterItems(items: Item[], f: ItemFilter): Item[] {
  const q = f.query?.trim().toLowerCase() ?? "";
  if (!q && !f.person && !f.source) return items;

  return items.filter((i) => {
    if (f.person && i.person !== f.person) return false;
    if (f.source && i.source !== f.source) return false;
    if (q) {
      const hay = `${i.title} ${i.person ?? ""} ${i.source}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Unique, sorted list of a string field present on the items (for filter chips). */
export function distinctValues(
  items: Item[],
  pick: (i: Item) => string | undefined,
): string[] {
  const set = new Set<string>();
  for (const i of items) {
    const v = pick(i);
    if (v) set.add(v);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
