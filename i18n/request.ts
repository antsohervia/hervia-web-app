import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, isValidLocale, LOCALE_COOKIE } from '@/lib/i18n/config';
import { loadMessages } from '@/lib/i18n/loader';

export default getRequestConfig(async ({ requestLocale }) => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isValidLocale(raw) ? raw : defaultLocale;

  const messages = await loadMessages(locale);

  return { locale, messages };
});
