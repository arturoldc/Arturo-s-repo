"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

export function BottomNav() {
  const pathname = usePathname();
  const { items, hydrated } = useStore();
  const pending = hydrated
    ? items.filter((i) => i.status === "pending").length
    : 0;

  const tabs = [
    { href: "/inbox", label: "Inbox", icon: "🗂️", badge: pending },
    { href: "/", label: "Dashboard", icon: "📊", badge: 0 },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors ${
                active ? "text-zinc-900" : "text-zinc-400"
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="absolute right-1/2 top-1.5 -mr-5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
              {active && (
                <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-zinc-900" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
