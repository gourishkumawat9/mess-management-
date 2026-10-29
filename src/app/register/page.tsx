import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { allowedEmailDomains } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  const domains = allowedEmailDomains();
  return (
    <AuthShell
      title="Create your account"
      subtitle={
        domains.length
          ? `For the IIM Sambalpur community. Use your @${domains.join(" or @")} email.`
          : "For the IIM Sambalpur community: students, faculty and staff."
      }
    >
      <Suspense>
        <AuthForm mode="register" domains={domains} />
      </Suspense>
    </AuthShell>
  );
}
