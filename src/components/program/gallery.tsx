"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { Modal } from "@/components/shared/modal"
import { SafeImage } from "@/components/shared/safe-image"
import { Button } from "@/components/ui/button"
import { PROGRAM } from "@/data/search-copy"
import type { EnrichedListing } from "@/features/academies/types"
import { easeOut, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

/* AmGallery + lightbox: js/amk-listing.jsx, css/amk-pages.css:177-195 and 720 rules */
export function Gallery({ listing: l }: { listing: EnrichedListing }) {
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)
  const imgs = l.gallery
  const n = imgs.length
  const t = PROGRAM
  const show = (i: number) => {
    setIdx(i)
    setOpen(true)
  }
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % n)
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + n) % n)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, n])
  const alt = (i: number) =>
    i === 0 ? l.alt : `${l.academy.name} — photo ${i + 1} of ${n}`

  return (
    <>
      <div className="relative grid h-[clamp(300px,38vw,480px)] grid-cols-[2fr_1fr_1fr] grid-rows-[1fr_1fr] gap-2 overflow-hidden rounded-xl le-720:h-[300px] le-720:grid-cols-[2fr_1fr]">
        {imgs.slice(0, 5).map((src, i) => (
          <motion.button
            initial="rest"
            whileHover="hover"
            whileTap={{ scale: 0.99, transition: spring }}
            key={src + i}
            type="button"
            onClick={() => show(i)}
            aria-label={`${t.openPhoto} ${i + 1} ${t.of} ${n}`}
            className={cn(
              "group relative cursor-zoom-in overflow-hidden border-0 bg-bg-3 p-0 focus-visible:outline-offset-[-4px]",
              i === 0 && "row-[1/3]",
              i >= 3 && "le-720:hidden"
            )}
          >
            <motion.span
              className="absolute inset-0 block"
              variants={{ rest: { scale: 1 }, hover: { scale: 1.04 } }}
              transition={{ duration: 0.42, ease: easeOut }}
            >
              <SafeImage
                src={src}
                alt={alt(i)}
                fill
                preload={i === 0}
                sizes={
                  i === 0
                    ? "(max-width: 720px) 66vw, 50vw"
                    : "(max-width: 720px) 33vw, 25vw"
                }
                className="object-cover [filter:var(--filter-media)]"
              />
            </motion.span>
          </motion.button>
        ))}
        <Button
          variant="white"
          size="sm"
          onClick={() => show(0)}
          className="absolute right-4 bottom-4 shadow-(--shadow-md)"
        >
          <Icon name="grid" size={15} /> {t.showAllPhotos}
        </Button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${l.academy.name} · ${idx + 1} / ${n}`}
        size="full"
      >
        <div className="grid h-full grid-rows-[minmax(0,1fr)_auto] gap-4">
          <div className="relative min-h-0 overflow-hidden rounded-md bg-gf-black">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={idx}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: easeOut }}
              >
                <SafeImage
                  src={imgs[idx]}
                  alt={alt(idx)}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="secondary"
              onClick={() => setIdx((idx - 1 + n) % n)}
              className="le-720:px-3"
            >
              <Icon name="arrowl" size={16} /> {t.previous}
            </Button>
            <div className="flex gap-1.5 overflow-x-auto">
              {imgs.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  aria-label={`${t.photo} ${i + 1}`}
                  aria-current={i === idx ? "true" : undefined}
                  onClick={() => setIdx(i)}
                  className="relative h-[54px] w-[72px] flex-none overflow-hidden rounded-[8px] border-2 border-transparent bg-transparent p-0 opacity-60 aria-[current=true]:border-gf-neon aria-[current=true]:opacity-100"
                >
                  <SafeImage
                    src={src}
                    alt=""
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              onClick={() => setIdx((idx + 1) % n)}
              className="le-720:px-3"
            >
              {t.next} <Icon name="arrow" size={16} />
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
