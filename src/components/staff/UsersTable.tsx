"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Search } from "lucide-react";
import { api } from "@/lib/client";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/constants";
import { formatDate } from "@/lib/format";

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  active: boolean;
  createdAt: string;
}

export function UsersTable({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | Role>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) => (role === "all" || u.role === role) && (!q || u.name.toLowerCase().includes(q) || u.email.includes(q) || u.phone?.includes(q)),
    );
  }, [users, query, role]);

  async function update(user: UserRow, body: { role?: Role; active?: boolean }) {
    setBusyId(user.id);
    setError(null);
    try {
      await api(`/api/admin/users/${user.id}`, { method: "PATCH", body });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="page-title">Users &amp; roles</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Everyone signs up as a member who can order from the canteen. Make mess workers <b>Mess staff</b> so they can manage
        inventory and orders, and give <b>Admin</b> only to people who manage accounts.
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or phone" className="input pl-9" aria-label="Search users" />
        </label>
        <select value={role} onChange={(e) => setRole(e.target.value as "all" | Role)} className="input sm:w-48" aria-label="Role">
          <option value="all">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((u) => {
              const self = u.id === currentUserId;
              return (
                <tr key={u.id} className={clsx(!u.active && "bg-zinc-50 text-zinc-400")}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-zinc-900">
                      {u.name} {self && <span className="text-xs font-normal text-zinc-400">(you)</span>}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {u.email}
                      {u.phone ? ` · ${u.phone}` : ""}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={self || busyId === u.id}
                      onChange={(e) => update(u, { role: e.target.value as Role })}
                      className="input w-44 py-1.5"
                      aria-label={`Role for ${u.name}`}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => update(u, { active: !u.active })}
                      disabled={self || busyId === u.id}
                      className={clsx("btn-sm btn", u.active ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200")}
                    >
                      {u.active ? "Active" : "Deactivated"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-sm text-zinc-500">No users match.</p>}
      </div>
    </div>
  );
}
