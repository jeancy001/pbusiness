// Drafts the missing Twi / Ga / Ewe UI strings with Gemini.
//
//   node --env-file=.env scripts/translate-locales.mjs
//
// Hand-reviewed strings in lib/i18n/local-languages.ts always win; this only
// fills lib/i18n/generated/<lang>.json for keys that have no translation yet.
// Have a native speaker review the output before going live.

import { readFile, writeFile } from "node:fs/promises"
import { dictionary } from "../lib/i18n/dictionary.ts"
import * as reviewed from "../lib/i18n/local-languages.ts"

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const model = process.env.GEMINI_MODEL || "gemini-3.6-flash"
if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set")

const languages = { tw: "Asante Twi (Akan)", gaa: "Ga (Accra, Ghana)", ee: "Ewe (Ghana)" }
const BATCH = 60

async function translate(language, entries) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Translate these English UI strings of an online learning platform into ${language}.
Return a JSON object with the same keys. Keep brand names (P Business Online, PB-pay, LinkoPayroll, Gemini, Mobile Money), currency amounts and placeholders unchanged. Prefer short, natural, widely understood wording; keep common English tech loanwords (e.g. "video", "module") when that is what speakers actually use.

${JSON.stringify(Object.fromEntries(entries), null, 2)}`,
            },
          ],
        },
      ],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
  const json = await res.json()
  return JSON.parse(json.candidates[0].content.parts[0].text)
}

for (const [code, language] of Object.entries(languages)) {
  const file = new URL(`../lib/i18n/generated/${code}.json`, import.meta.url)
  const generated = JSON.parse(await readFile(file, "utf8"))
  const missing = Object.entries(dictionary.en).filter(([key]) => !(key in reviewed[code]) && !(key in generated))

  console.log(`${code}: ${missing.length} missing keys`)
  for (let i = 0; i < missing.length; i += BATCH) {
    const out = await translate(language, missing.slice(i, i + BATCH))
    for (const [key] of missing.slice(i, i + BATCH)) if (typeof out[key] === "string") generated[key] = out[key]
    await writeFile(file, JSON.stringify(generated, null, 2) + "\n")
    console.log(`  ${Math.min(i + BATCH, missing.length)}/${missing.length}`)
  }
}
