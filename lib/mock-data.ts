import type { Locale } from './i18n/dictionary'

// Bilingual editorial string. Later the backend returns the same shape or a
// single localized string resolved server-side / by Gemini translation.
export type LocalizedText = { fr: string; en: string }

export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.fr
}

export type Level = 'beginner' | 'intermediate' | 'advanced'

export type FormationCategory =
  | 'programming'
  | 'web'
  | 'mobile'
  | 'desktop'
  | 'saas'
  | 'api'
  | 'database'
  | 'tools'
  | 'marketing'
  | 'entrepreneurship'
  | 'payments'

export type Module = {
  id: string
  title: LocalizedText
  duration: number // hours
  lessons: number
  hasSourceCode: boolean
}

export type Formation = {
  id: string
  slug: string
  title: LocalizedText
  summary: LocalizedText
  description: LocalizedText
  category: FormationCategory
  level: Level
  priceUsd: number
  durationHours: number
  moduleCount: number
  studentsCount: number
  rating: number
  popular?: boolean
  isNew?: boolean
  objectives: LocalizedText[]
  prerequisites: LocalizedText[]
  modules: Module[]
  image: string
}

export const categoryLabels: Record<FormationCategory, LocalizedText> = {
  programming: { fr: 'Programmation', en: 'Programming' },
  web: { fr: 'Développement web', en: 'Web development' },
  mobile: { fr: 'Développement mobile', en: 'Mobile development' },
  desktop: { fr: 'Développement desktop', en: 'Desktop development' },
  saas: { fr: 'Solutions SaaS', en: 'SaaS solutions' },
  api: { fr: 'Conception d’API', en: 'API design' },
  database: { fr: 'Bases de données', en: 'Databases' },
  tools: { fr: 'Outils numériques', en: 'Digital tools' },
  marketing: { fr: 'Marketing digital', en: 'Digital marketing' },
  entrepreneurship: { fr: 'Entrepreneuriat', en: 'Entrepreneurship' },
  payments: { fr: 'Paiements en ligne', en: 'Online payments' },
}

const genericModules = (n: number): Module[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `m${i + 1}`,
    title: {
      fr: `Module ${i + 1} — Concepts et pratique`,
      en: `Module ${i + 1} — Concepts and practice`,
    },
    duration: 3 + (i % 3),
    lessons: 5 + (i % 4),
    hasSourceCode: i % 2 === 0,
  }))

