"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Item, ItemType, TYPE_META, TYPE_ORDER } from "@/lib/types";
import { sortItems } from "@/lib/ordering";
import { distinctValues, filterItems, isFilterActive } from "@/lib/search";
import { ReorderableList } from "@/components/ReorderableList";
import { CollapsibleDone } from "@/components/CollapsibleDone";
import { DetailDrawer } from "@/components/DetailDrawer";
import { AddItemDialog } from "@/components/AddItemDialog";

type Tab = "all" | ItemType;

export default function DashboardPage() {
  const { items, hydrated, reorder, toggleDone, addItem, updateItem } =
    useStore();
  const [tab, setTab] = useState<Tab>("all");
  const [selected, setSelected] = useState<Item | null>(null);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [person, setPerson] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  // On the dashboard: everything you kept (and completed), never pending/discarded.
  const onBoard = useMemo(
    () => items.filter((i) => i.status === "kept" || i.status === "done"),
    [items],
  );

  // Filter chip options come from the full board so they don't vanish mid-search.
  const people = useMemo(() => distinctValues(onBoard, (i) => i.person), [onBoard]);
  const sources = useMemo(() => distinctValues(onBoard, (i) => i.source), [onBoard]);

  const filter = { query, person, source };
  const filterActive = isFilterActive(filter);

  // Search box + person/source chips applied before the type grouping below.
  const filtered = useMemo(
    () => filterItems(onBoard, { query, person, source }),
    [onBoard, query, person, source],
  );
  const active = useMemo(
    () => filtered.filter((i) => i.status !== "done"),
    [filtered],
  );

  function clearFilters() {
    setQuery("");
    setPerson(null);
    setSource(null);
  }

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
          ? filtered.filter((i) => i.status === "done")
          : filtered.filter((i) => i.status === "done" && i.type === tab),
      ),
    [filtered, tab],
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

      {/* search */}
      <div className="relative mb-3">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
          🔍
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, person, source…"
          className="w-full rounded-xl border border-zinc-200 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-zinc-400"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* person / source filter chips */}
      {(people.length > 0 || sources.length > 0) && (
        <div className="no-scrollbar -mx-5 mb-3 flex items-center gap-2 overflow-x-auto px-5 pb-1">
          {people.map((p) => (
            <FilterChip
              key={`person-${p}`}
              label={`@ ${p}`}
              active={person === p}
              onClick={() => setPerson(person === p ? null : p)}
            />
          ))}
          {sources.map((s) => (
            <FilterChip
              key={`source-${s}`}
              label={s}
              active={source === s}
              onClick={() => setSource(source === s ? null : s)}
            />
          ))}
          {filterActive && (
            <button
              onClick={clearFilters}
              className="shrink-0 whitespace-nowrap px-2 py-1.5 text-xs font-semibold text-zinc-500 underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

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
          <div className="text-4xl">{filterActive ? "🔍" : "🗒️"}</div>
          <p className="mt-3 text-sm">
            {filterActive ? "No matches." : "Nothing here yet."}
          </p>
          {filterActive && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs font-semibold text-zinc-500 underline"
            >
              Clear filters
            </button>
          )}
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
        onUpdate={updateItem}
      />
      <AddItemDialog open={adding} onClose={() => setAdding(false)} onAdd={addItem} />
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex max-w-[60vw] shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-zinc-900 text-white"
          : "bg-white text-zinc-600 ring-1 ring-zinc-200"
      }`}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}
