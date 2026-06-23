"use client";

import { forwardRef, useImperativeHandle } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Item, TYPE_META } from "@/lib/types";
import { dueLabel } from "@/lib/ordering";
import { TypeBadge } from "./TypeBadge";

export type Decision = "keep" | "discard" | "super";

export interface SwipeCardHandle {
  swipe: (d: Decision) => void;
}

const SWIPE = 110; // px threshold

export const SwipeCard = forwardRef<
  SwipeCardHandle,
  { item: Item; onDecision: (d: Decision) => void }
>(function SwipeCard({ item, onDecision }, ref) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-16, 16]);

  const keepOpacity = useTransform(x, [20, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, -20], [1, 0]);
  const superOpacity = useTransform(y, [-120, -20], [1, 0]);

  const meta = TYPE_META[item.type];
  const due = dueLabel(item);

  function flyOut(d: Decision) {
    const target =
      d === "keep"
        ? { x: 600, y: 0 }
        : d === "discard"
          ? { x: -600, y: 0 }
          : { x: 0, y: -700 };
    animate(x, target.x, { duration: 0.28 });
    animate(y, target.y, { duration: 0.28, onComplete: () => onDecision(d) });
  }

  useImperativeHandle(ref, () => ({ swipe: flyOut }));

  return (
    <motion.div
      style={{ x, y, rotate }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        const { offset, velocity } = info;
        if (offset.y < -SWIPE || velocity.y < -800) flyOut("super");
        else if (offset.x > SWIPE || velocity.x > 800) flyOut("keep");
        else if (offset.x < -SWIPE || velocity.x < -800) flyOut("discard");
        else {
          animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
          animate(y, 0, { type: "spring", stiffness: 500, damping: 35 });
        }
      }}
      whileTap={{ cursor: "grabbing" }}
      className="absolute inset-0 flex cursor-grab touch-none flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl"
    >
      {/* top accent in the type color */}
      <div className={`h-2 w-full bg-gradient-to-r ${meta.glow}`} />

      <div className="flex flex-1 flex-col p-6">
        <TypeBadge type={item.type} size="lg" />

        <h2 className="mt-5 text-2xl font-bold leading-snug text-zinc-900">
          {item.title}
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {item.person && <Chip>👤 {item.person}</Chip>}
          {due && <Chip>📅 {due}</Chip>}
        </div>

        <div className="mt-auto pt-6 text-sm text-zinc-400">{item.source}</div>
      </div>

      {/* decision stamps */}
      <motion.div
        style={{ opacity: keepOpacity }}
        className="pointer-events-none absolute left-5 top-20 -rotate-12 rounded-xl border-4 border-emerald-500 px-3 py-1 text-2xl font-black uppercase text-emerald-500"
      >
        Keep
      </motion.div>
      <motion.div
        style={{ opacity: nopeOpacity }}
        className="pointer-events-none absolute right-5 top-20 rotate-12 rounded-xl border-4 border-rose-500 px-3 py-1 text-2xl font-black uppercase text-rose-500"
      >
        Nope
      </motion.div>
      <motion.div
        style={{ opacity: superOpacity }}
        className="pointer-events-none absolute inset-x-0 bottom-24 mx-auto w-fit rounded-xl border-4 border-amber-400 px-3 py-1 text-2xl font-black uppercase text-amber-500"
      >
        ★ Super
      </motion.div>
    </motion.div>
  );
});

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600">
      {children}
    </span>
  );
}
