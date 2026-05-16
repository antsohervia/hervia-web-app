"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InvitationLinkView({
  email,
  link,
}: {
  email: string;
  link: string;
}) {
  const t = useTranslations("users.invitations");
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>{t("linkSent", { email })}</AlertDescription>
      </Alert>
      <div className="space-y-2">
        <Label>{t("link")}</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            readOnly
            value={link}
            className="font-mono text-xs h-11 sm:h-9"
            onFocus={(e) => e.target.select()}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="shrink-0 w-full sm:w-auto h-11 sm:h-9"
          >
            {copied ? t("copied") : t("copy")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("validity")}</p>
      </div>
    </div>
  );
}
