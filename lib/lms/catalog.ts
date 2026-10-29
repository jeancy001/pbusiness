import type { LocalizedText } from "@/lib/mock-data"

// ============================================================
// PRICING — the server is the only trusted source.
// ============================================================

/** Default price of a course; teachers can change the price of their own courses. */
export const COURSE_PRICE_USD = 19
export const CERTIFICATE_PRICE_USD = 49.99
/** One Linko Academy AI course (all its modules) — not per module. */
export const AI_COURSE_PRICE_USD = 19
export const EXAM_PASS_SCORE = 70

/** Certificates require at least 70%, whatever pass mark a teacher stored. */
export function effectivePassScore(stored?: number) {
  return Math.max(EXAM_PASS_SCORE, stored ?? EXAM_PASS_SCORE)
}

/** Honours printed on the certificate. */
export function certificateGrade(score: number): { fr: string; en: string } {
  if (score >= 90) return { fr: "Avec distinction", en: "With Distinction" }
  if (score >= 80) return { fr: "Avec mérite", en: "With Merit" }
  return { fr: "Réussi", en: "Pass" }
}
export const CERTIFIER_NAME = "LinkoPayroll"
/** Bump to regenerate every Linko Academy cover (also busts browser caches). */
export const AI_COVER_STYLE = "objects-1"

// ============================================================
// AI ACADEMY — self-paced modules taught by the AI tutor.
// ============================================================

/** "skills" = professional/business courses added by the admin (marketing, accounting…). */
export type AiTrackKind = "language" | "programming" | "skills"

export type AiTrack = {
  slug: string
  kind: AiTrackKind
  name: LocalizedText
  /** Short native/tech label shown on the card. */
  badge: string
  modules: { title: LocalizedText; focus: string; advanced?: boolean }[]
  /** Set on courses the admin generated with AI. */
  description?: LocalizedText
  level?: "beginner" | "intermediate" | "advanced"
  custom?: boolean
  /** Average student rating and how many ratings (filled in by the server). */
  rating?: number
  ratingCount?: number
}

export type AiModule = {
  slug: string
  track: AiTrack
  index: number
  title: LocalizedText
  focus: string
}

const m = (fr: string, en: string, focus: string) => ({ title: { fr, en }, focus })
/** Advanced module: unlocked by the same course purchase, flagged in the syllabus. */
const adv = (fr: string, en: string, focus: string) => ({ title: { fr, en }, focus, advanced: true })

