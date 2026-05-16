"use client";

import { useEffect, useState } from "react";

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
    title: "Une erreur critique est survenue",
    description:
      "L'application n'a pas pu démarrer correctement. Réessayez ou revenez à l'accueil.",
    retry: "Réessayer",
    cta: "Retour à l'accueil",
    digest: "Référence de l'erreur",
  },
  en: {
    code: "500",
    title: "A critical error occurred",
    description:
      "The application failed to start correctly. Try again or return home.",
    retry: "Try again",
    cta: "Back to home",
    digest: "Error reference",
  },
  zh: {
    code: "500",
    title: "发生严重错误",
    description: "应用无法正常启动。请重试或返回首页。",
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

export default function GlobalError({ error, unstable_retry, reset }: Props) {
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
    <html lang={locale}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 1.25rem",
          background:
            "linear-gradient(180deg, #ffffff 0%, rgba(241,245,249,0.6) 100%)",
          fontFamily:
            "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "32rem",
            textAlign: "center",
          }}
        >
          <p
            aria-hidden
            style={{
              fontSize: "4rem",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              margin: 0,
              color: "rgba(15,23,42,0.2)",
              lineHeight: 1,
            }}
          >
            {t.code}
          </p>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              margin: "1.5rem 0 0.75rem",
            }}
          >
            {t.title}
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              color: "#475569",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {t.description}
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              marginTop: "1.75rem",
            }}
          >
            {retry ? (
              <button
                type="button"
                onClick={() => retry()}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  border: 0,
                  background: "#0f172a",
                  color: "#fff",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {t.retry}
              </button>
            ) : null}
            <a
              href="/"
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #e2e8f0",
                background: "#fff",
                color: "#0f172a",
                fontSize: "0.9rem",
                fontWeight: 500,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              {t.cta}
            </a>
          </div>
          {error.digest ? (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                marginTop: "1.25rem",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              {t.digest} · {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
