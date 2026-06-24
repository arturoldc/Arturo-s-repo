"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { TYPE_META } from "@/lib/types";
import {
  SwipeCard,
  SwipeCardHandle,
  type Decision,
} from "@/components/SwipeCard";

export default function InboxPage() {
  const { items, hydrated, keep, discard, superLike, resetDemo, ingestItems } =
    useStore();
  const topRef = useRef<SwipeCardHandle>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const pending = items.filter((i) => i.status === "pending");
  const current = pending[0];
  const next = pending[1];

  function decide(d: Decision) {
    if (!current) return;
    if (d === "keep") keep(current.id);
    else if (d === "discard") discard(current.id);
    else superLike(current.id);
  }

  async function syncFromSlack() {
    if (syncing) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/sync");
      const data = await res.json();
      if (!data.connected) {
        setSyncMsg("Slack not connected — add SLACK_BOT_TOKEN to enable.");
      } else if (data.error) {
        setSyncMsg(`Couldn't reach Slack: ${data.error}`);
      } else {
        const added = ingestItems(data.items ?? []);
        setSyncMsg(
          added > 0
            ? `Added ${added} new item${added === 1 ? "" : "s"} from Slack.`
            : "No new messages.",
        );
      }
    } catch {
      setSyncMsg("Sync failed — check your connection.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col px-5 pt-6">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Good morning ☀️</h1>
          <p className="text-sm text-zinc-500">
            {hydrated && pending.length > 0
              ? `${pending.length} thing${pending.length === 1 ? "" : "s"} from yesterday — keep or toss.`
              : "Pulled from your Granola notes."}
          </p>
        </div>
        <button
          onClick={syncFromSlack}
          disabled={syncing}
          className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200 transition-colors active:scale-95 disabled:opacity-50"
        >
          <span className={syncing ? "inline-block animate-spin" : ""}>⟳</span>
          {syncing ? "Syncing…" : "Sync from Slack"}
        </button>
      </header>

      {syncMsg && (
        <p className="mb-3 rounded-xl bg-zinc-100 px-3 py-2 text-xs text-zinc-600">
          {syncMsg}
        </p>
      )}

      <div className="relative mx-auto h-[460px] w-full max-w-sm">
        {!hydrated ? (
          <div className="absolute inset-0 animate-pulse rounded-3xl bg-zinc-200" />
        ) : !current ? (
          <EmptyState onReset={resetDemo} />
        ) : (
          <>
            {/* card behind, for depth */}
            {next && (
              <div className="absolute inset-0 scale-[0.96] rounded-3xl border border-zinc-200 bg-white opacity-70 shadow-md">
                <div
                  className={`h-2 w-full rounded-t-3xl bg-gradient-to-r ${TYPE_META[next.type].glow}`}
                />
              </div>
            )}
            <SwipeCard
              key={current.id}
              ref={topRef}
              item={current}
              onDecision={decide}
            />
          </>
        )}
      </div>

      {hydrated && current && (
        <div className="mt-7 flex items-center justify-center gap-5">
          <ActionButton
            label="Discard"
            className="border-rose-200 text-rose-500 hover:bg-rose-50"
            onClick={() => topRef.current?.swipe("discard")}
          >
            ✕
          </ActionButton>
          <ActionButton
            label="Super-like"
            big
            className="border-amber-300 text-amber-500 hover:bg-amber-50"
            onClick={() => topRef.current?.swipe("super")}
          >
            ★
          </ActionButton>
          <ActionButton
            label="Keep"
            className="border-emerald-200 text-emerald-500 hover:bg-emerald-50"
            onClick={() => topRef.current?.swipe("keep")}
          >
            ✓
          </ActionButton>
        </div>
      )}

      {hydrated && current && (
        <p className="mt-5 text-center text-xs text-zinc-400">
          Swipe →&nbsp;keep&nbsp;·&nbsp;←&nbsp;discard&nbsp;·&nbsp;↑&nbsp;super-like
        </p>
      )}
    </div>
  );
}

function ActionButton({
  children,
  label,
  onClick,
  className,
  big,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  className: string;
  big?: boolean;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`flex items-center justify-center rounded-full border-2 bg-white shadow-sm transition-colors active:scale-95 ${
        big ? "h-16 w-16 text-2xl" : "h-14 w-14 text-xl"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white/60 p-8 text-center">
      <div className="text-5xl">🎉</div>
      <h2 className="mt-4 text-xl font-bold">All caught up</h2>
      <p className="mt-1 text-sm text-zinc-500">
        No new commitments to review. Everything you kept is on your dashboard.
      </p>
      <Link
        href="/"
        className="mt-5 rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
      >
        Go to dashboard
      </Link>
      <button
        onClick={onReset}
        className="mt-3 text-xs font-medium text-zinc-400 underline"
      >
        Reset demo data
      </button>
    </div>
  );
}
