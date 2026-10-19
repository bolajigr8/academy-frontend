/*
 * Every image path in the app lives here. Nothing else writes "/assets/...".
 * Folders and file names are the prototype's own (academy-marketplace uses
 * /assets/academy/, /assets/deck/ and /assets/academy/brand/), so the designer's
 * image folders can be copied into public/assets/ unchanged.
 * A missing file never breaks a page: images render through SafeImage, which shows the crest.
 */

/** public/assets/academy/ */
const ACADEMY_FILES = [
  "card-dribble.jpg",
  "card-duel.jpg",
  "card-dusk.jpg",
  "card-group.jpg",
  "card-lead.jpg",
  "card-night.jpg",
  "card-pose.jpg",
  "card-stadium.jpg",
  "card-studio.jpg",
  "field-cones.jpg",
  "field-goal.jpg",
  "hero-stadium.jpg",
  "match-duel.jpg",
  "match-stadium.jpg",
] as const

/** public/assets/deck/ */
const DECK_FILES = [
  "deck-bus.jpg",
  "deck-camp1.jpg",
  "deck-camp2.jpg",
  "deck-camp3.jpg",
  "deck-coach.jpg",
  "deck-hotel.jpg",
  "deck-meal.jpg",
  "deck-plane.jpg",
  "deck-squad.jpg",
  "deck-stadium-night.jpg",
  "deck-stadium.jpg",
  "deck-why.jpg",
] as const

/** public/assets/academy/brand/ (site icons, see app/layout.tsx) */
const BRAND_FILES = [
  "academy-crest.svg",
  "academy-crest-128.png",
  "academy-crest-180.png",
] as const

export type AcademyFile = (typeof ACADEMY_FILES)[number]
export type DeckFile = (typeof DECK_FILES)[number]
export type PhotoFile = AcademyFile | DeckFile
export type BrandFile = (typeof BRAND_FILES)[number]

/** Every image the app expects, folder by folder (the asset manifest) */
export const imageManifest = {
  "public/assets/academy/": ACADEMY_FILES,
  "public/assets/deck/": DECK_FILES,
  "public/assets/academy/brand/": BRAND_FILES,
} as const

const isDeck = (file: PhotoFile): file is DeckFile => file.startsWith("deck-")

/** A photo's public path. A typo in the file name is a compile error. */
export const academyPhoto = (file: PhotoFile) =>
  isDeck(file)
    ? (`/assets/deck/${file}` as const)
    : (`/assets/academy/${file}` as const)

/** A site-icon file's public path */
export const brandFile = (file: BrandFile) =>
  `/assets/academy/brand/${file}` as const

export const assets = {
  home: {
    heroStadium: academyPhoto("hero-stadium.jpg"),
    travelPlane: academyPhoto("deck-plane.jpg"),
  },
  academies: {
    fieldGoal: academyPhoto("field-goal.jpg"),
    cardStudio: academyPhoto("card-studio.jpg"),
  },
} as const
