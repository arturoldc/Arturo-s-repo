// GET /api/sync[?source=slack] — runs a connector server-side and returns the
// items it pulled. The client folds them into the inbox via store.ingestItems.
//
// Designed to deploy green with no secrets: when the connector isn't configured
// (no token), it returns { connected: false, items: [] } and the UI shows a calm
// "not connected" hint. Add the Slack env vars (see src/lib/connectors/slack.ts)
// to light it up.

import type { NextRequest } from "next/server";
import { getConnector } from "@/lib/connectors/registry";

// Reads env + hits the network per request — never prerender/cache it.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source") ?? "slack";
  const connector = getConnector(source);

  if (!connector) {
    return Response.json(
      { connected: false, items: [], error: `Unknown source: ${source}` },
      { status: 400 },
    );
  }

  if (!connector.isConfigured()) {
    return Response.json({ connected: false, items: [] });
  }

  try {
    const items = await connector.fetch();
    return Response.json({ connected: true, items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch_failed";
    return Response.json(
      { connected: true, items: [], error: message },
      { status: 502 },
    );
  }
}
