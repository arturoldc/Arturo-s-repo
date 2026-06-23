import { Item } from "@/lib/types";
import { ageInDays, dueLabel, dueState } from "@/lib/ordering";
import { TypeBadge } from "./TypeBadge";

const DUE_BORDER: Record<string, string> = {
  overdue: "border-l-rose-400",
  soon: "border-l-amber-400",
  ok: "border-l-emerald-400",
  none: "border-l-zinc-200",
};

const DUE_CHIP: Record<string, string> = {
  overdue: "bg-rose-100 text-rose-700",
  soon: "bg-amber-100 text-amber-700",
  ok: "bg-zinc-100 text-zinc-600",
  none: "bg-zinc-100 text-zinc-600",
};

export function ItemCard({
  item,
  onToggleDone,
  onOpen,
  subdued = false,
}: {
  item: Item;
  onToggleDone: () => void;
  onOpen: () => void;
  /** Done-section styling: greyed, neutral border, no strikethrough. */
  subdued?: boolean;
}) {
  const ds = dueState(item);
  const due = dueLabel(item);
  const done = item.status === "done";

  return (
    <div
      className={`relative rounded-2xl border border-l-4 border-zinc-200 bg-white shadow-sm ${
        subdued ? DUE_BORDER.none + " opacity-60" : DUE_BORDER[ds]
      }`}
    >
      <button
        onClick={onOpen}
        className="flex w-full flex-col gap-2 py-3 pl-9 pr-10 text-left"
      >
        <div className="flex items-center gap-2">
          <TypeBadge type={item.type} />
          {item.pinned && (
            <span title="Super-liked" className="text-sm">
              📌
            </span>
          )}
        </div>

        <h3
          className={`text-[15px] font-semibold leading-snug text-zinc-900 ${
            done && !subdued ? "line-through" : ""
          }`}
        >
          {item.title}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {item.person && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600">
              👤 {item.person}
            </span>
          )}
          {due && (
            <span
              className={`rounded-full px-2 py-0.5 font-medium ${DUE_CHIP[ds]}`}
            >
              📅 {due}
            </span>
          )}
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-500">
            {ageInDays(item)}d
          </span>
          <span className="ml-auto truncate text-zinc-400">{item.source}</span>
        </div>
      </button>

      {/* done toggle */}
      <button
        onClick={onToggleDone}
        aria-label={done ? "Mark not done" : "Mark done"}
        className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border text-xs transition-colors ${
          done
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-zinc-300 text-transparent hover:border-emerald-400"
        }`}
      >
        ✓
      </button>
    </div>
  );
}
