import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/dal";
import { ResetPasswordForm } from "./_form";

export default async function AdminResetPasswordPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Nouveau mot de passe</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Définissez un nouveau mot de passe pour votre compte.
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
