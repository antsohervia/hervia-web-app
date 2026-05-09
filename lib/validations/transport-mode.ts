import * as z from "zod";

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
  .regex(/^[a-z0-9_-]+$/, "Lettres minuscules, chiffres, tirets, underscores");

export const CreateTransportModeSchema = z.object({
  code: codeField,
  label: labelField,
});
export type CreateTransportModeInput = z.infer<typeof CreateTransportModeSchema>;

export const UpdateTransportModeSchema = CreateTransportModeSchema.extend({
  id: z.uuid(),
});
export type UpdateTransportModeInput = z.infer<typeof UpdateTransportModeSchema>;

export type TransportModeFormState = {
  errors?: Partial<Record<keyof CreateTransportModeInput, string[]>> & {
    _form?: string[];
  };
  ok?: boolean;
};
