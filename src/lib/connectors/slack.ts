// Slack connector: pulls recent messages from one or more channels via the Web
// API and maps them to inbox candidates. Server-side only.
//
// Required env (set these in the Vercel project to go live):
//   SLACK_BOT_TOKEN     – bot token (xoxb-…). Needs `channels:history` for public
//                         channels, and `groups:history` for PRIVATE channels.
//                         The bot must also be invited into each channel it reads.
//   SLACK_CHANNEL_IDS   – comma-separated channel ids to pull from, e.g.
//                         "C0123456789,C0987654321". (SLACK_CHANNEL_ID, a single
//                         id, is still honored for backwards compatibility.)
// Optional:
//   SLACK_CHANNEL_NAMES – comma-separated pretty names aligned by position with
//                         SLACK_CHANNEL_IDS, used only for the `source` label.
//                         Falls back to the id when missing.

import { Connector, IngestedItem } from "./types";

const HISTORY_URL = "https://slack.com/api/conversations.history";
const FETCH_LIMIT = 20;
const TITLE_CAP = 140;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface SlackMessage {
  type?: string;
  subtype?: string;
  bot_id?: string;
  text?: string;
  user?: string;
  ts?: string;
}

interface SlackHistoryResponse {
  ok: boolean;
  error?: string;
  messages?: SlackMessage[];
}

interface ChannelConfig {
  id: string;
  name: string;
}

/** Split a comma-separated env value into trimmed, non-empty entries. */
function parseList(value?: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * The channels to read, each with a display name for the `source` label.
 * Prefers SLACK_CHANNEL_IDS; falls back to the legacy single SLACK_CHANNEL_ID.
 */
function channelConfigs(): ChannelConfig[] {
  const ids = parseList(process.env.SLACK_CHANNEL_IDS);
  const names = parseList(process.env.SLACK_CHANNEL_NAMES);
  if (ids.length > 0) {
    return ids.map((id, i) => ({ id, name: names[i] || id }));
  }
  const single = process.env.SLACK_CHANNEL_ID;
  if (single) {
    return [{ id: single, name: process.env.SLACK_CHANNEL_NAME || single }];
  }
  return [];
}

/** "Jun 24" from a Slack ts ("1718233200.000200"). */
function tsToLabel(ts: string): string {
  const ms = Math.floor(parseFloat(ts) * 1000);
  if (!Number.isFinite(ms)) return "";
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** Collapse Slack mention/link markup into something readable, then trim/cap. */
function cleanText(text: string): string {
  const oneLine = text
    .replace(/<@[^>]+>/g, "") // user mentions
    .replace(/<#[^|>]+\|([^>]+)>/g, "#$1") // channel links -> #name
    .replace(/<([^|>]+)\|([^>]+)>/g, "$2") // labeled links -> label
    .replace(/<([^>]+)>/g, "$1") // bare links
    .replace(/\s+/g, " ")
    .trim();
  return oneLine.length > TITLE_CAP
    ? `${oneLine.slice(0, TITLE_CAP - 1).trimEnd()}…`
    : oneLine;
}

/** Pull and map one channel's recent messages. */
async function fetchChannel(
  token: string,
  { id, name }: ChannelConfig,
): Promise<IngestedItem[]> {
  const url = `${HISTORY_URL}?channel=${encodeURIComponent(id)}&limit=${FETCH_LIMIT}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Slack HTTP ${res.status}`);
  }

  const data = (await res.json()) as SlackHistoryResponse;
  if (!data.ok) {
    throw new Error(data.error || "slack_error");
  }

  return (data.messages ?? [])
    // Skip system/edited/joined messages and bot posts; keep real human text.
    .filter((m) => !m.subtype && !m.bot_id && m.text?.trim() && m.ts)
    .map((m) => {
      const title = cleanText(m.text!);
      const dateLabel = tsToLabel(m.ts!);
      return {
        externalId: `slack:${id}:${m.ts}`,
        type: "task" as const, // default; triage reclassifies
        title,
        source: `Slack · #${name}${dateLabel ? ` · ${dateLabel}` : ""}`,
      };
    })
    // A cleaned message can be empty (e.g. it was only a mention/link).
    .filter((i) => i.title.length > 0);
}

export const slackConnector: Connector = {
  id: "slack",
  label: "Slack",

  isConfigured() {
    return Boolean(process.env.SLACK_BOT_TOKEN) && channelConfigs().length > 0;
  },

  async fetch(): Promise<IngestedItem[]> {
    const token = process.env.SLACK_BOT_TOKEN!;
    const channels = channelConfigs();

    // Read channels in parallel; collect items and per-channel errors so one
    // unreadable channel (e.g. a private one missing `groups:history`, or one
    // the bot hasn't been invited to) doesn't sink the whole sync.
    const results = await Promise.allSettled(
      channels.map((c) => fetchChannel(token, c)),
    );

    const items: IngestedItem[] = [];
    const errors: string[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        items.push(...r.value);
      } else {
        const reason =
          r.reason instanceof Error ? r.reason.message : "fetch_failed";
        errors.push(`#${channels[i].name}: ${reason}`);
      }
    });

    // Only fail the request if every channel failed; otherwise return what we got.
    if (items.length === 0 && errors.length > 0) {
      throw new Error(errors.join("; "));
    }
    return items;
  },
};
