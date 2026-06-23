"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

// Auto-launches the morning ritual once per page-load session when it's due.
// Module-level guard => we redirect at most once, so a user who deliberately
// navigates away after seeing it isn't trapped on /morning.
let didAutoRedirect = false;

export function RitualGate() {
  const { ritualDue, hydrated } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (didAutoRedirect) return;
    if (hydrated && ritualDue && pathname !== "/morning") {
      didAutoRedirect = true;
      router.replace("/morning");
    }
  }, [hydrated, ritualDue, pathname, router]);

  return null;
}
