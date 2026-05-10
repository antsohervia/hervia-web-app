import 'server-only';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import type { Locale } from '@/lib/i18n/config';

export type TranslationRow = {
  id: string;
  locale: Locale;
  key: string;
  value: string;
  ai_generated: boolean;
  updated_at: string;
};

export async function listTranslations(locale: Locale): Promise<TranslationRow[]> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from('translations')
    .select('id, locale, key, value, ai_generated, updated_at')
    .eq('locale', locale)
    .order('key');
  if (error) throw new Error(error.message);
  return (data ?? []) as TranslationRow[];
}

export async function upsertTranslation(
  locale: Locale,
  key: string,
  value: string,
  aiGenerated = false,
): Promise<void> {
  const admin = createSupabaseAdmin();
  const { error } = await admin.from('translations').upsert(
    { locale, key, value, ai_generated: aiGenerated },
    { onConflict: 'locale,key' },
  );
  if (error) throw new Error(error.message);
}

export async function bulkUpsertTranslations(
  rows: { locale: Locale; key: string; value: string; ai_generated: boolean }[],
): Promise<void> {
  if (!rows.length) return;
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from('translations')
    .upsert(rows, { onConflict: 'locale,key' });
  if (error) throw new Error(error.message);
}
