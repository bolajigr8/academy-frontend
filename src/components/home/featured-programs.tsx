"use client"

import { Icon } from "@/components/icons/icon"
import { DisplayHeading } from "@/components/shared/display-heading"
import { Eyebrow } from "@/components/shared/eyebrow"
import { ListingCard } from "@/components/shared/listing-card"
import { Reveal } from "@/components/shared/reveal"
import { Section, SectionHeader } from "@/components/shared/section"
import { useSaveToggle } from "@/components/shared/use-save-toggle"
import { useLiveSaved } from "@/components/search/use-live-saved"
import { ButtonLink } from "@/components/ui/button-link"
import { HOME } from "@/data/home-copy"
import { cardFromSearch } from "@/features/academies/card-view"
import { useHome } from "@/features/home/hooks"
import { useLiveHome } from "@/features/home/live-hooks"
import { isLive } from "@/lib/data-source"
import { routes } from "@/routes"

/* AmFeatured + .amk-grid: js/amk-ui.jsx:309, css/amk.css:142 */
export function FeaturedPrograms() {
  return isLive("discovery") ? <LiveFeatured /> : <DemoFeatured />
}

function DemoFeatured() {
  const { ready, featured, saved, total } = useHome()
  const onSave = useSaveToggle()
  const t = HOME.featured
  return (
    <Section alt aria-labelledby="amk-feat-title">
      <Reveal className="am-container">
        <SectionHeader
          action={
            <ButtonLink href={routes.academies()} variant="secondary">
              {t.browseA} {total} {t.browseB} <Icon name="arrow" size={16} />
            </ButtonLink>
          }
        >
          <Eyebrow className="mb-3">{t.eyebrow}</Eyebrow>
          <DisplayHeading id="amk-feat-title">{t.title}</DisplayHeading>
        </SectionHeader>
        <div className="grid min-h-[420px] grid-cols-[repeat(3,minmax(0,1fr))] gap-x-[clamp(16px,2vw,28px)] gap-y-[clamp(20px,2.5vw,32px)] le-1024:grid-cols-[repeat(2,minmax(0,1fr))] le-720:grid-cols-[1fr]">
          {ready
            ? featured.map((l, i) => (
                <ListingCard
                  index={i}
                  key={l.id}
                  listing={l}
                  saved={saved.includes(l.id)}
                  onSave={onSave}
                />
              ))
            : null}
        </div>
      </Reveal>
    </Section>
  )
}

/* api mode: GET /academy/search (relevance, 6 cards); the button counts every public program */
function LiveFeatured() {
  const { featured, total } = useLiveHome()
  const saved = useLiveSaved()
  const t = HOME.featured
  if (featured && featured.length === 0) return null
  return (
    <Section alt aria-labelledby="amk-feat-title">
      <Reveal className="am-container">
        <SectionHeader
          action={
            <ButtonLink href={routes.academies()} variant="secondary">
              {t.browseA} {total ?? ""} {t.browseB}{" "}
              <Icon name="arrow" size={16} />
            </ButtonLink>
          }
        >
          <Eyebrow className="mb-3">{t.eyebrow}</Eyebrow>
          <DisplayHeading id="amk-feat-title">{t.title}</DisplayHeading>
        </SectionHeader>
        <div className="grid min-h-[420px] grid-cols-[repeat(3,minmax(0,1fr))] gap-x-[clamp(16px,2vw,28px)] gap-y-[clamp(20px,2.5vw,32px)] le-1024:grid-cols-[repeat(2,minmax(0,1fr))] le-720:grid-cols-[1fr]">
          {(featured ?? []).map((c, i) => (
            <ListingCard
              index={i}
              key={c.id}
              card={cardFromSearch(c)}
              saved={saved.isSaved(c)}
              onSave={() => void saved.toggle(c)}
            />
          ))}
        </div>
      </Reveal>
    </Section>
  )
}
