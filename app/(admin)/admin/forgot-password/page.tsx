import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/dal";
import { ForgotPasswordForm } from "./_form";

export default async function AdminForgotPasswordPage() {
  const session = await getSession();
  if (session?.role === "platform_admin") redirect("/admin/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Mot de passe oublié</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Saisissez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