export const formations: Formation[] = [
  {
    id: 'f1',
    slug: 'programmation-fondamentaux',
    title: { fr: 'Programmation : les fondamentaux', en: 'Programming: the fundamentals' },
    summary: {
      fr: 'Démarrez la programmation à partir de zéro avec des exercices concrets.',
      en: 'Start programming from scratch with hands-on exercises.',
    },
    description: {
      fr: 'Un parcours complet pour comprendre la logique de programmation, les algorithmes, les structures de données et écrire vos premiers programmes fiables.',
      en: 'A complete path to understand programming logic, algorithms, data structures and write your first reliable programs.',
    },
    category: 'programming',
    level: 'beginner',
    priceUsd: 15,
    durationHours: 24,
    moduleCount: 8,
    studentsCount: 1240,
    rating: 4.8,
    popular: true,
    objectives: [
      { fr: 'Comprendre la logique de programmation', en: 'Understand programming logic' },
      { fr: 'Manipuler variables, boucles et fonctions', en: 'Use variables, loops and functions' },
      { fr: 'Résoudre des problèmes avec des algorithmes', en: 'Solve problems with algorithms' },
    ],
    prerequisites: [{ fr: 'Aucun prérequis', en: 'No prerequisites' }],
    modules: genericModules(8),
    image: '/courses/programming.png',
  },
  {
    id: 'f2',
    slug: 'developpement-web-fullstack',
    title: { fr: 'Développement web full-stack', en: 'Full-stack web development' },
    summary: {
      fr: 'Construisez des applications web modernes avec Next.js et Node.js.',
      en: 'Build modern web apps with Next.js and Node.js.',
    },
    description: {
      fr: 'Maîtrisez le front-end et le back-end : Next.js, React, API REST, bases de données et déploiement en production.',
      en: 'Master front-end and back-end: Next.js, React, REST APIs, databases and production deployment.',
    },
    category: 'web',
    level: 'intermediate',
    priceUsd: 15,
    durationHours: 40,
    moduleCount: 12,
    studentsCount: 980,
    rating: 4.9,
    popular: true,
    objectives: [
      { fr: 'Créer des interfaces avec React et Next.js', en: 'Build interfaces with React and Next.js' },
      { fr: 'Développer des API REST sécurisées', en: 'Develop secure REST APIs' },
      { fr: 'Déployer une application complète', en: 'Deploy a full application' },
    ],
    prerequisites: [{ fr: 'Bases de programmation', en: 'Programming basics' }],
    modules: genericModules(12),
    image: '/courses/web.png',
  },
  {
    id: 'f3',
    slug: 'developpement-mobile',
    title: { fr: 'Développement mobile', en: 'Mobile development' },
    summary: {
      fr: 'Créez des applications mobiles multiplateformes performantes.',
      en: 'Build performant cross-platform mobile apps.',
    },
    description: {
      fr: 'Apprenez à concevoir, développer et publier des applications mobiles Android et iOS avec les meilleures pratiques.',
      en: 'Learn to design, build and publish Android and iOS mobile apps with best practices.',
    },
    category: 'mobile',
    level: 'intermediate',
    priceUsd: 18,
    durationHours: 36,
    moduleCount: 10,
    studentsCount: 640,
    rating: 4.7,
    objectives: [
      { fr: 'Concevoir une UI mobile moderne', en: 'Design a modern mobile UI' },
      { fr: 'Gérer la navigation et l’état', en: 'Handle navigation and state' },
      { fr: 'Publier sur les stores', en: 'Publish to app stores' },
    ],
    prerequisites: [{ fr: 'Bases de programmation', en: 'Programming basics' }],
    modules: genericModules(10),
    image: '/courses/mobile.png',
  },
  {
    id: 'f4',
    slug: 'concevoir-une-solution-saas',
    title: { fr: 'Concevoir une solution SaaS', en: 'Build a SaaS solution' },
    summary: {
      fr: 'De l’idée au produit SaaS avec abonnements et multi-tenant.',
      en: 'From idea to SaaS product with subscriptions and multi-tenancy.',
    },
    description: {
      fr: 'Architecture, authentification, facturation par abonnement, multi-tenant et bonnes pratiques pour lancer un SaaS rentable.',
      en: 'Architecture, authentication, subscription billing, multi-tenancy and best practices to launch a profitable SaaS.',
    },
    category: 'saas',
    level: 'advanced',
    priceUsd: 22,
    durationHours: 30,
    moduleCount: 9,
    studentsCount: 410,
    rating: 4.8,
    isNew: true,
    objectives: [
      { fr: 'Architecturer un produit SaaS', en: 'Architect a SaaS product' },
      { fr: 'Intégrer la facturation récurrente', en: 'Integrate recurring billing' },
      { fr: 'Gérer le multi-tenant', en: 'Handle multi-tenancy' },
    ],
    prerequisites: [{ fr: 'Développement web', en: 'Web development' }],
    modules: genericModules(9),
    image: '/courses/saas.png',
  },
  {
    id: 'f5',
    slug: 'conception-et-integration-api',
    title: { fr: 'Conception et intégration d’API', en: 'API design and integration' },
    summary: {
      fr: 'Concevez des API robustes et intégrez des services tiers.',
      en: 'Design robust APIs and integrate third-party services.',
    },
    description: {
      fr: 'REST, authentification, versioning, documentation et intégration d’API tierces, y compris les paiements.',
      en: 'REST, authentication, versioning, documentation and third-party API integration, including payments.',
    },
    category: 'api',
    level: 'intermediate',
    priceUsd: 16,
    durationHours: 22,
    moduleCount: 7,
    studentsCount: 520,
    rating: 4.6,
    objectives: [
      { fr: 'Concevoir des API REST propres', en: 'Design clean REST APIs' },
      { fr: 'Sécuriser et documenter une API', en: 'Secure and document an API' },
      { fr: 'Intégrer des API tierces', en: 'Integrate third-party APIs' },
    ],
    prerequisites: [{ fr: 'Bases de Node.js', en: 'Node.js basics' }],
    modules: genericModules(7),
    image: '/courses/api.png',
  },
  {
    id: 'f6',
    slug: 'integration-paiements-mobile-money',
    title: { fr: 'Paiements en ligne & Mobile Money', en: 'Online payments & Mobile Money' },
    summary: {
      fr: 'Intégrez des paiements en ligne et le Mobile Money en toute sécurité.',
      en: 'Integrate online payments and Mobile Money securely.',
    },
    description: {
      fr: 'Passerelles de paiement, webhooks signés, réconciliation et intégration du Mobile Money pour vos applications.',
      en: 'Payment gateways, signed webhooks, reconciliation and Mobile Money integration for your apps.',
    },
    category: 'payments',
    level: 'intermediate',
    priceUsd: 17,
    durationHours: 18,
    moduleCount: 6,
    studentsCount: 300,
    rating: 4.7,
    isNew: true,
    objectives: [
      { fr: 'Intégrer une passerelle de paiement', en: 'Integrate a payment gateway' },
      { fr: 'Sécuriser les paiements par webhook', en: 'Secure payments with webhooks' },
      { fr: 'Ajouter le Mobile Money', en: 'Add Mobile Money' },
    ],
    prerequisites: [{ fr: 'Développement back-end', en: 'Back-end development' }],
    modules: genericModules(6),
    image: '/courses/payments.png',
  },
]

