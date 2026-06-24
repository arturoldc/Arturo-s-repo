// Connector registry. New sources (Gmail, Notion, Granola) slot in here without
// touching the route handler or the client.

import { Connector } from "./types";
import { slackConnector } from "./slack";

export const CONNECTORS: Record<string, Connector> = {
  [slackConnector.id]: slackConnector,
};

export function getConnector(id: string): Connector | undefined {
  return CONNECTORS[id];
}
