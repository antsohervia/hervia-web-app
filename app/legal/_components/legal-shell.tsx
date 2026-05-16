import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type LegalShellProps = {
  title: string;
  lastUpdated: string;
  intro?: ReactNode;
  children: ReactNode;
};

export function LegalShell({ title, lastUpdated, intro, children }: LegalShellProps) {
  return (
    <article className="space-y-8">
      <header className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Retour à l&apos;accueil
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-sm text-foreground/60">
          Dernière mise à jour&nbsp;: {lastUpdated}
        </p>
        {intro && (
          <div className="text-base text-foreground/80 leading-relaxed">
            {intro}
          </div>
        )}
      </header>
      <div className="space-y-8 text-foreground/85 leading-relaxed [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-brand-secondary">
        {children}
      </div>
    </article>
  );
}
