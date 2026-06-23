"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { yesterdaysPriorities } from "@/lib/priorities";
import { todayKey } from "@/lib/day";
import { SwipeConfig, type Decision } from "@/components/SwipeCard";
import { DeckShell, DeckButton } from "./DeckShell";

// Review deck: LEFT = Keep (carry forward), RIGHT = Done, UP = ⭐ Today.
// Note the geometry differs from the inbox on purpose.
const REVIEW_CONFIG: SwipeConfig = {
  right: { label: "Done", className: "border-emerald-500 text-emerald-500" },
  left: { label: "Keep", className: "border-sky-500 text-sky-500" },
  up: { label: "⭐ Today", className: "border-amber-400 text-amber-500" },
};

export function ReviewDeck({ onComplete }: { onComplete: () => void }) {
  const { items, carryForward, completePriority, setPriorityToday } = useStore();
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
    else if (d === "discard") carryForward(current.id); // left = Keep/carry
    else setPriorityToday(current.id); // up = ⭐ Today
  }

  if (!current) return null;

  const buttons: DeckButton[] = [
    {
      label: "Keep",
      glyph: "↩",
      gesture: "discard",
      className: "border-sky-200 text-sky-500 hover:bg-sky-50",
    },
    {
      label: "Do today",
      glyph: "⭐",
      gesture: "super",
      big: true,
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
      onDecision={decide}
      buttons={buttons}
      hint="← keep · → done · ↑ do today"
    />
  );
}
