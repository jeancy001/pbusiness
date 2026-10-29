import { Fragment } from "react"
import { CodeBlock } from "@/components/lms/code-block"
import { AiIllustration } from "@/components/lms/ai-illustration"

// Minimal Markdown for lessons and tutor replies: headings, lists, quotes,
// highlighted code fences, inline code, bold, italics and AI illustrations
// ([[illustration: …]] lines). Renders React nodes only — never raw HTML.

function inline(text: string) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
    return <Fragment key={i}>{part}</Fragment>
  })
}

export function Markdown({ source, illustrations }: { source: string; illustrations?: { moduleSlug: string } }) {
  const blocks: React.ReactNode[] = []
  const lines = source.replace(/\r\n/g, "\n").split("\n")
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim()
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++])
      i++
      blocks.push(<CodeBlock key={blocks.length} code={code.join("\n")} lang={lang} />)
      continue
    }

    const illustration = /^\[\[illustration:\s*(.+?)\]\]\s*$/i.exec(line.trim())
    if (illustration || line.trim().startsWith("[[")) {
      // While streaming, an unfinished marker is shown as a placeholder.
      blocks.push(
        illustrations && illustration ? (
          <AiIllustration key={blocks.length} prompt={illustration[1]} moduleSlug={illustrations.moduleSlug} />
        ) : (
          <div key={blocks.length} className="aspect-[16/10] w-full max-w-md animate-pulse rounded-xl bg-muted" />
        ),
      )
      i++
      continue
    }

    if (line.startsWith("> ")) {
      const quote: string[] = []
      while (i < lines.length && lines[i].startsWith("> ")) quote.push(lines[i++].slice(2))
      blocks.push(
        <blockquote key={blocks.length} className="rounded-r-lg border-l-4 border-[#064E3B] bg-[#064E3B]/5 px-4 py-2 dark:border-emerald-500 dark:bg-emerald-950/30">
          {inline(quote.join(" "))}
        </blockquote>,
      )
      continue
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      const size = ["text-xl", "text-lg", "text-base"][heading[1].length - 1]
      blocks.push(
        <p key={blocks.length} className={`font-heading font-semibold ${size}`}>
          {inline(heading[2])}
        </p>,
      )
      i++
      continue
    }

    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line)
      const items: string[] = []
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ""))
      const List = ordered ? "ol" : "ul"
      blocks.push(
        <List key={blocks.length} className={`space-y-1 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}>
          {items.map((item, k) => (
            <li key={k}>{inline(item)}</li>
          ))}
        </List>,
      )
      continue
    }

    if (!line.trim()) {
      i++
      continue
    }

    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|```|> |\[\[|\s*([-*]|\d+\.)\s)/.test(lines[i])) para.push(lines[i++])
    blocks.push(<p key={blocks.length}>{inline(para.join(" "))}</p>)
  }

  return <div className="space-y-3 leading-relaxed">{blocks}</div>
}
