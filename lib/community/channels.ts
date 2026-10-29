import type { LocalizedText } from "@/lib/mock-data"

export type ChannelId = "general" | "html-css" | "programming" | "languages" | "business"

export const CHANNELS: { id: ChannelId; name: LocalizedText; description: LocalizedText }[] = [
  { id: "general", name: { fr: "Général", en: "General" }, description: { fr: "Présentez-vous et discutez avec la communauté.", en: "Introduce yourself and chat with the community." } },
  { id: "html-css", name: { fr: "HTML & CSS", en: "HTML & CSS" }, description: { fr: "Questions sur le cours gratuit et vos projets web.", en: "Questions about the free course and your web projects." } },
  { id: "programming", name: { fr: "Programmation", en: "Programming" }, description: { fr: "Python, JavaScript, TypeScript, Java, SQL…", en: "Python, JavaScript, TypeScript, Java, SQL…" } },
  { id: "languages", name: { fr: "Langues", en: "Languages" }, description: { fr: "Twi, Ga, Ewe, français, anglais.", en: "Twi, Ga, Ewe, French, English." } },
  { id: "business", name: { fr: "Business & carrière", en: "Business & careers" }, description: { fr: "Entrepreneuriat, emploi, freelance.", en: "Entrepreneurship, jobs, freelancing." } },
]
