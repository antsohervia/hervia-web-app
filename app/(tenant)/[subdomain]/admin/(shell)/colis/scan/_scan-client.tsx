"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ScanBarcode,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scanStatusAction } from "../_actions";

type StatusOpt = { id: string; label: string; color: string };
type TransportModeOpt = { id: string; label: string };

type ScanEntry = {
  entryId: number;
  reference: string;
  pending: boolean;
  ok?: boolean;
  clientName?: string | null;
  created?: boolean;
  errorType?: "already_at_status" | "is_final" | "error";
  errorMessage?: string;
};

type Props = {
  subdomain: string;
  statuses: StatusOpt[];
  transportModes: TransportModeOpt[];
};

export function ScanClient({ subdomain, statuses, transportModes }: Props) {
  const t = useTranslations("scan");
  const tCommon = useTranslations("common");
  const tParcels = useTranslations("parcels");

  const [statusId, setStatusId] = useState(statuses[0]?.id ?? "");
  const [transportModeId, setTransportModeId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [entries, setEntries] = useState<ScanEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  const processRef = useCallback(
    (ref: string) => {
      const trimmed = ref.trim().toUpperCase();
      if (!trimmed || !statusId) return;
      const entryId = ++counterRef.current;
      setInputValue("");
      setEntries((prev) => [...prev, { entryId, reference: trimmed, pending: true }]);
      inputRef.current?.focus();

      scanStatusAction(trimmed, statusId, transportModeId || null, subdomain).then((result) => {
        setEntries((prev) =>
          prev.map((e) =>
            e.entryId === entryId
              ? { ...result, entryId, pending: false }
              : e,
          ),
        );
      });
    },
    [statusId, transportModeId, subdomain],
  );

  if (!statuses.length) {
    return (
      <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-1">
          <Link href="/admin/colis">
            <ArrowLeft className="size-4 mr-1" />
            {tCommon("back")}
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">{t("noStatuses")}</p>
      </div>
    );
  }

  const okCount = entries.filter((e) => !e.pending && e.ok).length;
  const errCount = entries.filter((e) => !e.pending && !e.ok).length;
  const pendingCount = entries.filter((e) => e.pending).length;
  const targetStatus = statuses.find((s) => s.id === statusId);

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-1">
          <Link href="/admin/colis">
            <ArrowLeft className="size-4 mr-1" />
            {tCommon("back")}
          </Link>
        </Button>
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <ScanBarcode className="size-5" />
          {tParcels("scanBatch")}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scan-status">{t("targetStatus")}</Label>
          <select
            id="scan-status"
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
            className="flex h-11 sm:h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base sm:text-sm shadow-sm"
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="scan-transport">{t("deliveryMode")}</Label>
          <select
            id="scan-transport"
            value={transportModeId}
            onChange={(e) => setTransportModeId(e.target.value)}
            className="flex h-11 sm:h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base sm:text-sm shadow-sm"
          >
            <option value="">{t("noMode")}</option>
            {transportModes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          autoFocus
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              processRef(inputValue);
            }
          }}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="h-11 sm:h-9 font-mono"
        />
        <Button
          type="button"
          onClick={() => processRef(inputValue)}
          disabled={!inputValue.trim()}
          className="h-11 sm:h-9 px-4 shrink-0"
        >
          OK
        </Button>
      </div>

      {entries.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {entries.length > 1
              ? t("scannedPlural", { count: entries.length })
              : t("scanned", { count: entries.length })}
            {pendingCount > 0 && (
              <>
                {" · "}
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" />
                  {t("inProgress", { count: pendingCount })}
                </span>
              </>
            )}
            {okCount > 0 && (
              <>
                {" · "}
                <span className="text-green-600 font-medium">
                  {t("successCount", { count: okCount })}
                </span>
              </>
            )}
            {errCount > 0 && (
              <>
                {" · "}
                <span className="text-destructive font-medium">
                  {errCount > 1
                    ? t("errorCountPlural", { count: errCount })
                    : t("errorCount", { count: errCount })}
                </span>
              </>
            )}
          </p>

          <ul className="space-y-2 max-h-[28rem] overflow-y-auto">
            {entries.map((e) => (
              <li
                key={e.entryId}
                className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
              >
                {e.pending ? (
                  <Loader2 className="size-4 text-muted-foreground shrink-0 animate-spin" />
                ) : e.ok ? (
                  <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                ) : e.errorType === "already_at_status" ? (
                  <AlertCircle className="size-4 text-amber-500 shrink-0" />
                ) : (
                  <XCircle className="size-4 text-destructive shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-sm font-medium">{e.reference}</span>
                  {!e.pending && e.ok && e.clientName && (
                    <span className="text-xs text-muted-foreground ml-2">{e.clientName}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0 max-w-[45%] truncate text-right">
                  {e.pending
                    ? t("saving")
                    : e.ok
                      ? e.created
                        ? t("created", { label: targetStatus?.label ?? "" })
                        : targetStatus?.label
                      : e.errorType === "already_at_status"
                        ? t("alreadyAtStatus")
                        : e.errorType === "is_final"
                          ? t("isFinal")
                          : (e.errorMessage ?? t("genericError"))}
                </span>
              </li>
            ))}
            <div ref={bottomRef} />
          </ul>
        </div>
      )}
    </div>
  );
}
