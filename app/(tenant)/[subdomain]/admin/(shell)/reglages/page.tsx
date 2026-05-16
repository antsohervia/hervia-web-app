import { getTranslations } from "next-intl/server";
import { requireTenantSession } from "@/lib/auth/tenant-dal";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProfileForm } from "./_components/profile-form";
import { PasswordForm } from "./_components/password-form";
import { GoogleLink } from "./_components/google-link";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const session = await requireTenantSession(subdomain);
  const t = await getTranslations("settings");

  let hasGoogle = false;
  let hasPassword = false;
  if (!session.impersonating) {
    const admin = createSupabaseAdmin();
    const { data } = await admin.auth.admin.getUserById(session.userId);
    const identities = data?.user?.identities ?? [];
    hasGoogle = identities.some((i) => i.provider === "google");
    hasPassword = identities.some((i) => i.provider === "email");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <ProfileForm
        subdomain={subdomain}
        email={session.email ?? ""}
        fullName={session.fullName ?? ""}
        phone={session.phone ?? ""}
        readOnly={session.impersonating}
      />

      <section className="space-y-6 border-t pt-8">
        <div>
          <h2 className="text-lg font-semibold">{t("security.title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("security.subtitle")}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">{t("security.google.title")}</h3>
          <GoogleLink linked={hasGoogle} disabled={session.impersonating} />
        </div>

        <div className="space-y-3 border-t pt-6">
          <h3 className="text-sm font-medium">
            {t("security.password.title")}
          </h3>
          {hasPassword ? (
            <PasswordForm
              subdomain={subdomain}
              disabled={session.impersonating}
            />
          ) : (
            <Alert>
              <AlertDescription>
                {t("security.password.noPasswordNotice")}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </section>
    </div>
  );
}
