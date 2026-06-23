"use client";

import { useState } from "react";
import { Item } from "@/lib/types";
import { ItemCard } from "./ItemCard";

// Collapsed-by-default "Done" section. Items render subdued (greyed, no
// strikethrough). The ✓ button un-completes via onToggleDone.
export function CollapsibleDone({
  items,
  onToggleDone,
  onOpen,
}: {
  items: Item[];
  onToggleDone: (id: string) => void;
  onOpen: (item: Item) => void;
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 py-2 text-sm font-semibold text-zinc-400"
      >
        <span className="text-xs">{open ? "▾" : "▸"}</span>
        <span>Done</span>
        <span className="rounded-full bg-zinc-100 px-1.5 text-[11px] text-zinc-500">
          {items.length}
        </span>
      </button>

      {open && (
        <div className="mt-1 space-y-2.5">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              subdued
              onToggleDone={() => onToggleDone(item.id)}
              onOpen={() => onOpen(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
