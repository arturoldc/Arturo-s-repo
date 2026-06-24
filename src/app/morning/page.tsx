"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { yesterdaysPriorities } from "@/lib/priorities";
import { todayKey } from "@/lib/day";
import { ReviewDeck } from "@/components/morning/ReviewDeck";
import { MorningInbox } from "@/components/morning/MorningInbox";
import { ConfirmPriorities } from "@/components/morning/ConfirmPriorities";

type Step = "review" | "inbox" | "confirm";

// Each stage owns a color so the whole screen shifts mood between steps —
// caught by peripheral vision even while you're focused on the card. Class
// strings are literal so Tailwind's JIT scans them.
interface Stage {
  n: number;
  icon: string;
  title: string;
  subtitle: string;
  bar: string; // progress segment fill
  wash: string; // top background gradient `from-*`
  accentText: string;
  iconBg: string;
}

const STAGES: Record<Step, Stage> = {
  review: {
    n: 1,
    icon: "🌙",
    title: "Yesterday's priorities",
    subtitle: "← still pending · → done",
    bar: "bg-amber-400",
    wash: "from-amber-100",
    accentText: "text-amber-600",
    iconBg: "bg-amber-100",
  },
  inbox: {
    n: 2,
    icon: "📥",
    title: "New from your notes",
    subtitle: "Keep what's yours, toss the rest.",
    bar: "bg-sky-400",
    wash: "from-sky-100",
    accentText: "text-sky-600",
    iconBg: "bg-sky-100",
  },
  confirm: {
    n: 3,
    icon: "⭐",
    title: "Today's focus",
    subtitle: "Lock in 3–4 things for today.",
    bar: "bg-emerald-400",
    wash: "from-emerald-100",
    accentText: "text-emerald-600",
    iconBg: "bg-emerald-100",
  },
};

const ORDER: Step[] = ["review", "inbox", "confirm"];

export default function MorningPage() {
  const { hydrated, items } = useStore();
  const [step, setStep] = useState<Step>("review");
  const [intro, setIntro] = useState<Step | null>("review");

  function hasContent(s: Step): boolean {
    if (s === "review") return yesterdaysPriorities(items, todayKey()).length > 0;
    if (s === "inbox") return items.some((i) => i.status === "pending");
    return true; // confirm always shows
  }

  // Advance to a stage: show its intro splash first; skip the splash for an
  // empty deck (it would just auto-advance again). Called from deck callbacks.
  function go(next: Step) {
    if (hasContent(next)) setIntro(next);
    else {
      setIntro(null);
      setStep(next);
    }
  }

  // While an intro splash is up, drop into that stage after a beat.
  useEffect(() => {
    if (!hydrated || intro === null) return;
    const id = setTimeout(() => {
      setStep(intro);
      setIntro(null);
    }, 950);
    return () => clearTimeout(id);
  }, [hydrated, intro]);

  const active = intro ?? step;
  const stage = STAGES[active];
  const activeIndex = ORDER.indexOf(active);

  return (
    <div className="relative min-h-dvh px-5 pt-6">
      {/* per-stage background wash */}
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-0 h-72 bg-gradient-to-b ${stage.wash} to-transparent`}
      />

      <div className="relative z-10">
        <header className="mb-4">
          <div className="mb-3 flex gap-1.5">
            {ORDER.map((s, i) => (
              <span
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i <= activeIndex ? STAGES[s].bar : "bg-zinc-200"
                }`}
              />
            ))}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{stage.title}</h1>
          <p className="text-sm text-zinc-500">{stage.subtitle}</p>
        </header>

        {!hydrated ? (
          <div className="mx-auto h-[460px] w-full max-w-sm animate-pulse rounded-3xl bg-zinc-200" />
        ) : (
          <AnimatePresence mode="wait">
            {intro ? (
              <StageIntro key={`intro-${intro}`} stage={STAGES[intro]} />
            ) : step === "review" ? (
              <DeckFade key="review">
                <ReviewDeck onComplete={() => go("inbox")} />
              </DeckFade>
            ) : step === "inbox" ? (
              <DeckFade key="inbox">
                <MorningInbox onComplete={() => go("confirm")} />
              </DeckFade>
            ) : (
              <DeckFade key="confirm">
                <ConfirmPriorities />
              </DeckFade>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function DeckFade({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function StageIntro({ stage }: { stage: Stage }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.3 }}
      className="flex h-[460px] flex-col items-center justify-center text-center"
    >
      <div
        className={`flex h-24 w-24 items-center justify-center rounded-[1.75rem] ${stage.iconBg} text-5xl shadow-sm`}
      >
        {stage.icon}
      </div>
      <p
        className={`mt-6 text-xs font-bold uppercase tracking-[0.2em] ${stage.accentText}`}
      >
        Step {stage.n} of 3
      </p>
      <h2 className="mt-1.5 text-2xl font-bold tracking-tight">{stage.title}</h2>
      <p className="mt-1 text-sm text-zinc-500">{stage.subtitle}</p>
    </motion.div>
  );
}
