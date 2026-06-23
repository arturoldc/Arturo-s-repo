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
import { SAMPLE_ITEMS } from "./sampleData";

const STORAGE_KEY = "commitments-v1";

interface NewItem {
  type: ItemType;
  title: string;
  person?: string;
  due?: string;
}

interface Store {
  items: Item[];
  hydrated: boolean;
  keep: (id: string) => void;
  discard: (id: string) => void;
  superLike: (id: string) => void;
  toggleDone: (id: string) => void;
  reorder: (orderedIds: string[]) => void;
  addItem: (item: NewItem) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>(SAMPLE_ITEMS);
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
    setHydrated(true);
  }, []);

  // Persist on every change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full / unavailable */
    }
  }, [items, hydrated]);

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

  const resetDemo = useCallback(() => setItems(SAMPLE_ITEMS), []);

  return (
    <StoreContext.Provider
      value={{
        items,
        hydrated,
        keep,
        discard,
        superLike,
        toggleDone,
        reorder,
        addItem,
        resetDemo,
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
