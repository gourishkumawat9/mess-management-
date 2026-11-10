"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { api } from "@/lib/client";
import { STAFF_ROLES, hasRole, type Role } from "@/lib/constants";

function safeNext(next: string | null) {
  // Only same-site paths, never "//evil.com".
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export function AuthForm({ mode, domains }: { mode: "login" | "register"; domains: string[] }) {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [form, setForm] = useState({ name: "", email: "", phone: "", hostel: "", room: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { user } = await api<{ user: { role: Role } }>(`/api/auth/${mode}`, {
        body:
          mode === "login"
            ? { email: form.email, password: form.password }
            : {
                name: form.name,
                email: form.email,
                phone: form.phone,
                hostel: form.hostel,
                room: form.room,
                password: form.password,
              },
      });
      const staff = hasRole(user.role, STAFF_ROLES);
      // Full page load so the header picks up the new session.
      window.location.assign(next ?? (staff ? "/staff" : "/"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  const otherHref = `${mode === "login" ? "/register" : "/login"}${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "register" && (
        <div>
          <label htmlFor="name" className="label">Full name</label>
          <input id="name" required autoComplete="name" value={form.name} onChange={set("name")} className="input" placeholder="Your name" />
        </div>
      )}
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={set("email")}
          className="input"
          placeholder={domains[0] ? `you@${domains[0]}` : "you@example.com"}
        />
      </div>
      {mode === "register" && (
        <div>
          <label htmlFor="phone" className="label">Phone (optional)</label>
          <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} className="input" placeholder="For pickup calls" />
        </div>
      )}
      {mode === "register" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="hostel" className="label">Hostel (optional)</label>
            <input id="hostel" value={form.hostel} onChange={set("hostel")} maxLength={40} className="input" placeholder="e.g. H3" />
          </div>
          <div>
            <label htmlFor="room" className="label">Room no. (optional)</label>
            <input id="room" value={form.room} onChange={set("room")} maxLength={20} className="input" placeholder="e.g. 214" />
          </div>
          <p className="col-span-2 -mt-1 text-xs text-zinc-500">For room delivery. You can also add it at checkout.</p>
        </div>
      )}
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input
          id="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={form.password}
          onChange={set("password")}
          className="input"
          placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
        />
      </div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full py-3">
        {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}
        {mode === "login" ? "Log in" : "Create account"}
      </button>
      <p className="text-center text-sm text-zinc-500">
        {mode === "login" ? "New here? " : "Already have an account? "}
        <Link href={otherHref} className="font-semibold text-brand-600 hover:text-brand-700">
          {mode === "login" ? "Create an account" : "Log in"}
        </Link>
      </p>
    </form>
  );
}
