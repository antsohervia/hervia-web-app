import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { isValidLocale, locales, type Locale } from "@/lib/i18n/config";

const LOCALE_NAMES: Record<Locale, string> = {
  fr: "French",
  en: "English",
  zh: "Simplified Chinese",
};

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
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

  const client = new Anthropic({ apiKey });

  const keyList = Object.entries(keys)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a professional translator. Translate the following UI strings from ${LOCALE_NAMES[sourceLocale]} to ${LOCALE_NAMES[targetLocale]}.

Rules:
- Keep the same key names (before the colon)
- Preserve ICU placeholders like {name}, {count} exactly as-is
- Keep translations concise and suitable for a logistics admin interface
- Return ONLY a JSON object with key-value pairs, no explanation

Strings to translate:
${keyList}

Return a JSON object like: {"key1": "translation1", "key2": "translation2"}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Parse error" }, { status: 500 });
  }

  try {
    const translations = JSON.parse(jsonMatch[0]) as Record<string, string>;
    return NextResponse.json({ translations });
  } catch {
    return NextResponse.json({ error: "Parse error" }, { status: 500 });
  }
}

export { locales };
