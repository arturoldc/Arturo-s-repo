import { Item } from "./types";

// Sort order within a tab:
//   1. items with a manual rank (sortRank != null), ascending  -> your drag order
//   2. everything else by age, oldest first                    -> nothing rots at the bottom
// Super-likes simply get a very-low rank on creation, so they land on top.
export function compareItems(a: Item, b: Item): number {
  const aRanked = a.sortRank !== null;
  const bRanked = b.sortRank !== null;

  if (aRanked && bRanked) return a.sortRank! - b.sortRank!;
  if (aRanked) return -1;
  if (bRanked) return 1;

  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export function sortItems(items: Item[]): Item[] {
  return [...items].sort(compareItems);
}

// Given the new visual order of ids, hand back { id -> rank }.
export function ranksFromOrder(orderedIds: string[]): Record<string, number> {
  const ranks: Record<string, number> = {};
  orderedIds.forEach((id, i) => {
    ranks[id] = i;
  });
  return ranks;
}

// Days since creation (>= 0).
export function ageInDays(item: Item): number {
  const ms = Date.now() - new Date(item.createdAt).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export type DueState = "overdue" | "soon" | "ok" | "none";

export function dueState(item: Item): DueState {
  if (!item.due) return "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(item.due + "T00:00:00");
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return "overdue";
  if (days <= 3) return "soon";
  return "ok";
}

// Short human label for a due date, e.g. "Today", "in 2d", "3d ago".
export function dueLabel(item: Item): string | null {
  if (!item.due) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(item.due + "T00:00:00");
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < 0) return `${-days}d ago`;
  return `in ${days}d`;
}
