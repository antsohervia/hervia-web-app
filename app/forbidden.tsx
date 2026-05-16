import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Home, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "./_error/back-button";

export default async function Forbidden() {
  const t = await getTranslations("errors.forbidden");

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-12 bg-gradient-to-b from-background to-muted/40">
      <div className="w-full max-w-lg text-center space-y-6">
        <div className="flex justify-center">
          <div className="size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-[var(--accent-amber)] to-[var(--accent-rose)] flex items-center justify-center shadow-lg shadow-[var(--accent-rose)]/20">
            <ShieldAlert className="size-8 sm:size-10 text-white" />
          </div>
        </div>
        <p
          aria-hidden
          className="text-6xl sm:text-7xl font-extrabold tracking-tight text-muted-foreground/30 leading-none"
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
