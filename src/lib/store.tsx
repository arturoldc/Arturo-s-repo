"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Item, ItemType } from "./types";
import { IngestedItem } from "./connectors/types";
import { SAMPLE_ITEMS } from "./sampleData";
import { todayKey } from "./day";

const STORAGE_KEY = "commitments-v1";
const DAY_KEY = "commitments-day-v1";

interface NewItem {
  type: ItemType;
  title: string;
  person?: string;
  due?: string;
}

interface DayState {
  lastVisitDate: string | null;
  ritualDoneFor: string | null;
}

const INITIAL_DAY: DayState = { lastVisitDate: null, ritualDoneFor: null };

interface Store {
  items: Item[];
  hydrated: boolean;
  /** True once a new day has begun and the morning ritual hasn't been completed yet. */
  ritualDue: boolean;
  keep: (id: string) => void;
  discard: (id: string) => void;
  superLike: (id: string) => void;
  toggleDone: (id: string) => void;
  reorder: (orderedIds: string[]) => void;
  addItem: (item: NewItem) => void;
  /** Fold connector results into the inbox as pending items; returns count added. */
  ingestItems: (incoming: IngestedItem[]) => number;
  resetDemo: () => void;
  // Daily "Today's priorities" ritual
  setPriorityToday: (id: string) => void;
  removePriorityToday: (id: string) => void;
  completePriority: (id: string) => void;
  reorderPriorities: (orderedIds: string[]) => void;
  markRitualComplete: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>(SAMPLE_ITEMS);
  const [dayState, setDayState] = useState<DayState>(INITIAL_DAY);
  const [hydrated, setHydrated] = useState(false);
  const didHydrate = useRef(false);

  // Load from localStorage once, on the client, to avoid hydration mismatch.
  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as Item[]);
    } catch {
      /* ignore corrupt storage */
    }
    try {
      const rawDay = localStorage.getItem(DAY_KEY);
      if (rawDay) setDayState({ ...INITIAL_DAY, ...JSON.parse(rawDay) });
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  // Persist items on every change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full / unavailable */
    }
  }, [items, hydrated]);

  // Persist day-state separately so the item payload schema is untouched.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(DAY_KEY, JSON.stringify(dayState));
    } catch {
      /* storage full / unavailable */
    }
  }, [dayState, hydrated]);

  // Ritual is due whenever it hasn't been completed for today yet.
  // (lastVisitDate is stamped in markRitualComplete; it isn't used for gating.)
  const ritualDue = hydrated && dayState.ritualDoneFor !== todayKey();

  const patch = useCallback((id: string, changes: Partial<Item>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...changes } : it)),
    );
  }, []);

  const keep = useCallback(
    (id: string) => patch(id, { status: "kept" }),
    [patch],
  );

  const discard = useCallback(
    (id: string) => patch(id, { status: "discarded" }),
    [patch],
  );

  // Super-like: keep it AND float it to the very top (most-negative rank wins).
  const superLike = useCallback(
    (id: string) =>
      patch(id, { status: "kept", pinned: true, sortRank: -Date.now() }),
    [patch],
  );

  const toggleDone = useCallback(
    (id: string) =>
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, status: it.status === "done" ? "kept" : "done" }
            : it,
        ),
      ),
    [],
  );

  // Reassign manual rank for the dragged set, by their new visual order.
  const reorder = useCallback((orderedIds: string[]) => {
    const rank = new Map(orderedIds.map((id, i) => [id, i]));
    setItems((prev) =>
      prev.map((it) =>
        rank.has(it.id) ? { ...it, sortRank: rank.get(it.id)! } : it,
      ),
    );
  }, []);

  const addItem = useCallback((item: NewItem) => {
    const newItem: Item = {
      id: `manual-${Date.now()}`,
      type: item.type,
      title: item.title.trim(),
      source: "Manual",
      person: item.person?.trim() || undefined,
      due: item.due || undefined,
      status: "kept",
      pinned: false,
      sortRank: null,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, newItem]);
  }, []);

  // Fold connector output into the inbox. Dedup by externalId so re-syncing the
  // same Slack channel never creates duplicates. Returns how many were added.
  const ingestItems = useCallback(
    (incoming: IngestedItem[]): number => {
      const existing = new Set(
        items.map((it) => it.externalId).filter(Boolean) as string[],
      );
      const fresh: Item[] = [];
      for (const inc of incoming) {
        if (existing.has(inc.externalId)) continue;
        existing.add(inc.externalId); // also dedup within this batch
        fresh.push({
          id: `ext-${inc.externalId}`,
          type: inc.type,
          title: inc.title,
          source: inc.source,
          person: inc.person,
          due: inc.due,
          status: "pending",
          pinned: false,
          sortRank: null,
          createdAt: new Date().toISOString(),
          externalId: inc.externalId,
        });
      }
      if (fresh.length) {
        // Guard again against prev inside the updater in case of a racing sync.
        setItems((prev) => {
          const have = new Set(
            prev.map((it) => it.externalId).filter(Boolean) as string[],
          );
          const toAdd = fresh.filter((f) => !have.has(f.externalId!));
          return toAdd.length ? [...prev, ...toAdd] : prev;
        });
      }
      return fresh.length;
    },
    [items],
  );

  const resetDemo = useCallback(() => {
    setItems(SAMPLE_ITEMS);
    setDayState(INITIAL_DAY); // re-arm the ritual after a reset
  }, []);

  // --- Today's priorities ritual ---

  // "⭐ Do today": slot the item for today's focus (separate from pinned/super-like).
  const setPriorityToday = useCallback(
    (id: string) => patch(id, { priorityDate: todayKey() }),
    [patch],
  );

  const removePriorityToday = useCallback(
    (id: string) => patch(id, { priorityDate: null }),
    [patch],
  );

  // Review deck RIGHT = done. (toggleDone stays the generic toggle elsewhere.)
  const completePriority = useCallback(
    (id: string) => patch(id, { status: "done" }),
    [patch],
  );

  // Reassign manual order within the Today list.
  const reorderPriorities = useCallback((orderedIds: string[]) => {
    const rank = new Map(orderedIds.map((id, i) => [id, i]));
    setItems((prev) =>
      prev.map((it) =>
        rank.has(it.id) ? { ...it, priorityRank: rank.get(it.id)! } : it,
      ),
    );
  }, []);

  const markRitualComplete = useCallback(() => {
    const t = todayKey();
    setDayState((s) => ({ ...s, ritualDoneFor: t, lastVisitDate: t }));
  }, []);

  return (
    <StoreContext.Provider
      value={{
        items,
        hydrated,
        ritualDue,
        keep,
        discard,
        superLike,
        toggleDone,
        reorder,
        addItem,
        ingestItems,
        resetDemo,
        setPriorityToday,
        removePriorityToday,
        completePriority,
        reorderPriorities,
        markRitualComplete,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
