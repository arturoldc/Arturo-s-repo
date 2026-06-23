"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { yesterdaysPriorities } from "@/lib/priorities";
import { todayKey } from "@/lib/day";
import { SwipeConfig, type Decision } from "@/components/SwipeCard";
import { DeckShell, DeckButton } from "./DeckShell";

// Review deck: binary. RIGHT = Done, LEFT = Still pending (stays on today).
// No super-like here.
const REVIEW_CONFIG: SwipeConfig = {
  right: { label: "Done", className: "border-emerald-500 text-emerald-500" },
  left: { label: "Still on", className: "border-amber-400 text-amber-500" },
  up: { label: "", className: "" }, // unused (allowUp={false})
};

export function ReviewDeck({ onComplete }: { onComplete: () => void }) {
  const { items, completePriority, setPriorityToday } = useStore();
  const deck = yesterdaysPriorities(items, todayKey());
  const current = deck[0];
  const next = deck[1];

  // Advance when the deck is empty (also covers "empty on entry").
  const doneRef = useRef(false);
  useEffect(() => {
    if (deck.length === 0 && !doneRef.current) {
      doneRef.current = true;
      onComplete();
    }
  }, [deck.length, onComplete]);

  function decide(d: Decision) {
    if (!current) return;
    if (d === "keep") completePriority(current.id); // right = Done
    else if (d === "discard") setPriorityToday(current.id); // left = Still pending -> stays on today
  }

  if (!current) return null;

  const buttons: DeckButton[] = [
    {
      label: "Still pending",
      glyph: "↻",
      gesture: "discard",
      className: "border-amber-300 text-amber-500 hover:bg-amber-50",
    },
    {
      label: "Done",
      glyph: "✓",
      gesture: "keep",
      className: "border-emerald-200 text-emerald-500 hover:bg-emerald-50",
    },
  ];

  return (
    <DeckShell
      item={current}
      next={next}
      config={REVIEW_CONFIG}
      allowUp={false}
      onDecision={decide}
      buttons={buttons}
      hint="← still pending · → done"
    />
  );
}
