ALTER TABLE public.parcel_statuses
  ADD COLUMN IF NOT EXISTS label_translations jsonb NOT NULL DEFAULT '{}';

ALTER TABLE public.transport_modes
  ADD COLUMN IF NOT EXISTS label_translations jsonb NOT NULL DEFAULT '{}';
