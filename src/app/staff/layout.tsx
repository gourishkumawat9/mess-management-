import { StaffNav } from "@/components/staff/StaffNav";
import { requirePageUser } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/constants";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser(STAFF_ROLES, "/staff");
  return (
    <div className="mx-auto w-full max-w-7xl animate-page-in px-4 pt-6 sm:px-6 lg:flex lg:gap-8">
      <StaffNav role={user.role} />
      <div className="min-w-0 flex-1 pb-24">{children}</div>
    </div>
  );
}
