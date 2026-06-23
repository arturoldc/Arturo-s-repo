import { Item } from "./types";

// Relative-date helpers so the prototype always looks "live".
const createdAgo = (days: number) =>
  new Date(Date.now() - days * 86_400_000).toISOString();

const dueIn = (days: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

let n = 0;
const id = () => `sample-${++n}`;

// ~7 land in the swipe inbox (status: pending), the rest populate the dashboard.
export const SAMPLE_ITEMS: Item[] = [
  // ---- Pending: the morning swipe inbox ----
  {
    id: id(),
    type: "commitment",
    title: "Send Dana the Q3 pricing deck",
    source: "Granola · Acme sync · yesterday",
    person: "Dana",
    due: dueIn(1),
    status: "pending",
    pinned: false,
    sortRank: null,
    createdAt: createdAgo(0),
  },
  {
    id: id(),
    type: "task",
    title: "Reply to the legal redline thread",
    source: "Slack · #deals · yesterday",
    status: "pending",
    pinned: false,
    sortRank: null,
    createdAt: createdAgo(0),
  },
  {
    id: id(),
    type: "project",
    title: "Stand up the onboarding revamp",
    source: "Granola · Product weekly · yesterday",
    due: dueIn(14),
    status: "pending",
    pinned: false,
    sortRank: null,
    createdAt: createdAgo(0),
  },
  {
    id: id(),
    type: "commitment",
    title: "Intro Priya to the design contractor",
    source: "Granola · 1:1 with Priya · yesterday",
    person: "Priya",
    due: dueIn(3),
    status: "pending",
    pinned: false,
    sortRank: null,
    createdAt: createdAgo(0),
  },
  {
    id: id(),
    type: "task",
    title: "Book travel for the offsite",
    source: "Slack · #team · yesterday",
    due: dueIn(6),
    status: "pending",
    pinned: false,
    sortRank: null,
    createdAt: createdAgo(0),
  },
  {
    id: id(),
    type: "rock",
    title: "Hit 200 paying teams this quarter",
    source: "Granola · Leadership review · yesterday",
    status: "pending",
    pinned: false,
    sortRank: null,
    createdAt: createdAgo(0),
  },
  {
    id: id(),
    type: "task",
    title: "Approve the new brand colors",
    source: "Slack · #design · yesterday",
    status: "pending",
    pinned: false,
    sortRank: null,
    createdAt: createdAgo(0),
  },

  // ---- Kept: already on the dashboard ----
  {
    id: id(),
    type: "rock",
    title: "Ship the v2 dashboard",
    source: "Granola · Roadmap planning",
    due: dueIn(21),
    status: "kept",
    pinned: true, // super-liked -> pinned to top
    sortRank: -1,
    createdAt: createdAgo(9),
  },
  {
    id: id(),
    type: "commitment",
    title: "Get back to Marcus on the contract terms",
    source: "Granola · Vendor call",
    person: "Marcus",
    due: dueIn(-1), // overdue -> red
    status: "kept",
    pinned: false,
    sortRank: null,
    createdAt: createdAgo(12),
  },
  {
    id: id(),
    type: "task",
    title: "Write the changelog for last release",
    source: "Manual",
    status: "kept",
    pinned: false,
    sortRank: null,
    createdAt: createdAgo(8),
  },
  {
    id: id(),
    type: "project",
    title: "Migrate billing to the new provider",
    source: "Granola · Eng sync",
    due: dueIn(2), // soon -> amber
    status: "kept",
    pinned: false,
    sortRank: null,
    createdAt: createdAgo(5),
  },
  {
    id: id(),
    type: "commitment",
    title: "Send Jordan the hiring scorecard",
    source: "Slack · #hiring",
    person: "Jordan",
    due: dueIn(4),
    status: "kept",
    pinned: false,
    sortRank: null,
    createdAt: createdAgo(3),
  },
  {
    id: id(),
    type: "task",
    title: "Renew the SSL certificate",
    source: "Manual",
    due: dueIn(10),
    status: "kept",
    pinned: false,
    sortRank: null,
    createdAt: createdAgo(1),
  },
  {
    id: id(),
    type: "task",
    title: "Schedule the team retro",
    source: "Slack · #team",
    status: "done",
    pinned: false,
    sortRank: null,
    createdAt: createdAgo(4),
  },
];
