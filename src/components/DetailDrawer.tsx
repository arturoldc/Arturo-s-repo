"use client";

import { Item } from "@/lib/types";
import { ageInDays, dueLabel } from "@/lib/ordering";
import { TypeBadge } from "./TypeBadge";

export function DetailDrawer({
  item,
  onClose,
  onToggleDone,
}: {
  item: Item | null;
  onClose: () => void;
  onToggleDone: (id: string) => void;
}) {
  if (!item) return null;
  const done = item.status === "done";
  const due = dueLabel(item);

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

        <dl className="mt-4 space-y-2 text-sm">
          {item.person && <Row label="Who">{item.person}</Row>}
          {due && <Row label="Due">{due}</Row>}
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
