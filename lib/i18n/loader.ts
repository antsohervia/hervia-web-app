import 'server-only';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import type { Locale } from './config';

type Messages = Record<string, unknown>;

function setNestedKey(obj: Messages, dotKey: string, value: string) {
  const parts = dotKey.split('.');
  let cursor: Messages = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!cursor[part] || typeof cursor[part] !== 'object') {
      cursor[part] = {};
    }
    cursor = cursor[part] as Messages;
  }
  cursor[parts[parts.length - 1]] = value;
}

export async function loadMessages(locale: Locale): Promise<Messages> {
  const base = (await import(`@/messages/${locale}.json`)) as Messages;
  const merged: Messages = JSON.parse(JSON.stringify(base));

  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from('translations')
      .select('key, value')
      .eq('locale', locale);

    if (data) {
      for (const row of data) {
        setNestedKey(merged, row.key, row.value);
      }
    }
  } catch {
    // Supabase unavailable — local JSON is the fallback
  }

  return merged;
}