export const aiTracks: AiTrack[] = [
  {
    slug: "twi",
    kind: "language",
    name: { fr: "Twi (Akan)", en: "Twi (Akan)", tw: "Twi" },
    badge: "Akwaaba",
    modules: [
      m("Salutations et présentations", "Greetings & introductions", "greetings, introducing yourself, polite forms, tones"),
      m("Nombres, temps et marché", "Numbers, time & the market", "numbers, telling time, bargaining at the market"),
      m("Famille et vie quotidienne", "Family & daily life", "family vocabulary, daily routines, present tense"),
      m("Conversations professionnelles", "Workplace conversations", "work vocabulary, phone calls, polite requests"),
    ],
  },
  {
    slug: "ga",
    kind: "language",
    name: { fr: "Ga", en: "Ga", gaa: "Ga" },
    badge: "Ojekoo",
    modules: [
      m("Salutations et présentations", "Greetings & introductions", "greetings, introducing yourself, tones"),
      m("Nombres et achats", "Numbers & shopping", "numbers, prices, shopping in Accra"),
      m("Famille et communauté", "Family & community", "family terms, community life, possessives"),
      m("Se déplacer à Accra", "Getting around Accra", "directions, transport, everyday questions"),
    ],
  },
  {
    slug: "ewe",
    kind: "language",
    name: { fr: "Ewe", en: "Ewe", ee: "Eʋegbe" },
    badge: "Woezɔ",
    modules: [
      m("Salutations et présentations", "Greetings & introductions", "greetings, introducing yourself, tones"),
      m("Nombres et temps", "Numbers & time", "numbers, days, telling time"),
      m("Famille et maison", "Family & home", "family vocabulary, home, possessive forms"),
      m("Conversations courantes", "Everyday conversations", "asking questions, small talk, polite requests"),
    ],
  },
  {
    slug: "french",
    kind: "language",
    name: { fr: "Français", en: "French" },
    badge: "Bonjour",
    modules: [
      m("Bases et prononciation", "Basics & pronunciation", "alphabet, pronunciation, greetings"),
      m("Grammaire essentielle", "Essential grammar", "articles, gender, present tense verbs"),
      m("Français du quotidien", "Everyday French", "shopping, directions, travel"),
      m("Français professionnel", "Business French", "emails, meetings, formal register"),
    ],
  },
  {
    slug: "english",
    kind: "language",
    name: { fr: "Anglais", en: "English" },
    badge: "Hello",
    modules: [
      m("Bases et prononciation", "Basics & pronunciation", "pronunciation, greetings, introductions"),
      m("Grammaire essentielle", "Essential grammar", "tenses, questions, common verbs"),
      m("Anglais du quotidien", "Everyday English", "shopping, travel, small talk"),
      m("Anglais professionnel", "Business English", "emails, meetings, presentations, interviews"),
    ],
  },
  {
    slug: "python",
    kind: "programming",
    name: { fr: "Python", en: "Python" },
    badge: "py",
    modules: [
      m("Syntaxe, variables et types", "Syntax, variables & types", "variables, types, input/output, operators"),
      m("Conditions, boucles et fonctions", "Control flow & functions", "if/else, loops, functions, scope"),
      m("Structures de données", "Data structures", "lists, dicts, sets, tuples, comprehensions"),
      m("Projet : automatisation", "Project: automation", "files, modules, a small automation script"),
      adv("POO avancée et modèle de données", "Advanced OOP & the data model", "dataclasses, dunder methods, properties, protocols, decorators, context managers, generators"),
      adv("Asynchrone, typage et tests", "Async, typing & testing", "asyncio, type hints and mypy, pytest with fixtures, packaging with virtual environments"),
      adv("Projet avancé : API REST", "Advanced project: REST API", "FastAPI, Pydantic validation, SQL database access, authentication, deployment"),
    ],
  },
  {
    slug: "javascript",
    kind: "programming",
    name: { fr: "JavaScript", en: "JavaScript" },
    badge: "js",
    modules: [
      m("Fondamentaux du langage", "Language fundamentals", "variables, types, operators, functions"),
      m("Tableaux, objets et DOM", "Arrays, objects & the DOM", "arrays, objects, DOM manipulation, events"),
      m("Asynchrone et API", "Async & APIs", "promises, async/await, fetch"),
      m("Projet : application web", "Project: web app", "building a small interactive web app"),
      adv("JavaScript avancé", "Advanced JavaScript", "closures, prototypes and classes, this binding, ES modules, iterators and generators, the event loop"),
      adv("Node.js et API back-end", "Node.js & back-end APIs", "Node.js runtime, npm, Express routing, middleware, REST design, error handling"),
      adv("Tests, performance et architecture", "Testing, performance & architecture", "unit tests with Vitest/Jest, debouncing, memory leaks, design patterns, project structure"),
    ],
  },
  {
    slug: "typescript",
    kind: "programming",
    name: { fr: "TypeScript", en: "TypeScript" },
    badge: "ts",
    modules: [
      m("Types de base", "Basic types", "primitive types, inference, unions"),
      m("Interfaces et génériques", "Interfaces & generics", "interfaces, type aliases, generics"),
      m("TypeScript avec React", "TypeScript with React", "typing props, state and hooks"),
      m("Projet : API typée", "Project: typed API", "a typed REST API with validation"),
      adv("Types avancés", "Advanced types", "conditional types, mapped types, template literal types, infer, utility types, type guards"),
      adv("Architecture et patterns typés", "Typed architecture & patterns", "discriminated unions, branded types, typed error handling, generics in libraries, strict tsconfig"),
      adv("Projet avancé : full-stack typé", "Advanced project: typed full-stack", "end-to-end types between a Node API and a React client with schema validation"),
    ],
  },
  {
    slug: "java",
    kind: "programming",
    name: { fr: "Java", en: "Java" },
    badge: "java",
    modules: [
      m("Syntaxe et types", "Syntax & types", "classes, main method, primitive types"),
      m("Programmation orientée objet", "Object-oriented programming", "classes, inheritance, interfaces"),
      m("Collections et exceptions", "Collections & exceptions", "List, Map, exceptions"),
      m("Projet : application console", "Project: console app", "a small console application"),
      adv("Génériques, lambdas et streams", "Generics, lambdas & streams", "bounded generics, functional interfaces, lambdas, Stream API, Optional, records"),
      adv("Concurrence et JVM", "Concurrency & the JVM", "threads, ExecutorService, CompletableFuture, synchronization, memory model, garbage collection"),
      adv("Projet avancé : API Spring Boot", "Advanced project: Spring Boot API", "Spring Boot, REST controllers, JPA/Hibernate, validation, testing with JUnit 5"),
    ],
  },
  {
    slug: "sql",
    kind: "programming",
    name: { fr: "SQL", en: "SQL" },
    badge: "sql",
    modules: [
      m("Requêtes SELECT", "SELECT queries", "SELECT, WHERE, ORDER BY, LIMIT"),
      m("Jointures et agrégations", "Joins & aggregations", "JOINs, GROUP BY, HAVING"),
      m("Modélisation des données", "Data modelling", "tables, keys, normalisation"),
      m("Projet : base de ventes", "Project: sales database", "design and query a sales database"),
      adv("CTE et fonctions de fenêtre", "CTEs & window functions", "WITH clauses, recursive CTEs, ROW_NUMBER, RANK, LAG/LEAD, running totals"),
      adv("Performance et index", "Performance & indexing", "B-tree indexes, composite indexes, EXPLAIN plans, query rewriting, avoiding N+1 queries"),
      adv("Transactions et sécurité", "Transactions & security", "ACID, isolation levels, locking, stored procedures, roles and privileges, SQL injection prevention"),
    ],
  },
]

export function aiModuleSlug(trackSlug: string, index: number) {
  return `${trackSlug}-${index}`
}

/** Exams and certificates of AI courses share collections with regular courses under this key. */
export function aiCertKey(trackSlug: string) {
  return `ai:${trackSlug}`
}

export function moduleOf(track: AiTrack, index: number): AiModule | null {
  const mod = track.modules[index - 1]
  return mod ? { slug: aiModuleSlug(track.slug, index), track, index, title: mod.title, focus: mod.focus } : null
}