export function getFormation(slug: string) {
  return formations.find((f) => f.slug === slug)
}

// ---------------------------------------------------------------------------

export type Service = {
  id: string
  slug: string
  title: LocalizedText
  summary: LocalizedText
  description: LocalizedText
  priceLabel: LocalizedText
  icon: string
  features: LocalizedText[]
}

export const services: Service[] = [
  {
    id: 's1',
    slug: 'site-vitrine',
    title: { fr: 'Site web vitrine', en: 'Showcase website' },
    summary: { fr: 'Un site élégant pour présenter votre activité.', en: 'An elegant site to present your business.' },
    description: {
      fr: 'Site vitrine responsive, optimisé SEO, avec formulaire de contact et administration simple.',
      en: 'Responsive showcase site, SEO-optimized, with contact form and simple administration.',
    },
    priceLabel: { fr: 'À partir de 199 USD', en: 'From 199 USD' },
    icon: 'Globe',
    features: [
      { fr: 'Design responsive', en: 'Responsive design' },
      { fr: 'Optimisation SEO', en: 'SEO optimization' },
      { fr: 'Formulaire de contact', en: 'Contact form' },
    ],
  },
  {
    id: 's2',
    slug: 'plateforme-web',
    title: { fr: 'Plateforme web complète', en: 'Full web platform' },
    summary: { fr: 'Applications web sur mesure et évolutives.', en: 'Custom, scalable web applications.' },
    description: {
      fr: 'Plateforme web complète avec authentification, tableau de bord, paiements et administration.',
      en: 'Full web platform with authentication, dashboard, payments and administration.',
    },
    priceLabel: { fr: 'À partir de 500 USD', en: 'From 500 USD' },
    icon: 'LayoutDashboard',
    features: [
      { fr: 'Authentification & rôles', en: 'Auth & roles' },
      { fr: 'Tableau de bord', en: 'Dashboard' },
      { fr: 'Paiements intégrés', en: 'Integrated payments' },
    ],
  },
  {
    id: 's3',
    slug: 'application-mobile',
    title: { fr: 'Application mobile', en: 'Mobile application' },
    summary: { fr: 'Apps Android et iOS performantes.', en: 'Performant Android and iOS apps.' },
    description: {
      fr: 'Développement d’applications mobiles multiplateformes avec notifications et paiements.',
      en: 'Cross-platform mobile app development with notifications and payments.',
    },
    priceLabel: { fr: 'À partir de 800 USD', en: 'From 800 USD' },
    icon: 'Smartphone',
    features: [
      { fr: 'Android & iOS', en: 'Android & iOS' },
      { fr: 'Notifications push', en: 'Push notifications' },
      { fr: 'Publication sur stores', en: 'Store publishing' },
    ],
  },
  {
    id: 's4',
    slug: 'application-desktop',
    title: { fr: 'Application desktop', en: 'Desktop application' },
    summary: { fr: 'Logiciels desktop sur mesure.', en: 'Custom desktop software.' },
    description: {
      fr: 'Applications desktop Windows, macOS et Linux adaptées à vos processus métiers.',
      en: 'Windows, macOS and Linux desktop apps tailored to your business processes.',
    },
    priceLabel: { fr: 'Prix sur devis', en: 'Price on quote' },
    icon: 'MonitorSmartphone',
    features: [
      { fr: 'Multiplateforme', en: 'Cross-platform' },
      { fr: 'Fonctionne hors-ligne', en: 'Offline capable' },
      { fr: 'Sur mesure', en: 'Custom-built' },
    ],
  },
  {
    id: 's5',
    slug: 'solution-saas',
    title: { fr: 'Solution SaaS', en: 'SaaS solution' },
    summary: { fr: 'Produits SaaS clés en main.', en: 'Turnkey SaaS products.' },
    description: {
      fr: 'Conception et développement de solutions SaaS avec abonnements, multi-tenant et analytics.',
      en: 'Design and development of SaaS solutions with subscriptions, multi-tenancy and analytics.',
    },
    priceLabel: { fr: 'Prix sur devis', en: 'Price on quote' },
    icon: 'Cloud',
    features: [
      { fr: 'Abonnements', en: 'Subscriptions' },
      { fr: 'Multi-tenant', en: 'Multi-tenant' },
      { fr: 'Analytics', en: 'Analytics' },
    ],
  },
  {
    id: 's6',
    slug: 'developpement-api',
    title: { fr: 'Développement & intégration d’API', en: 'API development & integration' },
    summary: { fr: 'APIs sur mesure et intégrations tierces.', en: 'Custom APIs and third-party integrations.' },
    description: {
      fr: 'Conception d’API personnalisées, intégration de services tiers et de paiements en ligne.',
      en: 'Custom API design, third-party service and online payment integration.',
    },
    priceLabel: { fr: 'Selon la complexité', en: 'Based on complexity' },
    icon: 'Webhook',
    features: [
      { fr: 'API REST', en: 'REST API' },
      { fr: 'Intégrations tierces', en: 'Third-party integrations' },
      { fr: 'Paiements & Mobile Money', en: 'Payments & Mobile Money' },
    ],
  },
]

