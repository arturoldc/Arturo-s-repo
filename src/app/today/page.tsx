"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Item } from "@/lib/types";
import { sortPriorities, todaysPriorities } from "@/lib/priorities";
import { todayKey } from "@/lib/day";
import { ReorderableList } from "@/components/ReorderableList";
import { DetailDrawer } from "@/components/DetailDrawer";

export default function TodayPage() {
  const { items, hydrated, toggleDone, reorderPriorities } = useStore();
  const [selected, setSelected] = useState<Item | null>(null);
  const today = todayKey();

  const list = useMemo(
    () => sortPriorities(todaysPriorities(items, today)),
    [items, today],
  );
  const doneCount = list.filter((i) => i.status === "done").length;

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="px-5 pt-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Today ⭐</h1>
        <p className="text-sm text-zinc-500">
          {dateLabel}
          {hydrated && list.length > 0 && (
            <>
              {" · "}
              {doneCount} of {list.length} done
            </>
          )}
        </p>
      </header>

      {!hydrated ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-zinc-200"
            />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center text-zinc-400">
          <div className="text-4xl">🌤️</div>
          <p className="mt-3 text-sm">No priorities set for today.</p>
          <Link
            href="/morning"
            className="mt-5 rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Run morning ritual
          </Link>
        </div>
      ) : (
        <ReorderableList
          items={list}
          onReorder={reorderPriorities}
          onToggleDone={toggleDone}
          onOpen={setSelected}
        />
      )}

      <DetailDrawer
        item={selected}
        onClose={() => setSelected(null)}
        onToggleDone={toggleDone}
      />
    </div>
  );
}
