"use client";

import { useRef } from "react";
import { Item, TYPE_META } from "@/lib/types";
import {
  SwipeCard,
  SwipeCardHandle,
  SwipeConfig,
  type Decision,
} from "@/components/SwipeCard";

export interface DeckButton {
  label: string;
  glyph: React.ReactNode;
  className: string;
  gesture: Decision;
  big?: boolean;
}

/**
 * The card-stage scaffolding shared by the morning decks (mirrors /inbox):
 * a stacked top+back card plus an action-button row that drives the top card
 * imperatively. The parent owns the deck data and decision semantics.
 */
export function DeckShell({
  item,
  next,
  config,
  allowUp = true,
  onDecision,
  buttons,
  hint,
}: {
  item: Item;
  next?: Item;
  /** Stamp labels/colors; omit to use SwipeCard's default Keep/Nope/Super. */
  config?: SwipeConfig;
  /** Whether the up (super) gesture is enabled. */
  allowUp?: boolean;
  onDecision: (d: Decision) => void;
  buttons: DeckButton[];
  hint: string;
}) {
  const topRef = useRef<SwipeCardHandle>(null);

  return (
    <>
      <div className="relative mx-auto h-[460px] w-full max-w-sm">
        {next && (
          <div className="absolute inset-0 scale-[0.96] rounded-3xl border border-zinc-200 bg-white opacity-70 shadow-md">
            <div
              className={`h-2 w-full rounded-t-3xl bg-gradient-to-r ${TYPE_META[next.type].glow}`}
            />
          </div>
        )}
        <SwipeCard
          key={item.id}
          ref={topRef}
          item={item}
          config={config}
          allowUp={allowUp}
          onDecision={onDecision}
        />
      </div>

      <div className="mt-7 flex items-center justify-center gap-5">
        {buttons.map((b) => (
          <button
            key={b.label}
            aria-label={b.label}
            onClick={() => topRef.current?.swipe(b.gesture)}
            className={`flex flex-col items-center justify-center rounded-full border-2 bg-white shadow-sm transition-colors active:scale-95 ${
              b.big ? "h-16 w-16 text-2xl" : "h-14 w-14 text-xl"
            } ${b.className}`}
          >
            {b.glyph}
          </button>
        ))}
      </div>

      <p className="mt-5 text-center text-xs text-zinc-400">{hint}</p>
    </>
  );
}
