"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { suggestPriorities, todaysPriorities } from "@/lib/priorities";
import { todayKey } from "@/lib/day";
import { PriorityPicker } from "./PriorityPicker";

const MAX = 4;
const TARGET = 3; // pre-fill up to this many; leave headroom to MAX

export function ConfirmPriorities() {
  const router = useRouter();
  const { items, setPriorityToday, markRitualComplete } = useStore();
  const today = todayKey();

  // Pre-fill once: if fewer than TARGET are seeded, auto-add top suggestions.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    const current = todaysPriorities(items, today);
    if (current.length < TARGET) {
      suggestPriorities(items, TARGET - current.length, today).forEach((i) =>
        setPriorityToday(i.id),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function start() {
    markRitualComplete();
    router.push("/today");
  }

  return (
    <div>
      <PriorityPicker cap={MAX} />

      <button
        onClick={start}
        className="mt-8 w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white shadow-sm active:scale-[0.99]"
      >
        Start my day →
      </button>
    </div>
  );
}
