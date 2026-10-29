import type { AiTrack } from "@/lib/lms/catalog"

// Official language/framework logos (Devicon, MIT) bundled in /public/icons/lang.
// Matched on the course slug and name; the most specific names come first so
// "TypeScript" isn't taken for "JavaScript" nor "MySQL" for plain "SQL".

const RULES: [RegExp, string][] = [
  [/typescript|\bts\b/, "typescript"],
  [/next\.?js/, "nextjs"],
  [/node\.?js|\bnode\b/, "nodejs"],
  [/react/, "react"],
  [/vue/, "vuejs"],
  [/angular/, "angular"],
  [/javascript|\bjs\b/, "javascript"],
  [/django/, "django"],
  [/python|\bpy\b/, "python"],
  [/laravel/, "laravel"],
  [/\bphp\b/, "php"],
  [/mysql/, "mysql"],
  [/postgres/, "postgresql"],
  [/sqlite/, "sqlite"],
  [/mongo/, "mongodb"],
  [/c#|csharp|c-sharp|\.net/, "csharp"],
  [/c\+\+|cplusplus|\bcpp\b/, "cplusplus"],
  [/kotlin/, "kotlin"],
  [/swift/, "swift"],
  [/flutter/, "flutter"],
  [/\bdart\b/, "dart"],
  [/\brust\b/, "rust"],
  [/golang|\bgo\b/, "go"],
  [/\bruby\b|rails/, "ruby"],
  [/html/, "html5"],
  [/\bcss\b/, "css3"],
  [/docker/, "docker"],
  [/\bgit\b|github/, "git"],
  [/\bjava\b/, "java"],
  [/^r$|\br programming\b|langage r\b/, "r"],
  [/^c$|\bc programming\b|langage c\b/, "c"],
]

/**
 * Logo for a programming course: a path under /icons/lang, "database" for
 * plain SQL courses (no official logo exists), or null for other courses.
 */
export function langIcon(track: Pick<AiTrack, "slug" | "kind" | "name">): string | null {
  if (track.kind !== "programming") return null
  const haystacks = [track.slug.replace(/-[a-z0-9]{4}$/, "").replace(/-/g, " "), track.name.en.toLowerCase(), track.name.fr.toLowerCase()]
  for (const [re, icon] of RULES) if (haystacks.some((h) => re.test(h))) return `/icons/lang/${icon}.svg`
  if (haystacks.some((h) => /\bsql\b/.test(h))) return "database"
  return null
}
