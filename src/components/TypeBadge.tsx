import { ItemType, TYPE_META } from "@/lib/types";

export function TypeBadge({
  type,
  size = "sm",
}: {
  type: ItemType;
  size?: "sm" | "lg";
}) {
  const meta = TYPE_META[type];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${meta.badge} ${
        size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
