import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/*
 * tailwind-merge only knows Tailwind's own scale names. This design system adds
 * its own (globals.css, @theme inline): text-fs-*, leading-lh-*, tracking-gf-*
 * and rounded-pill. Without these lists, text-fs-16 is mistaken for a text COLOR
 * and silently deletes the real color class (a bug that turned primary button
 * text white). Keep these lists in step with globals.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "fs-12",
        "fs-13",
        "fs-14",
        "fs-16",
        "fs-18",
        "fs-20",
        "fs-24",
        "fs-32",
        "fs-40",
        "fs-56",
        "fs-72",
        "fs-96",
      ],
      leading: ["lh-tight", "lh-snug", "lh-normal", "lh-relaxed"],
      tracking: ["gf-tight", "gf-normal", "gf-wide", "gf-widest"],
      radius: ["pill"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
