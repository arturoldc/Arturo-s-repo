"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ReviewDeck } from "@/components/morning/ReviewDeck";
import { MorningInbox } from "@/components/morning/MorningInbox";
import { ConfirmPriorities } from "@/components/morning/ConfirmPriorities";

type Step = "review" | "inbox" | "confirm";

const STEPS: { key: Step; title: string; subtitle: string }[] = [
  {
    key: "review",
    title: "Yesterday's priorities",
    subtitle: "← keep · → done · ↑ still today",
  },
  {
    key: "inbox",
    title: "New from your notes",
    subtitle: "Keep what's yours, toss the rest.",
  },
  {
    key: "confirm",
    title: "Today's focus",
    subtitle: "Lock in 3–4 things for today.",
  },
];

export default function MorningPage() {
  const { hydrated } = useStore();
  const [step, setStep] = useState<Step>("review");

  const meta = STEPS.find((s) => s.key === step)!;
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="px-5 pt-6">
      <header className="mb-4">
        <div className="mb-3 flex gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? "bg-zinc-900" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{meta.title}</h1>
        <p className="text-sm text-zinc-500">{meta.subtitle}</p>
      </header>

      {!hydrated ? (
        <div className="mx-auto h-[460px] w-full max-w-sm animate-pulse rounded-3xl bg-zinc-200" />
      ) : (
        <>
          {step === "review" && (
            <ReviewDeck onComplete={() => setStep("inbox")} />
          )}
          {step === "inbox" && (
            <MorningInbox onComplete={() => setStep("confirm")} />
          )}
          {step === "confirm" && <ConfirmPriorities />}
        </>
      )}
    </div>
  );
}
