import { requireClientSession } from "@/lib/auth/client-dal";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordForm } from "./_components/password-form";
import { GoogleLink } from "./_components/google-link";
import { FacebookLink } from "./_components/facebook-link";

export default async function ClientSettingsPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const session = await requireClientSession(subdomain);

  const admin = createSupabaseAdmin();
  const { data } = await admin.auth.admin.getUserById(session.userId);
  const identities = data?.user?.identities ?? [];
  const hasGoogle = identities.some((i) => i.provider === "google");
  const hasFacebook = identities.some((i) => i.provider === "facebook");
  const hasPassword = identities.some((i) => i.provider === "email");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">Réglages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez votre mot de passe et vos connexions liées.
        </p>
      </div>

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Sécurité</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Changez votre mot de passe ou liez un compte social.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Mot de passe</h3>
          {hasPassword ? (
            <PasswordForm subdomain={subdomain} />
          ) : (
            <Alert>
              <AlertDescription>
                Vous vous connectez via un compte social. Aucun mot de passe
                n&apos;est défini.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-3 border-t pt-6">
          <h3 className="text-sm font-medium">Compte Google</h3>
          <GoogleLink linked={hasGoogle} />
        </div>

        <div className="space-y-3 border-t pt-6">
          <h3 className="text-sm font-medium">Compte Facebook</h3>
          <FacebookLink linked={hasFacebook} />
        </div>
      </section>
    </div>
  );
}
