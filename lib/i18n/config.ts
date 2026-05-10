export const locales = ['fr', 'en', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isValidLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}