export function getService(slug: string) {
  return services.find((s) => s.slug === slug)
}

// ---------------------------------------------------------------------------
// Student dashboard mock data

export type EnrolledFormation = {
  formationId: string
  progress: number // 0-100
  status: 'in-progress' | 'completed'
  nextLesson: LocalizedText
  certificateAvailable: boolean
}

export const enrolledFormations: EnrolledFormation[] = [
  {
    formationId: 'f2',
    progress: 68,
    status: 'in-progress',
    nextLesson: { fr: 'Module 9 — Authentification avec sessions', en: 'Module 9 — Session authentication' },
    certificateAvailable: false,
  },
  {
    formationId: 'f1',
    progress: 100,
    status: 'completed',
    nextLesson: { fr: 'Parcours terminé', en: 'Path completed' },
    certificateAvailable: true,
  },
  {
    formationId: 'f5',
    progress: 32,
    status: 'in-progress',
    nextLesson: { fr: 'Module 3 — Sécuriser une API', en: 'Module 3 — Securing an API' },
    certificateAvailable: false,
  },
]

// ---------------------------------------------------------------------------
// Projects & quotes (client dashboard)

export type ProjectStatus =
  | 'received'
  | 'in-study'
  | 'quote-sent'
  | 'quote-accepted'
  | 'contract-pending'
  | 'deposit-pending'
  | 'in-development'
  | 'in-review'
  | 'ready'
  | 'delivered'
  | 'maintenance'
  | 'cancelled'

export const projectStatusLabels: Record<ProjectStatus, LocalizedText> = {
  received: { fr: 'Demande reçue', en: 'Request received' },
  'in-study': { fr: 'En étude', en: 'Under study' },
  'quote-sent': { fr: 'Devis envoyé', en: 'Quote sent' },
  'quote-accepted': { fr: 'Devis accepté', en: 'Quote accepted' },
  'contract-pending': { fr: 'Contrat en attente', en: 'Contract pending' },
  'deposit-pending': { fr: 'Acompte en attente', en: 'Deposit pending' },
  'in-development': { fr: 'En développement', en: 'In development' },
  'in-review': { fr: 'En révision', en: 'In review' },
  ready: { fr: 'Prêt à livrer', en: 'Ready to deliver' },
  delivered: { fr: 'Livré', en: 'Delivered' },
  maintenance: { fr: 'En maintenance', en: 'In maintenance' },
  cancelled: { fr: 'Annulé', en: 'Cancelled' },
}

export type Project = {
  id: string
  name: LocalizedText
  type: LocalizedText
  status: ProjectStatus
  progress: number
  budgetUsd: number
  updatedAt: string
}

