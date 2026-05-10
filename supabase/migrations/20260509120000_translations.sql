-- Translations table for tenant admin i18n
-- Overrides local JSON message files per locale/key

CREATE TABLE public.translations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  locale     text        NOT NULL CHECK (locale IN ('fr', 'en', 'zh')),
  key        text        NOT NULL, -- dot-notated: "nav.dashboard"
  value      text        NOT NULL,
  ai_generated boolean   NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (locale, key)
);

ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Only service-role (admin) writes; authenticated users can read
CREATE POLICY "translations_read" ON public.translations
  FOR SELECT USING (true);

CREATE POLICY "translations_write" ON public.translations
  FOR ALL USING (false);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
