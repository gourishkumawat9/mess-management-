import { StaffNav } from "@/components/staff/StaffNav";
import { requirePageUser } from "@/lib/auth";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser(["STAFF", "ADMIN"], "/staff");
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:flex lg:gap-8">
      <StaffNav isAdmin={user.role === "ADMIN"} />
      <div className="min-w-0 flex-1 pb-24">{children}</div>
    </div>
  );
}
