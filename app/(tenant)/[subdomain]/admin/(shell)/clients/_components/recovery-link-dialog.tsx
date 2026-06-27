"use client";

import { useActionState, useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { GenerateRecoveryLinkState } from "@/lib/validations/client-admin";
import { generateRecoveryLinkAction } from "../_actions";

function RecoveryLinkView({ email, link }: { email: string; link: string }) {
  const t = useTranslations("clients.recovery");
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          {t("successDescription")}
        </AlertDescription>
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

export function RecoveryLinkDialog({
  subdomain,
  clientId,
  clientEmail,
}: {
  subdomain: string;
  clientId: string;
  clientEmail: string;
}) {
  const t = useTranslations("clients");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<
    GenerateRecoveryLinkState,
    FormData
  >(generateRecoveryLinkAction, {});

  useEffect(() => {
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state]);

  const success = state?.ok && state.recoveryLink;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="min-h-11 sm:min-h-9">
          <KeyRound className="size-4 mr-1" />
          {t("recovery.generate")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {success ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("recovery.successTitle")}</DialogTitle>
            </DialogHeader>
            <RecoveryLinkView
              email={state.clientEmail!}
              link={state.recoveryLink!}
            />
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>
                {t("recovery.close")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form action={action}>
            <input type="hidden" name="subdomain" value={subdomain} />
            <input type="hidden" name="clientId" value={clientId} />
            <DialogHeader>
              <DialogTitle>{t("recovery.title")}</DialogTitle>
              <DialogDescription>
                {t("recovery.description", { email: clientEmail })}
              </DialogDescription>
            </DialogHeader>

            {state?.errors?._form?.[0] ? (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{state.errors._form[0]}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto"
              >
                {t("form.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="w-full sm:w-auto"
              >
                {pending ? t("recovery.generating") : t("recovery.generate")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
