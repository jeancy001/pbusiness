// Free HTML & CSS course: shared by the one-page course and its AI helper.

export type Locale = "fr" | "en"

export type Lesson = {
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
  /** Markup the CSS of this lesson is applied to in the live preview. */
  previewHtml?: string
  explanation: {
    fr: string
    en: string
  }
  exercise: {
    fr: string
    en: string
  }
}

export type Module = {
  id: string
  advanced?: boolean
  title: {
    fr: string
    en: string
  }
  lessons: Lesson[]
}

export type Training = {
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

const baseTrainings: Training[] = [
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
// LIVE PREVIEW
// ============================================================

/** Default page the CSS lessons style when they don't bring their own markup. */
export const CSS_DEMO_HTML = `<header id="hero" class="hero">
  <div>
    <h1>Linko Academy</h1>
    <p>Learn HTML &amp; CSS step by step, for free.</p>
    <div class="actions">
      <a class="btn" href="#">Start learning</a>
      <a class="btn btn-outline" href="#">See the program</a>
    </div>
  </div>
  <div class="card">
    <h3>Today's lesson</h3>
    <p>Build a responsive layout with Flexbox and Grid.</p>
  </div>
</header>
<main class="container">
  <section class="courses">
    <article class="card"><h3>HTML</h3><p>Structure your pages.</p></article>
    <article class="card"><h3>CSS</h3><p>Style and layout.</p></article>
    <article class="card"><h3>Responsive</h3><p>Every screen size.</p></article>
  </section>
</main>`

/** Full document rendered in the sandboxed preview iframe. */
export function previewDocument(lesson: Pick<Lesson, "language" | "previewHtml">, rawCode: string) {
  // Root-relative paths (src="/images/…") would hit this site: point them at the placeholders too.
  const code = rawCode.replace(/\b(src|href|poster)=(["'])\/(?!\/)/gi, "$1=$2/api/free-course/asset/")
  // Relative files in examples (images/profile.jpg…) resolve to placeholders instead of 404s.
  const assets = '<base href="/api/free-course/asset/">'
  const base = assets + "<style>body{font-family:system-ui,sans-serif;margin:16px;color:#111827;line-height:1.5}img{max-width:100%}</style>"
  if (lesson.language === "css") {
    return `<!doctype html><html><head><meta charset="utf-8">${base}<style>${code}</style></head><body>${lesson.previewHtml ?? CSS_DEMO_HTML}</body></html>`
  }
  if (/<head[\s>]/i.test(code)) return code.replace(/<head([^>]*)>/i, `<head$1>${assets}`)
  return /<html[\s>]/i.test(code) ? code.replace(/<html([^>]*)>/i, `<html$1><head>${assets}</head>`) : `<!doctype html><html><head><meta charset="utf-8">${base}</head><body>${code}</body></html>`
}

// ============================================================
// ADVANCED MODULES
// ============================================================

const t = (fr: string, en: string) => ({ fr, en })

const htmlAdvanced: Module = {
  id: "html-module-5",
  advanced: true,
  title: t("Module 5 — HTML avancé", "Module 5 — Advanced HTML"),
  lessons: [
    {
      id: "html-9",
      title: t("HTML sémantique et accessibilité", "Semantic HTML & accessibility"),
      description: t("Rendez vos pages compréhensibles par tous, y compris les lecteurs d'écran.", "Make your pages understandable by everyone, including screen readers."),
      explanation: t(
        "Les balises sémantiques (header, nav, main, article, aside, footer) décrivent le rôle de chaque zone. Les technologies d'assistance s'en servent pour naviguer. Un lien d'évitement permet d'aller directement au contenu, chaque image utile a un texte alternatif, et l'attribut aria-label nomme une zone quand le texte visible ne suffit pas. Règle d'or : utilisez d'abord le bon élément HTML, ARIA seulement en complément.",
        "Semantic elements (header, nav, main, article, aside, footer) describe the role of each area, and assistive technologies use them to navigate. A skip link jumps straight to the content, every meaningful image has alternative text, and aria-label names a region when the visible text isn't enough. Golden rule: use the right HTML element first, ARIA only as a complement.",
      ),
      code: `<a class="skip" href="#content">Aller au contenu</a>

<header>
  <nav aria-label="Navigation principale">
    <a href="/">Accueil</a>
    <a href="/cours" aria-current="page">Cours</a>
  </nav>
</header>

<main id="content">
  <article>
    <h1>Bien débuter en HTML</h1>
    <img src="https://picsum.photos/seed/html/480/200"
         alt="Un ordinateur portable affichant du code HTML">
    <p>Le HTML sémantique aide aussi le référencement.</p>
  </article>
  <aside aria-label="Ressources">
    <h2>À lire ensuite</h2>
  </aside>
</main>

<footer>© 2026 Linko Academy</footer>`,
      language: "html",
      exercise: t(
        "Restructurez une page existante avec header, nav, main et footer, ajoutez un lien d'évitement et des textes alternatifs à toutes les images.",
        "Restructure an existing page with header, nav, main and footer, add a skip link and alternative text to every image.",
      ),
    },
    {
      id: "html-10",
      title: t("Formulaires avancés et validation native", "Advanced forms & native validation"),
      description: t("Des formulaires clairs, accessibles et validés sans JavaScript.", "Clear, accessible forms validated without JavaScript."),
      explanation: t(
        "Chaque champ doit avoir un label relié par for/id. Les types (email, tel, url, number, date) affichent le bon clavier sur mobile et valident automatiquement. required, minlength, pattern et min/max définissent les règles ; fieldset et legend regroupent les champs liés ; autocomplete aide le navigateur à préremplir. La validation HTML améliore l'expérience mais ne remplace jamais la validation côté serveur.",
        "Every field needs a label linked with for/id. Input types (email, tel, url, number, date) show the right mobile keyboard and validate automatically. required, minlength, pattern and min/max define the rules; fieldset and legend group related fields; autocomplete helps the browser prefill. HTML validation improves the experience but never replaces server-side validation.",
      ),
      code: `<form>
  <fieldset>
    <legend>Inscription</legend>

    <label for="name">Nom complet</label>
    <input id="name" name="name" required minlength="2"
           autocomplete="name">

    <label for="email">E-mail</label>
    <input id="email" name="email" type="email" required
           autocomplete="email">

    <label for="phone">Téléphone (Mobile Money)</label>
    <input id="phone" name="phone" type="tel" inputmode="tel"
           pattern="[0-9 +]{8,15}" placeholder="+243 81 234 5678">

    <label for="level">Niveau</label>
    <select id="level" name="level">
      <option>Débutant</option>
      <option>Intermédiaire</option>
    </select>
  </fieldset>

  <button type="submit">Envoyer</button>
</form>`,
      language: "html",
      exercise: t(
        "Créez un formulaire d'inscription à un événement avec validation : nom, e-mail, téléphone, date et case d'acceptation des conditions.",
        "Build an event registration form with validation: name, email, phone, date and a terms checkbox.",
      ),
    },
    {
      id: "html-11",
      title: t("SEO et métadonnées", "SEO & metadata"),
      description: t("Aidez Google et les réseaux sociaux à présenter vos pages.", "Help Google and social networks present your pages."),
      explanation: t(
        "La balise title et la meta description apparaissent dans les résultats de recherche. La meta viewport est indispensable sur mobile. Les balises Open Graph contrôlent l'aperçu lors d'un partage (WhatsApp, Facebook, LinkedIn). Le lien canonical évite le contenu dupliqué, et les données structurées JSON-LD décrivent votre contenu aux moteurs de recherche.",
        "The title tag and meta description appear in search results. The viewport meta is essential on mobile. Open Graph tags control the preview when a page is shared (WhatsApp, Facebook, LinkedIn). The canonical link avoids duplicate content, and JSON-LD structured data describes your content to search engines.",
      ),
      code: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cours HTML gratuit | Linko Academy</title>
  <meta name="description"
        content="Apprenez HTML et CSS gratuitement, pas à pas.">
  <link rel="canonical" href="https://example.com/cours-html">

  <meta property="og:title" content="Cours HTML gratuit">
  <meta property="og:description" content="Apprenez HTML pas à pas.">
  <meta property="og:image" content="https://example.com/cover.png">

  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "Course",
    "name": "HTML — Les fondamentaux",
    "provider": { "@type": "Organization", "name": "Linko Academy" } }
  </script>
</head>
<body>
  <h1>Cours HTML gratuit</h1>
</body>
</html>`,
      language: "html",
      exercise: t(
        "Ajoutez à votre page un titre unique, une meta description de moins de 160 caractères et des balises Open Graph complètes.",
        "Give your page a unique title, a meta description under 160 characters and complete Open Graph tags.",
      ),
    },
    {
      id: "html-12",
      title: t("Images responsives et multimédia", "Responsive images & media"),
      description: t("Des images rapides sur mobile et des vidéos accessibles.", "Fast images on mobile and accessible videos."),
      explanation: t(
        "srcset et sizes laissent le navigateur choisir la taille d'image adaptée à l'écran, ce qui économise les données mobiles. picture permet de proposer des formats modernes (AVIF, WebP) avec une solution de repli. loading=\"lazy\" retarde le chargement des images hors écran. figure et figcaption associent une légende, et la balise track ajoute des sous-titres aux vidéos.",
        "srcset and sizes let the browser pick the right image size for the screen, which saves mobile data. picture serves modern formats (AVIF, WebP) with a fallback. loading=\"lazy\" defers off-screen images. figure and figcaption attach a caption, and the track element adds subtitles to videos.",
      ),
      code: `<figure>
  <picture>
    <source type="image/webp"
            srcset="https://picsum.photos/seed/web/480/240.webp 480w,
                    https://picsum.photos/seed/web/960/480.webp 960w"
            sizes="(max-width: 600px) 100vw, 600px">
    <img src="https://picsum.photos/seed/web/600/300"
         alt="Une équipe qui travaille sur un site web"
         width="600" height="300" loading="lazy">
  </picture>
  <figcaption>Une image légère, adaptée à chaque écran.</figcaption>
</figure>

<video controls width="600" preload="metadata">
  <source src="cours.mp4" type="video/mp4">
  <track kind="subtitles" src="cours-fr.vtt" srclang="fr" label="Français">
</video>`,
      language: "html",
      exercise: t(
        "Créez une galerie de trois images responsives avec srcset, lazy loading et une légende pour chacune.",
        "Build a gallery of three responsive images with srcset, lazy loading and a caption for each.",
      ),
    },
  ],
}

const cssAdvanced: Module = {
  id: "css-module-5",
  advanced: true,
  title: t("Module 5 — CSS avancé", "Module 5 — Advanced CSS"),
  lessons: [
    {
      id: "css-9",
      title: t("Variables CSS et mode sombre", "Custom properties & dark mode"),
      description: t("Un thème cohérent, modifiable en une ligne.", "A consistent theme you can change in one line."),
      explanation: t(
        "Les propriétés personnalisées (--nom) stockent couleurs, espacements et rayons à un seul endroit, puis var() les réutilise. Redéfinies dans une media query prefers-color-scheme: dark, elles basculent tout le site en mode sombre sans dupliquer les règles.",
        "Custom properties (--name) keep colours, spacing and radii in one place, and var() reuses them. Redefined inside a prefers-color-scheme: dark media query, they switch the whole site to dark mode without duplicating rules.",
      ),
      code: `:root {
  --brand: #064e3b;
  --bg: #ffffff;
  --text: #111827;
  --card: #f3f4f6;
  --radius: 14px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0b1512;
    --text: #e5f4ee;
    --card: #15241f;
  }
}

body { background: var(--bg); color: var(--text); }

.card {
  background: var(--card);
  border-radius: var(--radius);
  padding: 16px;
  margin: 12px 0;
}

.btn {
  display: inline-block;
  background: var(--brand);
  color: white;
  padding: 10px 16px;
  border-radius: var(--radius);
  text-decoration: none;
}`,
      language: "css",
      exercise: t(
        "Définissez une palette de 5 variables et créez un thème clair et un thème sombre pour votre page.",
        "Define a 5-variable palette and create a light and a dark theme for your page.",
      ),
    },
    {
      id: "css-10",
      title: t("Grid avancé", "Advanced Grid"),
      description: t("Des mises en page complexes en quelques lignes.", "Complex layouts in a few lines."),
      explanation: t(
        "grid-template-areas nomme les zones de la page pour une mise en page lisible. repeat(auto-fit, minmax(200px, 1fr)) crée une grille qui s'adapte seule au nombre de colonnes possible, sans media query. gap gère l'espacement entre les cellules.",
        "grid-template-areas names page regions for a readable layout. repeat(auto-fit, minmax(200px, 1fr)) creates a grid that adapts its column count by itself, with no media query. gap handles the spacing between cells.",
      ),
      code: `.layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-areas:
    "header header"
    "side   main"
    "footer footer";
  gap: 12px;
}
.layout > header { grid-area: header; }
.layout > aside  { grid-area: side; }
.layout > main   { grid-area: main; }
.layout > footer { grid-area: footer; }

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.layout > *, .cards > * {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 10px;
  padding: 12px;
}

@media (max-width: 600px) {
  .layout {
    grid-template-columns: 1fr;
    grid-template-areas: "header" "main" "side" "footer";
  }
}`,
      previewHtml: `<div class="layout">
  <header>En-tête</header>
  <aside>Menu</aside>
  <main>
    <div class="cards">
      <div>HTML</div><div>CSS</div><div>Grid</div><div>Flexbox</div><div>Responsive</div>
    </div>
  </main>
  <footer>Pied de page</footer>
</div>`,
      language: "css",
      exercise: t(
        "Créez un tableau de bord avec grid-template-areas : en-tête, menu latéral, contenu et pied de page, qui passe sur une colonne sur mobile.",
        "Build a dashboard with grid-template-areas: header, sidebar, content and footer, switching to one column on mobile.",
      ),
    },
    {
      id: "css-11",
      title: t("Transitions et animations", "Transitions & animations"),
      description: t("Du mouvement utile, fluide et respectueux.", "Useful, smooth and respectful motion."),
      explanation: t(
        "transition anime un changement d'état (survol, focus). @keyframes décrit une animation en plusieurs étapes. Animez de préférence transform et opacity, que le navigateur accélère. Respectez prefers-reduced-motion pour les personnes sensibles au mouvement.",
        "transition animates a state change (hover, focus). @keyframes describes a multi-step animation. Prefer animating transform and opacity, which the browser accelerates. Honour prefers-reduced-motion for people sensitive to motion.",
      ),
      code: `.card {
  background: #f3f4f6;
  border-radius: 14px;
  padding: 16px;
  margin: 12px 0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
h1 { animation: fade-up 0.6s ease-out both; }

.btn {
  display: inline-block;
  background: #064e3b;
  color: white;
  padding: 10px 16px;
  border-radius: 10px;
  text-decoration: none;
  transition: background 0.2s;
}
.btn:hover { background: #10b981; }

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}`,
      language: "css",
      exercise: t(
        "Ajoutez une animation d'apparition aux cartes de votre page et un effet de survol sur les boutons, en respectant prefers-reduced-motion.",
        "Add an entrance animation to your page's cards and a hover effect on buttons, honouring prefers-reduced-motion.",
      ),
    },
    {
      id: "css-12",
      title: t("CSS moderne : clamp(), :has() et container queries", "Modern CSS: clamp(), :has() & container queries"),
      description: t("Les outils récents qui simplifient le responsive.", "Recent tools that make responsive design simpler."),
      explanation: t(
        "clamp(min, idéal, max) crée une typographie fluide qui grandit avec l'écran sans dépasser des limites. Les container queries adaptent un composant à la largeur de son conteneur, et non de l'écran : idéal pour des cartes réutilisables. Le sélecteur :has() stylise un parent selon son contenu, par exemple une carte qui contient une image.",
        "clamp(min, ideal, max) creates fluid typography that grows with the screen within limits. Container queries adapt a component to its container's width rather than the screen's: ideal for reusable cards. The :has() selector styles a parent based on its content, such as a card that contains an image.",
      ),
      code: `h1 {
  font-size: clamp(1.6rem, 4vw + 1rem, 3rem);
}

.wrap { container-type: inline-size; }

.card {
  display: grid;
  gap: 12px;
  background: #f3f4f6;
  border-radius: 14px;
  padding: 16px;
  margin: 12px 0;
}

/* Side by side only when the card's container is wide enough */
@container (min-width: 420px) {
  .card { grid-template-columns: 140px 1fr; align-items: center; }
}

/* Cards with an image get a green border */
.card:has(img) { border: 2px solid #10b981; }

.card img { width: 100%; border-radius: 10px; }`,
      previewHtml: `<h1>CSS moderne</h1>
<div class="wrap">
  <div class="card">
    <img src="https://picsum.photos/seed/css/280/180" alt="">
    <div><h3>Carte avec image</h3><p>Redimensionnez l'aperçu pour voir la container query.</p></div>
  </div>
  <div class="card"><h3>Carte sans image</h3><p>Pas de bordure verte ici.</p></div>
</div>`,
      language: "css",
      exercise: t(
        "Créez un composant carte réutilisable qui change de mise en page grâce à une container query et dont le titre utilise clamp().",
        "Build a reusable card component whose layout changes with a container query and whose heading uses clamp().",
      ),
    },
  ],
}

const advancedModules: Record<string, Module> = {
  "html-foundations": htmlAdvanced,
  "css-foundations": cssAdvanced,
}

/** Core modules plus the advanced module of each track. */
export const trainings: Training[] = baseTrainings.map((training) => {
  const modules = advancedModules[training.id] ? [...training.modules, advancedModules[training.id]] : training.modules
  return { ...training, modules, lessonsCount: modules.reduce((n, m) => n + m.lessons.length, 0) }
})

export function findLesson(id: string) {
  for (const training of trainings) {
    for (const mod of training.modules) {
      const lesson = mod.lessons.find((l) => l.id === id)
      if (lesson) return { training, module: mod, lesson }
    }
  }
  return null
}
