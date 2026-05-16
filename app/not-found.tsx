import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "./_error/back-button";

export default async function NotFound() {
  const t = await getTranslations("errors.notFound");

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-12 bg-gradient-to-b from-background to-muted/40">
      <div className="w-full max-w-lg text-center space-y-6">
        <p
          aria-hidden
          className="text-7xl sm:text-8xl font-extrabold tracking-tight bg-gradient-to-br from-brand to-[var(--accent-cyan)] bg-clip-text text-transparent leading-none"
        >
          {t("code")}
        </p>
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-center pt-2">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/">
              <Home />
              {t("cta")}
            </Link>
          </Button>
          <BackButton label={t("back")} className="w-full sm:w-auto" />
        </div>
      </div>
    </main>
  );
}
