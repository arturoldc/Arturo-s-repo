"use client";

import { useState } from "react";
import { ItemType, TYPE_META, TYPE_ORDER } from "@/lib/types";

interface NewItem {
  type: ItemType;
  title: string;
  person?: string;
  due?: string;
}

export function AddItemDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (item: NewItem) => void;
}) {
  const [type, setType] = useState<ItemType>("task");
  const [title, setTitle] = useState("");
  const [person, setPerson] = useState("");
  const [due, setDue] = useState("");

  if (!open) return null;

  function submit() {
    if (!title.trim()) return;
    onAdd({
      type,
      title,
      person: person || undefined,
      due: due || undefined,
    });
    setTitle("");
    setPerson("");
    setDue("");
    setType("task");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white p-5 pb-8 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-zinc-200" />
        <h2 className="mb-4 text-lg font-bold">Add something</h2>

        <div className="mb-4 grid grid-cols-4 gap-2">
          {TYPE_ORDER.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${
                type === t
                  ? `${TYPE_META[t].badge} border-transparent`
                  : "border-zinc-200 text-zinc-500"
              }`}
            >
              {TYPE_META[t].label}
            </button>
          ))}
        </div>

        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="What is it? (one line)"
          className="mb-3 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
        />

        <div className="mb-5 flex gap-2">
          <input
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            placeholder="Who? (optional)"
            className="w-1/2 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
          />
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="w-1/2 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-600 outline-none focus:border-zinc-400"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-600"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!title.trim()}
            className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
