"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TransportModeFormState } from "@/lib/validations/transport-mode";
import type { TransportMode } from "@/lib/transport-modes/repo";
import {
  createTransportModeAction,
  updateTransportModeAction,
} from "./_actions";

type Props =
  | { subdomain: string; mode: "create"; onDone: () => void; record?: undefined }
  | {
      subdomain: string;
      mode: "edit";
      record: TransportMode;
      onDone: () => void;
    };

export function TransportModeForm(props: Props) {
  const { subdomain, mode, onDone } = props;
  const t = useTranslations("transportModes");
  const tCommon = useTranslations("common");
  const action =
    mode === "create" ? createTransportModeAction : updateTransportModeAction;
  const [state, formAction, pending] = useActionState<
    TransportModeFormState,
    FormData
  >(action, {});

  const initial = mode === "edit" ? props.record : null;
  const [labelValue, setLabelValue] = useState(initial?.label ?? "");
  const autoCode = useMemo(() => slugify(labelValue), [labelValue]);

  useEffect(() => {
    if (state?.ok) {
      toast.success(mode === "create" ? t("created") : t("updated"));
      onDone();
    }
    if (state?.errors?._form?.[0]) toast.error(state.errors._form[0]);
  }, [state, onDone, mode, t]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="subdomain" value={subdomain} />
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      {state?.errors?._form?.[0] ? (
        <Alert variant="destructive">
          <AlertDescription>{state.errors._form[0]}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="label">
          {t("form.label")} <span className="text-destructive">{tCommon("required")}</span>
        </Label>
        <Input
          id="label"
          name="label"
          value={mode === "create" ? labelValue : undefined}
          defaultValue={mode === "edit" ? initial?.label : undefined}
          onChange={mode === "create" ? (e) => setLabelValue(e.target.value) : undefined}
          maxLength={60}
          required
          placeholder={t("form.labelPlaceholder")}
        />
        {mode === "create" && autoCode ? (
          <p className="text-xs text-muted-foreground">
            {t("form.codeHint")}{" "}
            <span className="font-mono text-foreground">{autoCode}</span>
          </p>
        ) : null}
        {state?.errors?.label?.[0] ? (
          <p className="text-xs text-destructive">{state.errors.label[0]}</p>
        ) : null}
      </div>

      {mode === "create" ? (
        <input type="hidden" name="code" value={autoCode} />
      ) : (
        <div className="space-y-2">
          <Label htmlFor="code">
            {t("form.internalCode")} <span className="text-destructive">{tCommon("required")}</span>
          </Label>
          <Input
            id="code"
            name="code"
            defaultValue={initial?.code}
            placeholder="ex: maritime"
            maxLength={40}
            required
          />
          <p className="text-xs text-muted-foreground">
            {t("form.codeDescription")}
          </p>
          {state?.errors?.code?.[0] ? (
            <p className="text-xs text-destructive">{state.errors.code[0]}</p>
          ) : null}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          className="w-full sm:w-auto"
        >
          {tCommon("cancel")}
        </Button>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? tCommon("saving") : tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
