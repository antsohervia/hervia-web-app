import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/dal";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  await requirePlatformAdmin();
  redirect("/admin/dashboard");
}
