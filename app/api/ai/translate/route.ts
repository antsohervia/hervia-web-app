import { NextResponse } from "next/server";
import { isValidLocale, locales, type Locale } from "@/lib/i18n/config";

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

export async function POST(request: Request) {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "noApiKey" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { keys, sourceLocale, targetLocale } = body as {
    keys: Record<string, string>;
    sourceLocale: Locale;
    targetLocale: Locale;
  };

  if (
    !isValidLocale(sourceLocale) ||
    !isValidLocale(targetLocale) ||
    !keys ||
    typeof keys !== "object"
  ) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const entries = Object.entries(keys);
  if (entries.length === 0) {
    return NextResponse.json({ translations: {} });
  }

  const baseUrl = apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: entries.map(([, v]) => v),
      source_lang: DEEPL_SOURCE[sourceLocale],
      target_lang: DEEPL_TARGET[targetLocale],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return NextResponse.json({ error: err || "DeepL error" }, { status: 502 });
  }

  const json = (await res.json()) as { translations: { text: string }[] };
  const translations: Record<string, string> = {};
  for (let i = 0; i < entries.length; i++) {
    const translated = json.translations[i]?.text;
    if (translated) translations[entries[i][0]] = translated;
  }

  return NextResponse.json({ translations });
}

export { locales };
