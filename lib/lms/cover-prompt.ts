import type { AiTrack } from "@/lib/lms/catalog"

const GHANAIAN = ["twi", "ga", "ewe"]

/** Covers show the subject itself — objects, screens, materials — never people. */
export function coverPrompt(track: AiTrack) {
  const name = track.name.en
  const scene =
    track.kind === "programming"
      ? `a clean, modern developer workspace seen close up: a laptop and a large monitor showing a dark-theme code editor full of ${name} code with syntax highlighting, a mechanical keyboard, a coffee mug and a small plant on a wooden desk, soft window light. The code is the hero of the image`
      : track.kind === "language"
        ? GHANAIAN.includes(track.slug)
          ? `a still life about learning the ${name} language of Ghana: an open notebook with handwritten vocabulary, flashcards, a pen and a phone with a language app, laid on a richly patterned kente cloth with a few everyday Ghanaian objects (a calabash, cowrie shells)`
          : `a still life about learning ${name}: an open textbook and notebook with handwritten vocabulary, colourful flashcards, a pen, headphones and a phone with a language app on a café table`
        : `a still life of the real tools and materials of ${name} work, arranged on a modern desk — screens, documents, devices and objects that clearly show what ${name} is about`
  return `Photorealistic photograph for the cover of an online course called "${name}".
Scene: ${scene}.
${track.description ? `The course is about: ${track.description.en}` : ""}
Absolutely no people: no faces, no hands, no bodies, no silhouettes, no reflections of people.
Photography: professional product/editorial stock-photo quality, shot on a full-frame camera, natural light, shallow depth of field, true-to-life colours, wide 16:9 framing with the main subject slightly right of centre. A subtle deep-green tone in the environment is welcome.
Strictly a real photograph: no illustration, no cartoon, no 3D render, no CGI look. Any handwriting, flashcard or page text is shot at an angle with very shallow depth of field so it is blurred and unreadable — never legible words. Screen text stays soft; no logos, no watermark.`
}
