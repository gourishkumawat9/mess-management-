"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { api } from "@/lib/client";

/**
 * Open/close the canteen for ordering. Even when switched on, orders are only
 * taken inside the canteen timings, so outside them the label says when they start.
 */
export function CanteenToggle({ open: initial, hours, inHours = true }: { open: boolean; hours?: string; inHours?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !open;
    if (!next && !window.confirm("Stop taking new canteen orders?")) return;
    setBusy(true);
    try {
      const s = await api<{ switchOn: boolean }>("/api/settings", { method: "PATCH", body: { canteenOpen: next } });
      setOpen(s.switchOn);
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  async function editHours() {
    const text = window.prompt(
      "Ordering hours (India time), e.g. 9:00 PM – 4:00 AM. Use 12:00 AM – 12:00 AM for all day.",
      hours ?? "",
    );
    if (text === null || !text.trim()) return;
    setBusy(true);
    try {
      await api("/api/settings", { method: "PATCH", body: { canteenHours: text.trim() } });
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
    <button
      onClick={toggle}
      disabled={busy}
      className={clsx(
        "inline-flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm ring-1 transition",
        open ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-white text-zinc-700 ring-zinc-200",
      )}
      aria-pressed={open}
    >
      <span className={clsx("relative h-6 w-11 rounded-full transition", open ? "bg-emerald-500" : "bg-zinc-300")}>
        <span className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", open ? "left-[22px]" : "left-0.5")} />
      </span>
      {!open ? "Canteen closed" : inHours ? "Canteen open for orders" : `On · orders start ${hours?.split("–")[0]?.trim() ?? "at opening time"}`}
    </button>
    {hours && (
      <button onClick={editHours} disabled={busy} className="text-xs font-semibold underline decoration-dotted underline-offset-2 opacity-80 hover:opacity-100">
        Ordering hours: {hours} · change
      </button>
    )}
    </div>
  );
}
