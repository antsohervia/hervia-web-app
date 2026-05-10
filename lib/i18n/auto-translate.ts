import "server-only";
import { locales, type Locale } from "./config";

// DeepL requires distinct codes for source vs target
const DEEPL_TARGET: Record<Locale, string> = {
  fr: "FR",
  en: "EN-US",
  zh: "ZH",
};

const DEEPL_SOURCE: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  zh: "ZH",
};

export async function autoTranslateLabel(
  label: string,
  sourceLocale: Locale = "fr",
): Promise<Partial<Record<Locale, string>>> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) return {};

  // Free-tier keys end with ":fx"
  const baseUrl = apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

  const targets = locales.filter((l) => l !== sourceLocale);

  const results = await Promise.all(
    targets.map(async (target) => {
      try {
        const res = await fetch(baseUrl, {
          method: "POST",
          headers: {
            Authorization: `DeepL-Auth-Key ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: [label],
            source_lang: DEEPL_SOURCE[sourceLocale],
            target_lang: DEEPL_TARGET[target],
          }),
        });
        if (!res.ok) return null;
        const json = (await res.json()) as {
          translations: { text: string }[];
        };
        const text = json.translations[0]?.text;
        return text ? { locale: target, text } : null;
      } catch {
        return null;
      }
    }),
  );

  const out: Partial<Record<Locale, string>> = {};
  for (const r of results) {
    if (r) out[r.locale] = r.text;
  }
  return out;
}
