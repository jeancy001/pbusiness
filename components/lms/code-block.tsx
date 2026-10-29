"use client"

import { useMemo, useState } from "react"
import { Check, Copy } from "lucide-react"
import hljs from "highlight.js/lib/core"
import bash from "highlight.js/lib/languages/bash"
import css from "highlight.js/lib/languages/css"
import java from "highlight.js/lib/languages/java"
import javascript from "highlight.js/lib/languages/javascript"
import json from "highlight.js/lib/languages/json"
import php from "highlight.js/lib/languages/php"
import python from "highlight.js/lib/languages/python"
import sql from "highlight.js/lib/languages/sql"
import typescript from "highlight.js/lib/languages/typescript"
import xml from "highlight.js/lib/languages/xml"

// Only the languages taught on the platform are bundled (keeps the client small).
for (const [name, lang] of Object.entries({ bash, css, java, javascript, json, php, python, sql, typescript, xml })) {
  if (!hljs.getLanguage(name)) hljs.registerLanguage(name, lang)
}
const ALIASES: Record<string, string> = { js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript", py: "python", html: "xml", sh: "bash", shell: "bash" }

export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  const language = lang ? (ALIASES[lang.toLowerCase()] ?? lang.toLowerCase()) : undefined

  // hljs escapes the source; the result is safe to inject.
  const html = useMemo(() => {
    try {
      return language && hljs.getLanguage(language) ? hljs.highlight(code, { language }).value : hljs.highlightAuto(code).value
    } catch {
      return code.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)
    }
  }, [code, language])

  const lines = code.split("\n").length

  return (
    <div className="not-prose overflow-hidden rounded-xl border border-white/10 bg-[#0B1F19] text-[13px] shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400/70" />
            <span className="size-2.5 rounded-full bg-amber-300/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
          </span>
          <span className="ml-2 font-mono text-[11px] uppercase tracking-wider text-emerald-200/70">{lang || "code"}</span>
        </div>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(code).catch(() => undefined)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-emerald-100/70 hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="flex overflow-x-auto">
        <pre aria-hidden className="select-none py-4 pl-4 pr-3 text-right font-mono leading-relaxed text-emerald-100/25">
          {Array.from({ length: lines }, (_, i) => i + 1).join("\n")}
        </pre>
        <pre className="flex-1 py-4 pr-4 font-mono leading-relaxed text-emerald-50">
          <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </div>
  )
}
