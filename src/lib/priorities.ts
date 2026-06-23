// Pure selectors + suggestion ranking for the daily "Today's priorities" ritual.
// Reuses dueState/ageInDays/compareItems from ordering.ts.

import { Item } from "./types";
import { ageInDays, compareItems, dueState } from "./ordering";
import { todayKey } from "./day";

/** Items slotted for today (and not discarded). */
export function todaysPriorities(items: Item[], today = todayKey()): Item[] {
  return items.filter(
    (i) => i.priorityDate === today && i.status !== "discarded",
  );
}

/**
 * Yesterday's priorities = the items from the *most recent prior day that had
 * any priorities* (not literally today-1, so multi-day gaps are handled),
 * excluding ones already completed or discarded.
 */
export function yesterdaysPriorities(items: Item[], today = todayKey()): Item[] {
  let maxPrior: string | null = null;
  for (const i of items) {
    const p = i.priorityDate ?? null;
    if (p && p < today && (maxPrior === null || p > maxPrior)) maxPrior = p;
  }
  if (!maxPrior) return [];
  return items.filter(
    (i) =>
      i.priorityDate === maxPrior &&
      i.status !== "done" &&
      i.status !== "discarded",
  );
}

/**
 * Rules-based suggestions to seed the confirm screen: overdue -> due-soon ->
 * pinned -> oldest carried-over. Only considers kept items not already today's.
 * This is the seam where live Granola/Slack/AI later replaces the heuristic.
 */
export function suggestPriorities(
  items: Item[],
  max = 4,
  today = todayKey(),
): Item[] {
  const bucket = (i: Item): number => {
    const ds = dueState(i);
    if (ds === "overdue") return 0;
    if (ds === "soon") return 1;
    if (i.pinned) return 2;
    return 3;
  };

  return items
    .filter((i) => i.status === "kept" && i.priorityDate !== today)
    .sort((a, b) => {
      const ba = bucket(a);
      const bb = bucket(b);
      if (ba !== bb) return ba - bb;
      const ageDiff = ageInDays(b) - ageInDays(a); // oldest first within a bucket
      if (ageDiff !== 0) return ageDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })
    .slice(0, max);
}

/** Order the Today list: manual priorityRank first, then the dashboard's default. */
export function sortPriorities(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    const ar = a.priorityRank ?? null;
    const br = b.priorityRank ?? null;
    if (ar !== null && br !== null) return ar - br;
    if (ar !== null) return -1;
    if (br !== null) return 1;
    return compareItems(a, b);
  });
}
