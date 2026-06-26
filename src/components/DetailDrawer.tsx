"use client";

import { useEffect, useState } from "react";
import { Item, ItemType, TYPE_META, TYPE_ORDER } from "@/lib/types";
import { ageInDays, dueLabel } from "@/lib/ordering";
import { TypeBadge } from "./TypeBadge";

export function DetailDrawer({
  item,
  onClose,
  onToggleDone,
  onRemoveFromToday,
  onUpdate,
}: {
  item: Item | null;
  onClose: () => void;
  onToggleDone: (id: string) => void;
  /** When provided (Today tab), shows a "Remove from today" action. */
  onRemoveFromToday?: (id: string) => void;
  /** When provided, the type/who/due become editable (fix AI labels). */
  onUpdate?: (id: string, changes: Partial<Item>) => void;
}) {
  // Local edit state, seeded from the item so the UI reflects edits immediately
  // (the parent passes a snapshot that doesn't change when the store does).
  const [person, setPerson] = useState("");
  const [due, setDue] = useState("");
  useEffect(() => {
    setPerson(item?.person ?? "");
    setDue(item?.due ?? "");
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null;
  const done = item.status === "done";
  const dueText = dueLabel(item);
  const editable = Boolean(onUpdate);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white p-5 pb-8 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-zinc-200" />

        <div className="flex items-center gap-2">
          <TypeBadge type={item.type} size="lg" />
          {item.pinned && <span title="Super-liked">📌</span>}
        </div>

        <h2 className="mt-4 text-xl font-bold leading-snug">{item.title}</h2>

        {editable && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {TYPE_ORDER.map((t: ItemType) => (
              <button
                key={t}
                onClick={() => onUpdate!(item.id, { type: t })}
                className={`rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${
                  item.type === t
                    ? `${TYPE_META[t].badge} border-transparent`
                    : "border-zinc-200 text-zinc-500"
                }`}
              >
                {TYPE_META[t].label}
              </button>
            ))}
          </div>
        )}

        {editable ? (
          <div className="mt-3 flex gap-2">
            <input
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              onBlur={() =>
                onUpdate!(item.id, { person: person.trim() || undefined })
              }
              placeholder="Who? (optional)"
              className="w-1/2 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
            />
            <input
              type="date"
              value={due}
              onChange={(e) => {
                setDue(e.target.value);
                onUpdate!(item.id, { due: e.target.value || undefined });
              }}
              className="w-1/2 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-600 outline-none focus:border-zinc-400"
            />
          </div>
        ) : null}

        <dl className="mt-4 space-y-2 text-sm">
          {!editable && item.person && <Row label="Who">{item.person}</Row>}
          {!editable && dueText && <Row label="Due">{dueText}</Row>}
          <Row label="Age">{ageInDays(item)} days</Row>
          <Row label="Source">{item.source}</Row>
        </dl>

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-600"
          >
            Close
          </button>
          <button
            onClick={() => {
              onToggleDone(item.id);
              onClose();
            }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white ${
              done ? "bg-zinc-500" : "bg-emerald-600"
            }`}
          >
            {done ? "Mark not done" : "Mark done"}
          </button>
        </div>

        {onRemoveFromToday && (
          <button
            onClick={() => {
              onRemoveFromToday(item.id);
              onClose();
            }}
            className="mt-2 w-full rounded-xl py-2.5 text-sm font-semibold text-zinc-500"
          >
            Remove from today
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-400">{label}</dt>
      <dd className="text-right font-medium text-zinc-700">{children}</dd>
    </div>
  );
}
