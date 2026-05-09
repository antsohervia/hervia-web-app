import * as z from "zod";

export const PARCEL_STATUS_TYPES = [
  "initial",
  "intermediate",
  "final",
] as const;
export type ParcelStatusType = (typeof PARCEL_STATUS_TYPES)[number];

export const PARCEL_STATUS_TYPE_LABELS: Record<ParcelStatusType, string> = {
  initial: "Initial",
  intermediate: "Intermédiaire",
  final: "Final",
};

export const STATUS_ICONS = [
  "package",
  "warehouse",
  "ship",
  "plane",
  "truck",
  "anchor",
  "shield",
  "search",
  "check",
  "x",
  "clock",
  "alert",
] as const;

export const HEX_COLOR_RX = /^#[0-9A-Fa-f]{6}$/;

const labelField = z
  .string()
  .trim()
  .min(1, "Libellé requis")
  .max(60, "60 caractères maximum");

const codeField = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Au moins 2 caractères")
  .max(40, "40 caractères maximum")
  .regex(/^[a-z0-9_]+$/, "Lettres minuscules, chiffres et underscores");

export const CreateStatusSchema = z.object({
  code: codeField,
  label: labelField,
  color: z.string().trim().regex(HEX_COLOR_RX, "Format #RRGGBB attendu"),
  icon: z.string().trim().optional().or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(200, "200 caractères maximum")
    .optional()
    .or(z.literal("")),
  type: z.enum(PARCEL_STATUS_TYPES),
});

export type CreateStatusInput = z.infer<typeof CreateStatusSchema>;

export const UpdateStatusSchema = CreateStatusSchema.extend({
  id: z.uuid(),
});
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

export type StatusFormState = {
  errors?: Partial<Record<keyof CreateStatusInput, string[]>> & {
    _form?: string[];
  };
  ok?: boolean;
};
