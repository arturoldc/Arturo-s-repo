"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { type Decision } from "@/components/SwipeCard";
import { DeckShell, DeckButton } from "./DeckShell";

// Same triage as /inbox (default Keep / Nope / ★ Super stamps), but an up-swipe
// here ALSO seeds the item into today's priorities.
export function MorningInbox({ onComplete }: { onComplete: () => void }) {
  const { items, keep, discard, superLike, setPriorityToday } = useStore();
  const deck = items.filter((i) => i.status === "pending");
  const current = deck[0];
  const next = deck[1];

  const doneRef = useRef(false);
  useEffect(() => {
    if (deck.length === 0 && !doneRef.current) {
      doneRef.current = true;
      onComplete();
    }
  }, [deck.length, onComplete]);

  function decide(d: Decision) {
    if (!current) return;
    if (d === "keep") keep(current.id);
    else if (d === "discard") discard(current.id);
    else {
      superLike(current.id);
      setPriorityToday(current.id); // ⭐ super-like also seeds Today
    }
  }

  if (!current) return null;

  const buttons: DeckButton[] = [
    {
      label: "Discard",
      glyph: "✕",
      gesture: "discard",
      className: "border-rose-200 text-rose-500 hover:bg-rose-50",
    },
    {
      label: "Super-like",
      glyph: "★",
      gesture: "super",
      big: true,
      className: "border-amber-300 text-amber-500 hover:bg-amber-50",
    },
    {
      label: "Keep",
      glyph: "✓",
      gesture: "keep",
      className: "border-emerald-200 text-emerald-500 hover:bg-emerald-50",
    },
  ];

  return (
    <DeckShell
      item={current}
      next={next}
      onDecision={decide}
      buttons={buttons}
      hint="→ keep · ← discard · ↑ super-like (adds to today)"
    />
  );
}
