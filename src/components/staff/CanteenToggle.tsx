"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { api } from "@/lib/client";

/** Open/close the canteen for ordering. */
export function CanteenToggle({ open: initial }: { open: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !open;
    if (!next && !window.confirm("Stop taking new canteen orders?")) return;
    setBusy(true);
    try {
      const s = await api<{ open: boolean }>("/api/settings", { method: "PATCH", body: { canteenOpen: next } });
      setOpen(s.open);
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={clsx(
        "inline-flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold ring-1 transition",
        open ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-zinc-100 text-zinc-700 ring-zinc-200",
      )}
      aria-pressed={open}
    >
      <span className={clsx("relative h-6 w-11 rounded-full transition", open ? "bg-emerald-500" : "bg-zinc-300")}>
        <span className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", open ? "left-[22px]" : "left-0.5")} />
      </span>
      {open ? "Canteen open for orders" : "Canteen closed"}
    </button>
  );
}
