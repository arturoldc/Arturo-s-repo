"use client";

import { PriorityPicker } from "./PriorityPicker";

// Bottom-sheet for adjusting today's priorities after the ritual (plans change).
// Same modal style as DetailDrawer. No hard cap — ad-hoc daytime edits allowed.
export function TodayEditSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-zinc-200" />
        <h2 className="mb-3 text-xl font-bold leading-snug">Edit today</h2>

        <PriorityPicker />

        <button
          onClick={onClose}
          className="mt-8 w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white shadow-sm active:scale-[0.99]"
        >
          Done
        </button>
      </div>
    </div>
  );
}
