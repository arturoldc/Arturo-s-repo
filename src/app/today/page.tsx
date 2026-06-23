"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Item } from "@/lib/types";
import { sortPriorities, todaysPriorities } from "@/lib/priorities";
import { todayKey } from "@/lib/day";
import { ReorderableList } from "@/components/ReorderableList";
import { CollapsibleDone } from "@/components/CollapsibleDone";
import { DetailDrawer } from "@/components/DetailDrawer";
import { TodayEditSheet } from "@/components/morning/TodayEditSheet";

export default function TodayPage() {
  const {
    items,
    hydrated,
    toggleDone,
    reorderPriorities,
    removePriorityToday,
    resetDemo,
  } = useStore();
  const router = useRouter();
  const [selected, setSelected] = useState<Item | null>(null);
  const [editing, setEditing] = useState(false);
  const today = todayKey();

  // Demo/testing: re-arm a fresh "new day" and run the whole ritual from step 1.
  function replayRitual() {
    resetDemo();
    router.push("/morning");
  }

  const all = useMemo(
    () => sortPriorities(todaysPriorities(items, today)),
    [items, today],
  );
  const active = all.filter((i) => i.status !== "done");
  const done = all.filter((i) => i.status === "done");

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="px-5 pt-6">
      <header className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Today ⭐</h1>
          <p className="text-sm text-zinc-500">
            {dateLabel}
            {hydrated && all.length > 0 && (
              <>
                {" · "}
                {done.length} of {all.length} done
              </>
            )}
          </p>
        </div>
        {hydrated && all.length > 0 && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-zinc-600 ring-1 ring-zinc-200 active:scale-95"
          >
            Edit
          </button>
        )}
      </header>

      {!hydrated ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-200" />
          ))}
        </div>
      ) : all.length === 0 ? (
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
        <>
          {active.length > 0 ? (
            <ReorderableList
              items={active}
              onReorder={reorderPriorities}
              onToggleDone={toggleDone}
              onOpen={setSelected}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400">
              All done for today. 🎉
            </div>
          )}
          <CollapsibleDone
            items={done}
            onToggleDone={toggleDone}
            onOpen={setSelected}
          />
        </>
      )}

      {hydrated && (
        <div className="mt-10 border-t border-zinc-200/70 pt-4 text-center">
          <button
            onClick={replayRitual}
            className="text-xs font-medium text-zinc-400 underline underline-offset-2"
          >
            ↻ Replay morning ritual (fresh demo)
          </button>
        </div>
      )}

      <DetailDrawer
        item={selected}
        onClose={() => setSelected(null)}
        onToggleDone={toggleDone}
        onRemoveFromToday={removePriorityToday}
      />
      {editing && <TodayEditSheet onClose={() => setEditing(false)} />}
    </div>
  );
}
