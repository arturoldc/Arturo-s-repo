// GET /api/sync[?source=slack] — runs a connector server-side, AI-triages what it
// pulled, and returns the items. The client folds them into the inbox via
// store.ingestItems.
//
// Designed to deploy green with no secrets: when the connector isn't configured
// (no token), it returns { connected: false, items: [] } and the UI shows a calm
// "not connected" hint. Add the Slack env vars (see src/lib/connectors/slack.ts)
// to light it up; add ANTHROPIC_API_KEY (see src/lib/connectors/classify.ts) to
// turn on AI sorting — without it, items pass through unsorted (classified:false).

import type { NextRequest } from "next/server";
import { getConnector } from "@/lib/connectors/registry";
import { classifyCandidates } from "@/lib/connectors/classify";
import { todayKey } from "@/lib/day";

// Reads env + hits the network per request — never prerender/cache it.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source") ?? "slack";
  const connector = getConnector(source);

  if (!connector) {
    return Response.json(
      { connected: false, classified: false, items: [], error: `Unknown source: ${source}` },
      { status: 400 },
    );
  }

  if (!connector.isConfigured()) {
    return Response.json({ connected: false, classified: false, items: [] });
  }

  try {
    const raw = await connector.fetch();
    const { classified, items } = await classifyCandidates(raw, todayKey());
    return Response.json({ connected: true, classified, items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch_failed";
    return Response.json(
      { connected: true, classified: false, items: [], error: message },
      { status: 502 },
    );
  }
}
