"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Item, ItemType, TYPE_META, TYPE_ORDER } from "@/lib/types";
import { sortItems } from "@/lib/ordering";
import { ReorderableList } from "@/components/ReorderableList";
import { DetailDrawer } from "@/components/DetailDrawer";
import { AddItemDialog } from "@/components/AddItemDialog";

type Tab = "all" | ItemType;

export default function DashboardPage() {
  const { items, hydrated, reorder, toggleDone, addItem } = useStore();
  const [tab, setTab] = useState<Tab>("all");
  const [selected, setSelected] = useState<Item | null>(null);
  const [adding, setAdding] = useState(false);

  // On the dashboard: everything you kept (and completed), never pending/discarded.
  const onBoard = useMemo(
    () => items.filter((i) => i.status === "kept" || i.status === "done"),
    [items],
  );

  const counts = useMemo(() => {
    const c: Record<Tab, number> = {
      all: onBoard.length,
      rock: 0,
      project: 0,
      commitment: 0,
      task: 0,
    };
    for (const i of onBoard) c[i.type]++;
    return c;
  }, [onBoard]);

  const visible = useMemo(() => {
    const filtered =
      tab === "all" ? onBoard : onBoard.filter((i) => i.type === tab);
    return sortItems(filtered);
  }, [onBoard, tab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    ...TYPE_ORDER.map((t) => ({
      key: t as Tab,
      label: `${TYPE_META[t].label}s`,
    })),
  ];

  return (
    <div className="px-5 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your brain 🧠</h1>
          <p className="text-sm text-zinc-500">
            Everything you said you&apos;d do.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          aria-label="Add item"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-xl font-light text-white shadow-sm active:scale-95"
        >
          +
        </button>
      </header>

      {/* tabs */}
      <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 ring-1 ring-zinc-200"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 text-[11px] ${
                  active ? "bg-white/20" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {hydrated ? counts[t.key] : 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* list */}
      {!hydrated ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-zinc-200"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center text-zinc-400">
          <div className="text-4xl">🗒️</div>
          <p className="mt-3 text-sm">Nothing here yet.</p>
        </div>
      ) : (
        <ReorderableList
          items={visible}
          onReorder={reorder}
          onToggleDone={toggleDone}
          onOpen={setSelected}
        />
      )}

      <DetailDrawer
        item={selected}
        onClose={() => setSelected(null)}
        onToggleDone={toggleDone}
      />
      <AddItemDialog
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={addItem}
      />
    </div>
  );
}