export const projects: Project[] = [
  {
    id: 'p1',
    name: { fr: 'Plateforme de livraison', en: 'Delivery platform' },
    type: { fr: 'Plateforme web', en: 'Web platform' },
    status: 'in-development',
    progress: 55,
    budgetUsd: 1800,
    updatedAt: '2026-08-08',
  },
  {
    id: 'p2',
    name: { fr: 'Application mobile e-commerce', en: 'E-commerce mobile app' },
    type: { fr: 'Application mobile', en: 'Mobile app' },
    status: 'quote-sent',
    progress: 10,
    budgetUsd: 3200,
    updatedAt: '2026-08-05',
  },
  {
    id: 'p3',
    name: { fr: 'Site vitrine cabinet', en: 'Firm showcase site' },
    type: { fr: 'Site vitrine', en: 'Showcase site' },
    status: 'delivered',
    progress: 100,
    budgetUsd: 350,
    updatedAt: '2026-07-28',
  },
]

// ---------------------------------------------------------------------------
// Payments & invoices

export type PaymentStatus = 'success' | 'pending' | 'failed' | 'cancelled'

export const paymentStatusLabels: Record<PaymentStatus, LocalizedText> = {
  success: { fr: 'Réussi', en: 'Success' },
  pending: { fr: 'En attente', en: 'Pending' },
  failed: { fr: 'Échoué', en: 'Failed' },
  cancelled: { fr: 'Annulé', en: 'Cancelled' },
}

export type Payment = {
  id: string
  label: LocalizedText
  amountUsd: number
  status: PaymentStatus
  method: string
  date: string
}

export const payments: Payment[] = [
  {
    id: 'PAY-1042',
    label: { fr: 'Module — Développement web', en: 'Module — Web development' },
    amountUsd: 15,
    status: 'success',
    method: 'AvadaPay',
    date: '2026-08-09',
  },
  {
    id: 'PAY-1041',
    label: { fr: 'Certificat professionnel', en: 'Professional certificate' },
    amountUsd: 19.9,
    status: 'pending',
    method: 'Mobile Money',
    date: '2026-08-08',
  },
  {
    id: 'PAY-1040',
    label: { fr: 'Abonnement étudiant', en: 'Student subscription' },
    amountUsd: 2,
    status: 'success',
    method: 'PawaPay',
    date: '2026-08-01',
  },
  {
    id: 'PAY-1039',
    label: { fr: 'Frais d’inscription', en: 'Registration fee' },
    amountUsd: 5,
    status: 'failed',
    method: 'AvadaPay',
    date: '2026-07-30',
  },
]

// ---------------------------------------------------------------------------
// Pricing (admin-editable in a real backend)

export const pricing = {
  registrationFee: 5,
  programmingModule: 15,
  studentSubscription: 2,
  certificate: 19.9,
}

// ---------------------------------------------------------------------------
// Admin statistics

export const adminStats = {
  revenueUsd: 48250,
  revenueChange: 12.4,
  sales: 1320,
  salesChange: 8.1,
  enrollments: 2840,
  enrollmentsChange: 15.2,
  activeSubscriptions: 612,
  activeSubsChange: 4.3,
  certificatesIssued: 486,
  pendingPayments: 23,
}

export const revenueByMonth: { month: string; usd: number }[] = [
  { month: 'Jan', usd: 2600 },
  { month: 'Feb', usd: 3100 },
  { month: 'Mar', usd: 3800 },
  { month: 'Apr', usd: 3400 },
  { month: 'May', usd: 4200 },
  { month: 'Jun', usd: 5100 },
  { month: 'Jul', usd: 5600 },
  { month: 'Aug', usd: 6450 },
]

// Notifications
export type Notification = {
  id: string
  title: LocalizedText
  time: string
  unread: boolean
}

export const notifications: Notification[] = [
  {
    id: 'n1',
    title: { fr: 'Paiement reçu — Module web', en: 'Payment received — Web module' },
    time: '2h',
    unread: true,
  },
  {
    id: 'n2',
    title: { fr: 'Nouveau module disponible', en: 'New module available' },
    time: '1j',
    unread: true,
  },
  {
    id: 'n3',
    title: { fr: 'Certificat prêt à télécharger', en: 'Certificate ready to download' },
    time: '3j',
    unread: false,
  },
]
