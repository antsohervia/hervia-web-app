"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Home, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorMessages = {
  code: string;
  title: string;
  description: string;
  retry: string;
  cta: string;
  digest: string;
};

const MESSAGES: Record<"fr" | "en" | "zh", ErrorMessages> = {
  fr: {
    code: "500",
    title: "Une erreur est survenue",
    description:
      "Un problème inattendu nous empêche d'afficher cette page. Nos équipes ont été notifiées — vous pouvez réessayer ou revenir à l'accueil.",
    retry: "Réessayer",
    cta: "Retour à l'accueil",
    digest: "Référence de l'erreur",
  },
  en: {
    code: "500",
    title: "Something went wrong",
    description:
      "An unexpected issue is preventing us from displaying this page. Our team has been notified — you can try again or return home.",
    retry: "Try again",
    cta: "Back to home",
    digest: "Error reference",
  },
  zh: {
    code: "500",
    title: "发生错误",
    description:
      "一个意外问题导致我们无法显示此页面。我们的团队已收到通知 — 您可以重试或返回首页。",
    retry: "重试",
    cta: "返回首页",
    digest: "错误参考",
  },
};

function readLocale(): "fr" | "en" | "zh" {
  if (typeof document === "undefined") return "fr";
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=(fr|en|zh)/);
  return (match?.[1] as "fr" | "en" | "zh") ?? "fr";
}

type Props = {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
};

export default function Error({ error, unstable_retry, reset }: Props) {
  const [locale, setLocale] = useState<"fr" | "en" | "zh">("fr");

  useEffect(() => {
    setLocale(readLocale());
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  const t = MESSAGES[locale];
  const retry = unstable_retry ?? reset;

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-12 bg-gradient-to-b from-background to-muted/40">
      <div className="w-full max-w-lg text-center space-y-6">
        <div className="flex justify-center">
          <div className="size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-[var(--accent-rose)] to-[var(--accent-violet)] flex items-center justify-center shadow-lg shadow-[var(--accent-rose)]/20">
            <AlertTriangle className="size-8 sm:size-10 text-white" />
          </div>
        </div>
        <p
          aria-hidden
          className="text-6xl sm:text-7xl font-extrabold tracking-tight text-muted-foreground/30 leading-none"
        >
          {t.code}
        </p>
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold">{t.title}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t.description}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-center pt-2">
          {retry ? (
            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => retry()}
            >
              <RotateCw />
              {t.retry}
            </Button>
          ) : null}
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Link href="/">
              <Home />
              {t.cta}
            </Link>
          </Button>
        </div>
        {error.digest ? (
          <p className="text-xs text-muted-foreground pt-2 font-mono">
            {t.digest} · {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}
