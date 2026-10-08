"use client"

import { useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  FileCode2,
  Globe2,
  GraduationCap,
  Layers3,
  PlayCircle,
  Sparkles,
  Trophy,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ============================================================
// TYPES
// ============================================================

type Locale = "fr" | "en"

type Lesson = {
  id: string
  title: {
    fr: string
    en: string
  }
  description: {
    fr: string
    en: string
  }
  code?: string
  language?: "html" | "css"
  explanation: {
    fr: string
    en: string
  }
  exercise: {
    fr: string
    en: string
  }
}

type Module = {
  id: string
  title: {
    fr: string
    en: string
  }
  lessons: Lesson[]
}

type Training = {
  id: string
  slug: string
  title: {
    fr: string
    en: string
  }
  description: {
    fr: string
    en: string
  }
  category: "html" | "css"
  level: {
    fr: string
    en: string
  }
  duration: {
    fr: string
    en: string
  }
  lessonsCount: number
  icon: typeof FileCode2
  modules: Module[]
  objectives: {
    fr: string[]
    en: string[]
  }
}

// ============================================================
// LOCAL TRAINING DATA
// FRONTEND ONLY
// ============================================================

const trainings: Training[] = [
  {
    id: "html-foundations",
    slug: "html-foundations",

    title: {
      fr: "HTML — Les fondamentaux du Web",
      en: "HTML — Web Fundamentals",
    },

    description: {
      fr: "Apprenez à construire la structure d'une page Web avec HTML, des premiers éléments jusqu'à la création d'une page complète.",
      en: "Learn how to build the structure of a Web page with HTML, from the first elements to creating a complete page.",
    },

    category: "html",

    level: {
      fr: "Débutant",
      en: "Beginner",
    },

    duration: {
      fr: "4 heures",
      en: "4 hours",
    },

    lessonsCount: 8,

    icon: FileCode2,

    objectives: {
      fr: [
        "Comprendre le rôle de HTML",
        "Créer la structure d'une page Web",
        "Utiliser les titres, paragraphes et liens",
        "Créer des formulaires",
        "Utiliser les éléments sémantiques",
        "Construire une page Web complète",
      ],

      en: [
        "Understand the role of HTML",
        "Create the structure of a Web page",
        "Use headings, paragraphs and links",
        "Create forms",
        "Use semantic elements",
        "Build a complete Web page",
      ],
    },

    modules: [
      {
        id: "html-module-1",

        title: {
          fr: "Module 1 — Introduction à HTML",
          en: "Module 1 — Introduction to HTML",
        },

        lessons: [
          {
            id: "html-1",

            title: {
              fr: "Qu'est-ce que HTML ?",
              en: "What is HTML?",
            },

            description: {
              fr: "Découvrez HTML et son rôle dans la création des pages Web.",
              en: "Discover HTML and its role in creating Web pages.",
            },

            explanation: {
              fr: "HTML signifie HyperText Markup Language. Il permet de définir la structure et le contenu d'une page Web. HTML ne sert pas principalement à créer le design : il décrit les différents éléments du document.",
              en: "HTML stands for HyperText Markup Language. It defines the structure and content of a Web page. HTML is not primarily responsible for design; it describes the different elements of a document.",
            },

            code: `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Ma première page</title>
  </head>

  <body>
    <h1>Bonjour le Web !</h1>
    <p>Ma première page HTML.</p>
  </body>
</html>`,

            language: "html",

            exercise: {
              fr: "Créez une page HTML contenant un titre, un paragraphe et votre nom.",
              en: "Create an HTML page containing a heading, a paragraph and your name.",
            },
          },

          {
            id: "html-2",

            title: {
              fr: "Titres et paragraphes",
              en: "Headings and paragraphs",
            },

            description: {
              fr: "Apprenez à organiser le contenu textuel d'une page.",
              en: "Learn how to organize textual content on a page.",
            },

            explanation: {
              fr: "Les éléments h1 à h6 représentent les différents niveaux de titres. L'élément p représente un paragraphe. Une bonne hiérarchie améliore la lisibilité et l'accessibilité.",
              en: "Elements h1 to h6 represent different heading levels. The p element represents a paragraph. A good hierarchy improves readability and accessibility.",
            },

            code: `<h1>Mon site Web</h1>

<h2>À propos de moi</h2>

<p>
  Je suis développeur Web.
</p>

<h2>Mes compétences</h2>

<p>
  HTML, CSS et JavaScript.
</p>`,

            language: "html",

            exercise: {
              fr: "Créez une page avec un titre principal et trois sections.",
              en: "Create a page with a main heading and three sections.",
            },
          },
        ],
      },

      {
        id: "html-module-2",

        title: {
          fr: "Module 2 — Liens, images et listes",
          en: "Module 2 — Links, images and lists",
        },

        lessons: [
          {
            id: "html-3",

            title: {
              fr: "Créer des liens",
              en: "Creating links",
            },

            description: {
              fr: "Apprenez à connecter plusieurs pages avec les liens HTML.",
              en: "Learn how to connect multiple pages using HTML links.",
            },

            explanation: {
              fr: "L'élément a permet de créer un lien. L'attribut href indique la destination du lien.",
              en: "The a element creates a link. The href attribute specifies where the link goes.",
            },

            code: `<a href="https://example.com">
  Visiter le site
</a>

<a href="/contact">
  Contact
</a>`,

            language: "html",

            exercise: {
              fr: "Ajoutez trois liens vers différentes pages de votre site.",
              en: "Add three links to different pages of your website.",
            },
          },

          {
            id: "html-4",

            title: {
              fr: "Images et listes",
              en: "Images and lists",
            },

            description: {
              fr: "Ajoutez des images et organisez les informations sous forme de listes.",
              en: "Add images and organize information using lists.",
            },

            explanation: {
              fr: "L'élément img permet d'afficher une image. Les éléments ul et ol permettent respectivement de créer des listes non ordonnées et ordonnées.",
              en: "The img element displays an image. The ul and ol elements create unordered and ordered lists respectively.",
            },

            code: `<img
  src="/images/profile.jpg"
  alt="Photo de profil"
/>

<ul>
  <li>HTML</li>
  <li>CSS</li>
  <li>JavaScript</li>
</ul>

<ol>
  <li>Apprendre</li>
  <li>Pratiquer</li>
  <li>Construire</li>
</ol>`,

            language: "html",

            exercise: {
              fr: "Créez une liste de vos cinq technologies préférées et ajoutez une image.",
              en: "Create a list of your five favorite technologies and add an image.",
            },
          },
        ],
      },

      {
        id: "html-module-3",

        title: {
          fr: "Module 3 — Formulaires et structure",
          en: "Module 3 — Forms and structure",
        },

        lessons: [
          {
            id: "html-5",

            title: {
              fr: "Créer un formulaire",
              en: "Creating a form",
            },

            description: {
              fr: "Découvrez les principaux éléments nécessaires pour créer un formulaire.",
              en: "Discover the main elements required to create a form.",
            },

            explanation: {
              fr: "Les formulaires permettent de collecter des informations auprès des utilisateurs. Ils utilisent notamment form, label, input, textarea et button.",
              en: "Forms allow you to collect information from users. They commonly use form, label, input, textarea and button.",
            },

            code: `<form>
  <label for="email">
    Adresse e-mail
  </label>

  <input
    id="email"
    type="email"
    placeholder="vous@example.com"
  />

  <button type="submit">
    Envoyer
  </button>
</form>`,

            language: "html",

            exercise: {
              fr: "Créez un formulaire contenant le nom, l'e-mail et un message.",
              en: "Create a form containing name, email and message fields.",
            },
          },

          {
            id: "html-6",

            title: {
              fr: "HTML sémantique",
              en: "Semantic HTML",
            },

            description: {
              fr: "Apprenez à utiliser les éléments sémantiques modernes.",
              en: "Learn how to use modern semantic elements.",
            },

            explanation: {
              fr: "Les éléments sémantiques comme header, nav, main, section, article et footer donnent du sens à la structure de la page.",
              en: "Semantic elements such as header, nav, main, section, article and footer give meaning to the page structure.",
            },

            code: `<header>
  <h1>Mon entreprise</h1>
</header>

<nav>
  <a href="/">Accueil</a>
  <a href="/services">Services</a>
</nav>

<main>
  <section>
    <h2>Nos services</h2>
    <p>Découvrez nos services.</p>
  </section>
</main>

<footer>
  © 2026 Mon entreprise
</footer>`,

            language: "html",

            exercise: {
              fr: "Transformez une page HTML classique en utilisant une structure sémantique.",
              en: "Transform a basic HTML page using a semantic structure.",
            },
          },
        ],
      },

      {
        id: "html-module-4",

        title: {
          fr: "Module 4 — Projet final",
          en: "Module 4 — Final project",
        },

        lessons: [
          {
            id: "html-7",

            title: {
              fr: "Construire une page complète",
              en: "Build a complete page",
            },

            description: {
              fr: "Mettez en pratique toutes les notions HTML apprises.",
              en: "Put all the HTML concepts you learned into practice.",
            },

            explanation: {
              fr: "Vous allez construire une page de présentation complète contenant une navigation, une présentation, des services, une liste de compétences et un formulaire.",
              en: "You will build a complete presentation page containing navigation, an introduction, services, a skills list and a form.",
            },

            code: `<main>
  <section>
    <h1>Bienvenue sur mon portfolio</h1>

    <p>
      Je suis développeur Web.
    </p>
  </section>

  <section>
    <h2>Mes compétences</h2>

    <ul>
      <li>HTML</li>
      <li>CSS</li>
      <li>JavaScript</li>
    </ul>
  </section>
</main>`,

            language: "html",

            exercise: {
              fr: "Construisez votre propre portfolio HTML.",
              en: "Build your own HTML portfolio.",
            },
          },

          {
            id: "html-8",

            title: {
              fr: "Quiz et validation",
              en: "Quiz and assessment",
            },

            description: {
              fr: "Vérifiez vos connaissances avant de passer au CSS.",
              en: "Check your knowledge before moving to CSS.",
            },

            explanation: {
              fr: "Révisez les éléments HTML principaux et vérifiez votre compréhension de la structure d'une page Web.",
              en: "Review the main HTML elements and check your understanding of Web page structure.",
            },

            exercise: {
              fr: "Expliquez la différence entre HTML, CSS et JavaScript.",
              en: "Explain the difference between HTML, CSS and JavaScript.",
            },
          },
        ],
      },
    ],
  },

  // ==========================================================
  // CSS
  // ==========================================================

  {
    id: "css-foundations",
    slug: "css-foundations",

    title: {
      fr: "CSS — Design et mise en page Web",
      en: "CSS — Web Design and Layout",
    },

    description: {
      fr: "Apprenez à transformer une page HTML simple en interface moderne, responsive et professionnelle avec CSS.",
      en: "Learn how to transform a basic HTML page into a modern, responsive and professional interface using CSS.",
    },

    category: "css",

    level: {
      fr: "Débutant",
      en: "Beginner",
    },

    duration: {
      fr: "5 heures",
      en: "5 hours",
    },

    lessonsCount: 8,

    icon: Code2,

    objectives: {
      fr: [
        "Comprendre le rôle de CSS",
        "Modifier les couleurs et typographies",
        "Maîtriser le Box Model",
        "Utiliser Flexbox",
        "Utiliser CSS Grid",
        "Créer des interfaces responsive",
      ],

      en: [
        "Understand the role of CSS",
        "Change colors and typography",
        "Master the Box Model",
        "Use Flexbox",
        "Use CSS Grid",
        "Create responsive interfaces",
      ],
    },

    modules: [
      {
        id: "css-module-1",

        title: {
          fr: "Module 1 — Introduction au CSS",
          en: "Module 1 — Introduction to CSS",
        },

        lessons: [
          {
            id: "css-1",

            title: {
              fr: "Qu'est-ce que CSS ?",
              en: "What is CSS?",
            },

            description: {
              fr: "Découvrez comment CSS permet de contrôler l'apparence d'une page HTML.",
              en: "Discover how CSS controls the appearance of an HTML page.",
            },

            explanation: {
              fr: "CSS signifie Cascading Style Sheets. Il permet de contrôler les couleurs, tailles, espacements, positions, animations et la mise en page des éléments HTML.",
              en: "CSS stands for Cascading Style Sheets. It controls colors, sizes, spacing, positioning, animations and the layout of HTML elements.",
            },

            code: `body {
  font-family: Arial, sans-serif;
  background: #f8fafc;
  color: #0f172a;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
}`,

            language: "css",

            exercise: {
              fr: "Créez une règle CSS qui modifie la couleur et la taille d'un titre.",
              en: "Create a CSS rule that changes the color and size of a heading.",
            },
          },

          {
            id: "css-2",

            title: {
              fr: "Sélecteurs CSS",
              en: "CSS selectors",
            },

            description: {
              fr: "Apprenez à cibler les éléments HTML avec les sélecteurs.",
              en: "Learn how to target HTML elements using selectors.",
            },

            explanation: {
              fr: "Les sélecteurs permettent de choisir les éléments auxquels appliquer des styles. Vous pouvez cibler les éléments, classes et identifiants.",
              en: "Selectors allow you to choose which elements receive styles. You can target elements, classes and IDs.",
            },

            code: `p {
  color: #334155;
}

.card {
  padding: 24px;
}

#hero {
  min-height: 400px;
}`,

            language: "css",

            exercise: {
              fr: "Créez trois sélecteurs : élément, classe et identifiant.",
              en: "Create three selectors: element, class and ID.",
            },
          },
        ],
      },

      {
        id: "css-module-2",

        title: {
          fr: "Module 2 — Box Model",
          en: "Module 2 — Box Model",
        },

        lessons: [
          {
            id: "css-3",

            title: {
              fr: "Marges, padding et bordures",
              en: "Margins, padding and borders",
            },

            description: {
              fr: "Comprenez comment CSS calcule l'espace autour des éléments.",
              en: "Understand how CSS calculates space around elements.",
            },

            explanation: {
              fr: "Le Box Model est composé du contenu, du padding, de la bordure et de la marge. Sa compréhension est essentielle pour maîtriser les dimensions d'une interface.",
              en: "The Box Model consists of content, padding, border and margin. Understanding it is essential for controlling interface dimensions.",
            },

            code: `.card {
  width: 320px;

  padding: 24px;
  border: 1px solid #e2e8f0;
  margin: 20px;

  border-radius: 16px;
}`,

            language: "css",

            exercise: {
              fr: "Créez une carte avec 24px de padding, une bordure et une marge.",
              en: "Create a card with 24px padding, a border and a margin.",
            },
          },

          {
            id: "css-4",

            title: {
              fr: "Couleurs et typographie",
              en: "Colors and typography",
            },

            description: {
              fr: "Créez une identité visuelle cohérente avec les couleurs et les polices.",
              en: "Create a consistent visual identity using colors and fonts.",
            },

            explanation: {
              fr: "CSS permet de contrôler la famille de police, la taille, le poids, la hauteur de ligne, l'espacement et les couleurs du texte.",
              en: "CSS controls font family, size, weight, line height, spacing and text colors.",
            },

            code: `.title {
  font-family: Inter, sans-serif;
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #064e3b;
}`,

            language: "css",

            exercise: {
              fr: "Créez un style professionnel pour un titre et un paragraphe.",
              en: "Create a professional style for a heading and paragraph.",
            },
          },
        ],
      },

      {
        id: "css-module-3",

        title: {
          fr: "Module 3 — Flexbox et Grid",
          en: "Module 3 — Flexbox and Grid",
        },

        lessons: [
          {
            id: "css-5",

            title: {
              fr: "Maîtriser Flexbox",
              en: "Master Flexbox",
            },

            description: {
              fr: "Apprenez à aligner et distribuer les éléments avec Flexbox.",
              en: "Learn how to align and distribute elements using Flexbox.",
            },

            explanation: {
              fr: "Flexbox est particulièrement utile pour créer des layouts en ligne ou en colonne et contrôler l'alignement des éléments.",
              en: "Flexbox is especially useful for creating row or column layouts and controlling element alignment.",
            },

            code: `.navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}`,

            language: "css",

            exercise: {
              fr: "Construisez une barre de navigation avec Flexbox.",
              en: "Build a navigation bar using Flexbox.",
            },
          },

          {
            id: "css-6",

            title: {
              fr: "CSS Grid",
              en: "CSS Grid",
            },

            description: {
              fr: "Créez des grilles modernes pour les cartes et les sections.",
              en: "Create modern grids for cards and sections.",
            },

            explanation: {
              fr: "CSS Grid permet de créer des mises en page bidimensionnelles avec des lignes et des colonnes.",
              en: "CSS Grid creates two-dimensional layouts using rows and columns.",
            },

            code: `.courses {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 24px;
}

@media (max-width: 768px) {
  .courses {
    grid-template-columns: 1fr;
  }
}`,

            language: "css",

            exercise: {
              fr: "Créez une grille de trois cartes qui devient une seule colonne sur mobile.",
              en: "Create a three-card grid that becomes one column on mobile.",
            },
          },
        ],
      },

      {
        id: "css-module-4",

        title: {
          fr: "Module 4 — Projet final",
          en: "Module 4 — Final project",
        },

        lessons: [
          {
            id: "css-7",

            title: {
              fr: "Créer une interface responsive",
              en: "Create a responsive interface",
            },

            description: {
              fr: "Combinez HTML et CSS pour créer une interface moderne.",
              en: "Combine HTML and CSS to create a modern interface.",
            },

            explanation: {
              fr: "Vous allez créer une interface complète avec navigation, hero section, cartes de services et footer. L'interface doit fonctionner sur mobile, tablette et ordinateur.",
              en: "You will create a complete interface with navigation, hero section, service cards and footer. The interface must work on mobile, tablet and desktop.",
            },

            code: `.hero {
  display: grid;
  grid-template-columns:
    1.2fr 0.8fr;
  align-items: center;
  gap: 48px;
}

@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}`,

            language: "css",

            exercise: {
              fr: "Construisez une landing page responsive pour un service numérique.",
              en: "Build a responsive landing page for a digital service.",
            },
          },

          {
            id: "css-8",

            title: {
              fr: "Projet final et validation",
              en: "Final project and assessment",
            },

            description: {
              fr: "Mettez toutes vos connaissances en pratique.",
              en: "Put all your knowledge into practice.",
            },

            explanation: {
              fr: "Le projet final consiste à créer une landing page complète avec HTML et CSS, en appliquant les principes de structure, design, responsive design et accessibilité.",
              en: "The final project consists of building a complete landing page with HTML and CSS, applying structure, design, responsive design and accessibility principles.",
            },

            exercise: {
              fr: "Créez votre propre landing page professionnelle.",
              en: "Create your own professional landing page.",
            },
          },
        ],
      },
    ],
  },
]

// ============================================================
// HELPERS
// ============================================================

function localized(
  value: { fr: string; en: string },
  locale: Locale,
) {
  return value[locale]
}

// ============================================================
// CODE BLOCK
// ============================================================

function CodeBlock({
  code,
  language,
}: {
  code: string
  language?: "html" | "css"
}) {
  const highlighted = highlightCode(code, language)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1220] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#111827] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-red-400/80" />
          <span className="size-3 rounded-full bg-yellow-400/80" />
          <span className="size-3 rounded-full bg-green-400/80" />
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <Code2 className="size-3.5" />
          {language?.toUpperCase() ?? "CODE"}
        </div>
      </div>

      <pre className="overflow-x-auto p-5 text-sm leading-7">
        <code
          className="font-mono"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </div>
  )
}

