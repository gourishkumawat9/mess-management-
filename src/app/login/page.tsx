import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { allowedEmailDomains } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Log in to order from the canteen or manage the mess.">
      <Suspense>
        <AuthForm mode="login" domains={allowedEmailDomains()} />
      </Suspense>
      {process.env.NODE_ENV !== "production" && (
        <div className="mt-6 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500 ring-1 ring-zinc-200">
          <p className="font-semibold text-zinc-700">Demo accounts (development only)</p>
          <p className="mt-1">admin@iimsambalpur.ac.in · staff@iimsambalpur.ac.in · student@iimsambalpur.ac.in</p>
          <p>Passwords are the SEED_*_PASSWORD values in your .env.</p>
        </div>
      )}
    </AuthShell>
  );
}
