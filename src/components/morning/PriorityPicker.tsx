"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Item } from "@/lib/types";
import { suggestPriorities, todaysPriorities } from "@/lib/priorities";
import { todayKey } from "@/lib/day";
import { TypeBadge } from "@/components/TypeBadge";
import { dueLabel } from "@/lib/ordering";

// Shared add/remove list for today's priorities. Used by the morning confirm
// step and the Today tab's edit sheet.
export function PriorityPicker({ cap }: { cap?: number }) {
  const { items, setPriorityToday, removePriorityToday } = useStore();
  const today = todayKey();

  const selected = useMemo(
    () => todaysPriorities(items, today).filter((i) => i.status !== "done"),
    [items, today],
  );
  const suggestions = useMemo(
    () => suggestPriorities(items, 6, today),
    [items, today],
  );

  const atCap = cap !== undefined && selected.length >= cap;

  return (
    <div>
      <p className="mb-3 text-sm text-zinc-500">
        {selected.length}
        {cap !== undefined ? ` of ${cap}` : ""} picked — tap to add or remove.
      </p>

      {selected.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400">
          Nothing picked yet. Add a few below.
        </div>
      ) : (
        <ul className="space-y-2">
          {selected.map((item) => (
            <PriorityRow
              key={item.id}
              item={item}
              selected
              onClick={() => removePriorityToday(item.id)}
            />
          ))}
        </ul>
      )}

      {suggestions.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Suggestions
          </h2>
          <ul className="space-y-2">
            {suggestions.map((item) => (
              <PriorityRow
                key={item.id}
                item={item}
                selected={false}
                disabled={atCap}
                onClick={() => setPriorityToday(item.id)}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function PriorityRow({
  item,
  selected,
  disabled,
  onClick,
}: {
  item: Item;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const due = dueLabel(item);
  return (
    <li>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition-colors disabled:opacity-40 ${
          selected ? "border-zinc-900" : "border-zinc-200"
        }`}
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
            selected
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-300 text-zinc-400"
          }`}
        >
          {selected ? "✓" : "+"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-1 flex items-center gap-2">
            <TypeBadge type={item.type} />
            {due && <span className="text-xs text-zinc-400">{due}</span>}
          </span>
          <span className="block truncate text-[15px] font-semibold text-zinc-900">
            {item.title}
          </span>
        </span>
      </button>
    </li>
  );
}
