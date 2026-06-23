// Core domain model for the commitment dashboard.

export type ItemType = "rock" | "project" | "commitment" | "task";

// pending  -> sitting in the morning swipe inbox, awaiting your call
// kept     -> you swiped right (or super-liked); lives on the dashboard
// discarded-> you swiped left; gone
// done     -> completed
export type ItemStatus = "pending" | "kept" | "discarded" | "done";

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  /** Where it came from, e.g. "Granola · Acme sync · Jun 22" */
  source: string;
  /** For commitments: who you promised. */
  person?: string;
  /** ISO date string (yyyy-mm-dd), optional. */
  due?: string;
  status: ItemStatus;
  /** Super-liked: shows a pin badge and floats to the top. */
  pinned: boolean;
  /** Manual drag order. null => fall back to age (oldest first). Lower = higher. */
  sortRank: number | null;
  /** ISO timestamp. */
  createdAt: string;
}

interface TypeMeta {
  label: string;
  /** Tailwind classes — kept as literal strings so Tailwind can see them. */
  badge: string; // pill background + text
  dot: string; // small colored dot
  ring: string; // left accent bar
  glow: string; // swipe-card top accent
}

export const TYPE_META: Record<ItemType, TypeMeta> = {
  rock: {
    label: "Rock",
    badge: "bg-purple-100 text-purple-700",
    dot: "bg-purple-500",
    ring: "border-l-purple-400",
    glow: "from-purple-500 to-fuchsia-500",
  },
  project: {
    label: "Project",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    ring: "border-l-blue-400",
    glow: "from-blue-500 to-sky-500",
  },
  commitment: {
    label: "Commitment",
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
    ring: "border-l-orange-400",
    glow: "from-orange-500 to-amber-500",
  },
  task: {
    label: "Task",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    ring: "border-l-emerald-400",
    glow: "from-emerald-500 to-green-500",
  },
};

export const TYPE_ORDER: ItemType[] = ["rock", "project", "commitment", "task"];
