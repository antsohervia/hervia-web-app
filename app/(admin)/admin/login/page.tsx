import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/dal";
import { LoginForm } from "./_login-form";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const session = await getSession();
  if (session?.role === "platform_admin") redirect("/admin/dashboard");

  const { error } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Connexion administrateur</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {"Accès réservé à l'équipe TrackApp"}
          </p>
        </div>
        <LoginForm initialError={error} />
      </div>
    </main>
  );
}
