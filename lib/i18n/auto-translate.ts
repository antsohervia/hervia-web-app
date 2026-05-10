import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { locales, type Locale } from "./config";

const LOCALE_NAMES: Record<Locale, string> = {
  fr: "French",
  en: "English",
  zh: "Simplified Chinese",
};

export async function autoTranslateLabel(
  label: string,
  sourceLocale: Locale = "fr",
): Promise<Partial<Record<Locale, string>>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return {};

  const targets = locales.filter((l) => l !== sourceLocale);
  const client = new Anthropic({ apiKey });

  const langLines = targets.map((l) => `"${l}": ${LOCALE_NAMES[l]}`).join(", ");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Translate this logistics label from ${LOCALE_NAMES[sourceLocale]} to: ${langLines}.
Label: "${label}"
Return ONLY a JSON object like: {"en": "...", "zh": "..."}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return {};

  try {
    return JSON.parse(match[0]) as Partial<Record<Locale, string>>;
  } catch {
    return {};
  }
}
