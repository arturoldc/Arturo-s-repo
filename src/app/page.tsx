"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Item, ItemType, TYPE_META, TYPE_ORDER } from "@/lib/types";
import { sortItems } from "@/lib/ordering";
import { ReorderableList } from "@/components/ReorderableList";
import { CollapsibleDone } from "@/components/CollapsibleDone";
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
  const active = useMemo(
    () => onBoard.filter((i) => i.status !== "done"),
    [onBoard],
  );

  // Tab badges count active (non-done) items; done lives in its own section.
  const counts = useMemo(() => {
    const c: Record<Tab, number> = {
      all: active.length,
      rock: 0,
      project: 0,
      commitment: 0,
      task: 0,
    };
    for (const i of active) c[i.type]++;
    return c;
  }, [active]);

  const doneItems = useMemo(
    () =>
      sortItems(
        tab === "all"
          ? onBoard.filter((i) => i.status === "done")
          : onBoard.filter((i) => i.status === "done" && i.type === tab),
      ),
    [onBoard, tab],
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    ...TYPE_ORDER.map((t) => ({ key: t as Tab, label: `${TYPE_META[t].label}s` })),
  ];

  const isEmpty =
    active.filter((i) => tab === "all" || i.type === tab).length === 0 &&
    doneItems.length === 0;

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
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 ring-1 ring-zinc-200"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 text-[11px] ${
                  isActive ? "bg-white/20" : "bg-zinc-100 text-zinc-500"
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
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-200" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="mt-16 flex flex-col items-center text-center text-zinc-400">
          <div className="text-4xl">🗒️</div>
          <p className="mt-3 text-sm">Nothing here yet.</p>
        </div>
      ) : tab === "all" ? (
        <>
          {TYPE_ORDER.map((type) => {
            const sectionItems = sortItems(active.filter((i) => i.type === type));
            if (sectionItems.length === 0) return null;
            return (
              <section key={type} className="mb-4">
                <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {TYPE_META[type].label}s
                  <span className="rounded-full bg-zinc-200 px-1.5 text-[11px] text-zinc-500">
                    {sectionItems.length}
                  </span>
                </h2>
                <div className="rounded-2xl bg-zinc-100/70 p-2.5 ring-1 ring-zinc-200/70">
                  <ReorderableList
                    items={sectionItems}
                    onReorder={reorder}
                    onToggleDone={toggleDone}
                    onOpen={setSelected}
                  />
                </div>
              </section>
            );
          })}
          <CollapsibleDone
            items={doneItems}
            onToggleDone={toggleDone}
            onOpen={setSelected}
          />
        </>
      ) : (
        <>
          <ReorderableList
            items={sortItems(active.filter((i) => i.type === tab))}
            onReorder={reorder}
            onToggleDone={toggleDone}
            onOpen={setSelected}
          />
          <CollapsibleDone
            items={doneItems}
            onToggleDone={toggleDone}
            onOpen={setSelected}
          />
        </>
      )}

      <DetailDrawer
        item={selected}
        onClose={() => setSelected(null)}
        onToggleDone={toggleDone}
      />
      <AddItemDialog open={adding} onClose={() => setAdding(false)} onAdd={addItem} />
    </div>
  );
}
