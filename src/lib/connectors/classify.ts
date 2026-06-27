// AI triage: decides which ingested candidates are actually the user's own
// action items and assigns the right type/person/due. Server-side only — reads
// ANTHROPIC_API_KEY from the environment and must never reach the client.
//
// Env:
//   ANTHROPIC_API_KEY – required to enable AI sorting. When absent, this module
//                       no-ops (passthrough) so the app still works.
//   SLACK_USER_NAME   – who "I"/"me" is, for relevance judgements (default "Arturo").

import Anthropic from "@anthropic-ai/sdk";
import { ItemType } from "../types";
import { IngestedItem } from "./types";

const MODEL = "claude-haiku-4-5";
const CHUNK_SIZE = 25;
const TYPES: ItemType[] = ["rock", "project", "commitment", "task"];

export interface ClassifyResult {
  /** False when AI sorting was unavailable (no key) — items pass through unsorted. */
  classified: boolean;
  items: IngestedItem[];
}

// Structured-output schema: a verdict per candidate, addressed by its index.
// All fields required (person/due may be ""), additionalProperties:false — per
// the structured-outputs constraints.
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          index: { type: "integer" },
          relevant: { type: "boolean" },
          type: { type: "string", enum: TYPES },
          person: { type: "string" },
          due: { type: "string" },
          title: { type: "string" },
        },
        required: ["index", "relevant", "type", "person", "due", "title"],
      },
    },
  },
  required: ["results"],
} as const;

interface Verdict {
  index: number;
  relevant: boolean;
  type: ItemType;
  person: string;
  due: string;
  title: string;
}

function systemPrompt(userName: string, today: string): string {
  return `You triage Slack messages into ${userName}'s personal commitment tracker. "I"/"me"/"my" means ${userName}. Today is ${today}.

RELEVANCE — be strict. Surface a message ONLY if it is a CONCRETE, COMPLETABLE commitment for ${userName}: a discrete action with a clear finish line that you could check off as "done". The canonical cases are a promise ${userName} made ("I'll send you the deck", "I'll review the contract by Friday") or a specific request directed at ${userName} ("can you get me access to X?"), often with a deliverable and/or a deadline. A deadline strengthens relevance but is NOT required (e.g. "get Arturo access to Greenhouse" is concrete and finishable even with no date). When in doubt, mark it not relevant (relevant=false).

EXCLUDE (not relevant), even when they concern ${userName}:
- Ongoing responsibilities, recurring or standing duties, and habits ("before every shoot…", "always do X", "going forward we…", "keep doing X").
- Process or policy changes — a new way of working rather than a one-time action.
- Vague or open-ended improvements and goals with no checkable end state ("improve the ideation process", "get better at X", broad quarterly aspirations).
- FYIs, status updates, announcements, social/chatter (greetings, thanks, congratulations, birthdays), other people's tasks not assigned to ${userName}, and pure links or reactions with no action for ${userName}.

Contrast — RELEVANT: "create a framework for 1 script by EOD tomorrow", "get Arturo access to Greenhouse", "add review blocks to the calendar for Thursday's shoot". NOT relevant: "Review and approve all video scripts before Dan shoots" (standing policy, never finished), "improve the ideation process with audience psychographics" (open-ended, no finish line).

For each relevant message, classify its type:
- "rock": a big quarterly outcome or goal.
- "project": a multi-step deliverable spanning days (e.g. a video in production).
- "commitment": something ${userName} promised, or was personally asked, to do for a specific person — always set "person" to that person.
- "task": a single standalone to-do.

Also extract:
- "person": for commitments, who it's for/to; otherwise "".
- "due": an ISO date (yyyy-mm-dd) if a deadline is clearly stated or implied relative to today (${today}); otherwise "".
- "title": a short, clear action phrase capturing the to-do (close to the original wording).

Return a verdict for EVERY message by its index. For non-relevant ones, set relevant=false (other fields can be "task"/""/"").`;
}

function buildAnthropic(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function isISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** Classify one chunk; on any failure, passthrough the chunk unchanged. */
async function classifyChunk(
  client: Anthropic,
  chunk: IngestedItem[],
  userName: string,
  today: string,
): Promise<IngestedItem[]> {
  const list = chunk
    .map((it, i) => `[${i}] (${it.source}) ${it.title}`)
    .join("\n");

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt(userName, today),
      messages: [
        {
          role: "user",
          content: `Triage these ${chunk.length} messages:\n\n${list}`,
        },
      ],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
    });

    const text = res.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") throw new Error("no text block");
    const parsed = JSON.parse(text.text) as { results: Verdict[] };

    const kept: IngestedItem[] = [];
    for (const v of parsed.results) {
      const original = chunk[v.index];
      if (!original || !v.relevant) continue;
      kept.push({
        ...original,
        type: TYPES.includes(v.type) ? v.type : original.type,
        title: v.title?.trim() || original.title,
        person: v.person?.trim() || undefined,
        due: isISODate(v.due) ? v.due : undefined,
      });
    }
    return kept;
  } catch {
    // Don't lose messages on an API/parse failure — let them through as-is.
    return chunk;
  }
}

/**
 * Filter + classify ingested candidates. Returns only the items judged relevant,
 * each with an AI-assigned type/person/due. No key → passthrough (classified:false).
 */
export async function classifyCandidates(
  items: IngestedItem[],
  today: string,
): Promise<ClassifyResult> {
  const client = buildAnthropic();
  if (!client || items.length === 0) {
    return { classified: Boolean(client), items };
  }

  const userName = process.env.SLACK_USER_NAME || "Arturo";
  const chunks: IngestedItem[][] = [];
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    chunks.push(items.slice(i, i + CHUNK_SIZE));
  }

  const sorted = await Promise.all(
    chunks.map((c) => classifyChunk(client, c, userName, today)),
  );
  return { classified: true, items: sorted.flat() };
}