// ============================================================
// SIMPLE FRONTEND SYNTAX HIGHLIGHTER
// ============================================================

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function highlightCode(
  source: string,
  language?: "html" | "css",
) {
  let code = escapeHtml(source)

  if (language === "html") {
    code = code
      .replace(
        /(&lt;\/?)([a-zA-Z0-9-]+)/g,
        '$1<span class="text-pink-400">$2</span>',
      )
      .replace(
        /([a-zA-Z-]+)=(&quot;.*?&quot;)/g,
        '<span class="text-sky-300">$1</span>=<span class="text-amber-300">$2</span>',
      )
      .replace(
        /(<!DOCTYPE html>)/gi,
        '<span class="text-purple-400">$1</span>',
      )
  }

  if (language === "css") {
    code = code
      .replace(
        /([.#]?[a-zA-Z][a-zA-Z0-9_-]*)(\s*\{)/g,
        '<span class="text-sky-300">$1</span>$2',
      )
      .replace(
        /([a-zA-Z-]+)(\s*:)/g,
        '<span class="text-purple-300">$1</span>$2',
      )
      .replace(
        /(:\s*)(#[0-9a-fA-F]{3,8})/g,
        '$1<span class="text-emerald-300">$2</span>',
      )
      .replace(
        /(:\s*)(\d+(?:\.\d+)?(?:px|rem|em|%|fr|s)?)/g,
        '$1<span class="text-amber-300">$2</span>',
      )
  }

  return code
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function TrainingBrowser({
  locale = "fr",
}: {
  locale?: Locale
}) {
  const [selectedTraining, setSelectedTraining] =
    useState<Training | null>(null)

  const [selectedLesson, setSelectedLesson] =
    useState<Lesson | null>(null)

  const [search, setSearch] = useState("")

  const filteredTrainings = useMemo(() => {
    const value = search.trim().toLowerCase()

    if (!value) return trainings

    return trainings.filter((training) => {
      return [
        localized(training.title, locale),
        localized(training.description, locale),
        localized(training.level, locale),
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    })
  }, [search, locale])

  // ==========================================================
  // LESSON VIEW
  // ==========================================================

  if (selectedTraining && selectedLesson) {
    return (
      <LessonView
        training={selectedTraining}
        lesson={selectedLesson}
        locale={locale}
        onBack={() => setSelectedLesson(null)}
      />
    )
  }

  // ==========================================================
  // TRAINING DETAIL
  // ==========================================================

  if (selectedTraining) {
    return (
      <TrainingDetail
        training={selectedTraining}
        locale={locale}
        onBack={() => setSelectedTraining(null)}
        onLesson={(lesson) => setSelectedLesson(lesson)}
      />
    )
  }

  // ==========================================================
  // TRAINING CATALOG
  // ==========================================================

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}

      <div className="relative mb-10 overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-gradient-to-br from-[#064E3B] via-[#075f49] to-[#022c22] px-6 py-10 text-white shadow-xl sm:px-10 lg:px-12">
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 size-80 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium">
            <Sparkles className="size-4 text-emerald-300" />

            {locale === "fr"
              ? "Formation 100 % gratuite"
              : "100% free training"}
          </div>

          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {locale === "fr"
              ? "Apprenez le Web gratuitement."
              : "Learn Web development for free."}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-50/80 sm:text-lg">
            {locale === "fr"
              ? "Apprenez HTML et CSS à travers des leçons pratiques, des exemples de code et des projets progressifs."
              : "Learn HTML and CSS through practical lessons, code examples and progressive projects."}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm">
              <GraduationCap className="size-4" />
              {locale === "fr"
                ? "Débutant"
                : "Beginner"}
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm">
              <Code2 className="size-4" />
              HTML + CSS
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm">
              <Trophy className="size-4" />
              $0.00
            </div>
          </div>
        </div>
      </div>

      {/* Search */}

      <div className="mb-8">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={
            locale === "fr"
              ? "Rechercher une formation..."
              : "Search for a training..."
          }
          className="w-full max-w-xl rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-[#064E3B] focus:ring-4 focus:ring-[#064E3B]/10"
        />
      </div>

      {/* Courses */}

      <div className="grid gap-6 md:grid-cols-2">
        {filteredTrainings.map((training) => {
          const Icon = training.icon

          return (
            <article
              key={training.id}
              className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="bg-gradient-to-br from-emerald-50 to-white p-6 dark:from-emerald-950/30 dark:to-card">
                <div className="flex items-start justify-between">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-[#064E3B] text-white shadow-lg">
                    <Icon className="size-7" />
                  </div>

                  <div className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    $0.00
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {localized(training.level, locale)}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {training.lessonsCount}{" "}
                      {locale === "fr"
                        ? "leçons"
                        : "lessons"}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {localized(training.duration, locale)}
                    </span>
                  </div>

                  <h2 className="font-heading text-2xl font-bold tracking-tight">
                    {localized(training.title, locale)}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {localized(
                      training.description,
                      locale,
                    )}
                  </p>
                </div>
              </div>

              <div className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="size-4 text-[#064E3B]" />

                  {locale === "fr"
                    ? "Vous allez apprendre"
                    : "You will learn"}
                </h3>

                <ul className="space-y-2">
                  {training.objectives[locale]
                    .slice(0, 4)
                    .map((objective) => (
                      <li
                        key={objective}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#064E3B]" />

                        {objective}
                      </li>
                    ))}
                </ul>

                <Button
                  className="mt-6 w-full gap-2 bg-[#064E3B] text-white hover:bg-[#053D2E]"
                  onClick={() =>
                    setSelectedTraining(training)
                  }
                >
                  <PlayCircle className="size-4" />

                  {locale === "fr"
                    ? "Commencer gratuitement"
                    : "Start for free"}

                  <ArrowRight className="ml-auto size-4" />
                </Button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

// ============================================================
// TRAINING DETAIL
// ============================================================

function TrainingDetail({
  training,
  locale,
  onBack,
  onLesson,
}: {
  training: Training
  locale: Locale
  onBack: () => void
  onLesson: (lesson: Lesson) => void
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-[#064E3B]"
      >
        <ArrowLeft className="size-4" />

        {locale === "fr"
          ? "Retour aux formations"
          : "Back to trainings"}
      </button>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="bg-[#064E3B] px-6 py-10 text-white sm:px-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm">
              {localized(training.level, locale)}
            </span>

            <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm">
              $0.00
            </span>

            <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm">
              {localized(training.duration, locale)}
            </span>
          </div>

          <h1 className="mt-6 max-w-3xl font-heading text-3xl font-bold sm:text-4xl">
            {localized(training.title, locale)}
          </h1>

          <p className="mt-4 max-w-3xl leading-7 text-emerald-50/80">
            {localized(training.description, locale)}
          </p>
        </div>

        <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
              <GraduationCap className="size-5 text-[#064E3B]" />

              {locale === "fr"
                ? "Objectifs"
                : "Learning objectives"}
            </h2>

            <ul className="mt-5 space-y-3">
              {training.objectives[locale].map(
                (objective) => (
                  <li
                    key={objective}
                    className="flex gap-3 text-sm leading-6 text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />

                    {objective}
                  </li>
                ),
              )}
            </ul>

            <div className="mt-8 rounded-2xl border border-emerald-900/10 bg-emerald-50 p-5 dark:bg-emerald-950/20">
              <div className="flex items-center gap-3">
                <Trophy className="size-5 text-[#064E3B]" />

                <div>
                  <p className="font-semibold">
                    {locale === "fr"
                      ? "Formation gratuite"
                      : "Free training"}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {locale === "fr"
                      ? "Accès frontend sans paiement."
                      : "Frontend access without payment."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-5 flex items-center gap-2 font-heading text-xl font-bold">
              <Layers3 className="size-5 text-[#064E3B]" />

              {locale === "fr"
                ? "Programme"
                : "Course curriculum"}
            </h2>

            <div className="space-y-4">
              {training.modules.map((module, moduleIndex) => (
                <div
                  key={module.id}
                  className="overflow-hidden rounded-2xl border border-border"
                >
                  <div className="bg-muted/40 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {locale === "fr"
                        ? `Module ${moduleIndex + 1}`
                        : `Module ${moduleIndex + 1}`}
                    </p>

                    <h3 className="mt-1 font-semibold">
                      {localized(module.title, locale)}
                    </h3>
                  </div>

                  <div className="divide-y divide-border">
                    {module.lessons.map(
                      (lesson, lessonIndex) => (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => onLesson(lesson)}
                          className="group flex w-full items-center gap-4 p-4 text-left transition hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#064E3B]/10 text-xs font-bold text-[#064E3B]">
                            {lessonIndex + 1}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">
                              {localized(
                                lesson.title,
                                locale,
                              )}
                            </span>

                            <span className="mt-1 block text-xs text-muted-foreground">
                              {localized(
                                lesson.description,
                                locale,
                              )}
                            </span>
                          </span>

                          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-[#064E3B]" />
                        </button>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// LESSON VIEW
// ============================================================

function LessonView({
  training,
  lesson,
  locale,
  onBack,
}: {
  training: Training
  lesson: Lesson
  locale: Locale
  onBack: () => void
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-[#064E3B]"
      >
        <ArrowLeft className="size-4" />

        {locale === "fr"
          ? "Retour au programme"
          : "Back to curriculum"}
      </button>

      <div className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#064E3B]/10 px-3 py-1 text-xs font-semibold text-[#064E3B]">
            {training.category.toUpperCase()}
          </span>

          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            $0.00
          </span>
        </div>

        <h1 className="max-w-3xl font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {localized(lesson.title, locale)}
        </h1>

        <p className="mt-3 max-w-3xl text-muted-foreground">
          {localized(lesson.description, locale)}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr]">
        <div className="space-y-8">
          {/* Explanation */}

          <article className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#064E3B]/10 text-[#064E3B]">
                <BookOpen className="size-5" />
              </div>

              <h2 className="font-heading text-xl font-bold">
                {locale === "fr"
                  ? "Explication"
                  : "Explanation"}
              </h2>
            </div>

            <p className="leading-8 text-muted-foreground">
              {localized(
                lesson.explanation,
                locale,
              )}
            </p>
          </article>

          {/* Code */}

          {lesson.code && (
            <article>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-xl font-bold">
                    {locale === "fr"
                      ? "Exemple de code"
                      : "Code example"}
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {locale === "fr"
                      ? "Étudiez le code puis essayez de le modifier."
                      : "Study the code and try modifying it."}
                  </p>
                </div>
              </div>

              <CodeBlock
                code={lesson.code}
                language={lesson.language}
              />
            </article>
          )}

          {/* Exercise */}

          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/30 dark:bg-amber-950/20 sm:p-8">
            <div className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <Sparkles className="size-5" />
              </div>

              <div>
                <h2 className="font-heading text-lg font-bold">
                  {locale === "fr"
                    ? "Exercice pratique"
                    : "Practical exercise"}
                </h2>

                <p className="mt-2 leading-7 text-muted-foreground">
                  {localized(
                    lesson.exercise,
                    locale,
                  )}
                </p>
              </div>
            </div>
          </article>
        </div>

        {/* Lesson sidebar */}

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-6">
          <h2 className="font-heading text-lg font-bold">
            {locale === "fr"
              ? "À retenir"
              : "Key takeaways"}
          </h2>

          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#064E3B]/10">
                <Clock3 className="size-4 text-[#064E3B]" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  {locale === "fr"
                    ? "Format"
                    : "Format"}
                </p>

                <p className="text-sm font-medium">
                  {locale === "fr"
                    ? "Leçon pratique"
                    : "Practical lesson"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#064E3B]/10">
                <Globe2 className="size-4 text-[#064E3B]" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  {locale === "fr"
                    ? "Langue"
                    : "Language"}
                </p>

                <p className="text-sm font-medium">
                  {locale === "fr"
                    ? "Français"
                    : "English"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#064E3B]/10">
                <Trophy className="size-4 text-[#064E3B]" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  {locale === "fr"
                    ? "Prix"
                    : "Price"}
                </p>

                <p className="text-sm font-bold text-[#064E3B]">
                  $0.00
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 rounded-xl bg-muted/50 p-4">
            <p className="text-xs leading-5 text-muted-foreground">
              {locale === "fr"
                ? "Conseil : écrivez vous-même les exemples de code au lieu de simplement les copier. La pratique accélère considérablement l'apprentissage."
                : "Tip: write the code examples yourself instead of simply copying them. Practice significantly accelerates learning."}
            </p>
          </div>

          <Button
            type="button"
            className="mt-5 w-full gap-2 bg-[#064E3B] text-white hover:bg-[#053D2E]"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />

            {locale === "fr"
              ? "Retour au cours"
              : "Back to course"}
          </Button>
        </aside>
      </div>
    </section>
  )
}