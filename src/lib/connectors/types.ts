// Ingestion seam: a connector pulls items from an external source (Slack, and
// later Gmail/Notion/Granola) and hands back a normalized shape the store can
// fold into the inbox as `pending` items. Server-side only — connectors read
// secrets from process.env and must never be imported into client components.

import { ItemType } from "../types";

/** Normalized output of a connector fetch — a candidate inbox item. */
export interface IngestedItem {
  /** Stable dedup key, e.g. `slack:<channel>:<ts>`. */
  externalId: string;
  type: ItemType;
  title: string;
  /** Human-readable provenance, e.g. "Slack · #deals · Jun 24". */
  source: string;
  person?: string;
  /** ISO yyyy-mm-dd. */
  due?: string;
}

export interface Connector {
  /** Stable id, e.g. "slack". */
  id: string;
  /** Display label, e.g. "Slack". */
  label: string;
  /** True when the required env vars are present (else the route no-ops green). */
  isConfigured(): boolean;
  /** Fetch recent items. Throws on an upstream API error so the route can report it. */
  fetch(): Promise<IngestedItem[]>;
}
