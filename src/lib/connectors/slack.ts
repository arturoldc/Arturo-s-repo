// Slack connector: pulls recent messages from one channel via the Web API and
// maps them to inbox candidates. Server-side only.
//
// Required env (set these in the Vercel project to go live):
//   SLACK_BOT_TOKEN    – bot token (xoxb-…) with `channels:history` (and
//                        `groups:history` for private channels)
//   SLACK_CHANNEL_ID   – the channel to pull from, e.g. C0123456789
// Optional:
//   SLACK_CHANNEL_NAME – pretty name for the `source` label (defaults to the id)

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

export const slackConnector: Connector = {
  id: "slack",
  label: "Slack",

  isConfigured() {
    return Boolean(process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID);
  },

  async fetch(): Promise<IngestedItem[]> {
    const token = process.env.SLACK_BOT_TOKEN!;
    const channel = process.env.SLACK_CHANNEL_ID!;
    const channelName = process.env.SLACK_CHANNEL_NAME || channel;

    const url = `${HISTORY_URL}?channel=${encodeURIComponent(channel)}&limit=${FETCH_LIMIT}`;
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
          externalId: `slack:${channel}:${m.ts}`,
          type: "task" as const, // default; triage reclassifies
          title,
          source: `Slack · #${channelName}${dateLabel ? ` · ${dateLabel}` : ""}`,
        };
      })
      // A cleaned message can be empty (e.g. it was only a mention/link).
      .filter((i) => i.title.length > 0);
  },
};
