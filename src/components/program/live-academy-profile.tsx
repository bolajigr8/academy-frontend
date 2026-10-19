"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

import { useLiveSaved } from "@/components/search/use-live-saved"
import { CheckList } from "@/components/shared/check-list"
import { ClubCrest } from "@/components/shared/club-crest"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { ListingCard } from "@/components/shared/listing-card"
import { SafeImage } from "@/components/shared/safe-image"
import { VerifyBadge } from "@/components/shared/verify-badge"
import { ButtonLink } from "@/components/ui/button-link"
import { LIVE } from "@/data/live-copy"
import { getAcademyProfile } from "@/features/academies/api"
import { cardFromSearch } from "@/features/academies/card-view"
import { discoveryKeys } from "@/features/academies/query-keys"
import { crestFor } from "@/features/academies/search"
import { getApiStatus } from "@/lib/api/errors"
import { routes } from "@/routes"

const h2 = "font-display text-fs-24 font-bold uppercase"

/*
 * GET /academy/profiles/{slug} (week 1 part 2, section 15). Only verified and
 * club academies are public; anything else answers 404 like an unknown slug.
 * No prototype page exists: the layout reuses the listing page's pieces
 * (crest, badge, photos, check list, cards). Ratings stay "New" until reviews
 * arrive (week 3); the profile carries no verification note or documents.
 */
export function LiveAcademyProfile({ slug }: { slug: string }) {
  const t = LIVE.academyProfile
  const saved = useLiveSaved()
  const query = useQuery({
    queryKey: discoveryKeys.profile(slug),
    queryFn: () => getAcademyProfile(slug),
    retry: false,
  })
  const a = query.data
  useEffect(() => {
    if (a) document.title = `${a.name} · Golafly Academy`
  }, [a])

  if (query.isPending) return <div className="min-h-screen" aria-busy="true" />
  if (!a)
    return (
      <main id="main" className="am-container py-16">
        {getApiStatus(query.error) === 404 ? (
          <EmptyState
            icon="search"
            title={t.notFoundTitle}
            text={t.notFoundText}
            cta={<ButtonLink href={routes.academies()}>{t.browse}</ButtonLink>}
          />
        ) : (
          <ErrorState
            message={LIVE.requestFailed}
            onRetry={() => void query.refetch()}
          />
        )}
      </main>
    )

  const photos = [...a.images].sort(
    (x, y) =>
      Number(y.is_primary) - Number(x.is_primary) || x.sort_order - y.sort_order
  )
  return (
    <div className="am-container grid gap-[clamp(28px,4vw,48px)] pt-6 pb-16">
      <header className="grid gap-4">
        {a.header_image_url ? (
          <div className="relative aspect-[16/5] overflow-hidden rounded-lg bg-bg-3 le-720:aspect-[16/8]">
            <SafeImage
              src={a.header_image_url}
              alt=""
              fill
              unoptimized
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover [filter:var(--filter-media)]"
            />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-4">
          {a.logo_url ? (
            <span className="relative size-[72px] flex-none overflow-hidden rounded-md bg-bg-3">
              <SafeImage
                src={a.logo_url}
                alt=""
                fill
                unoptimized
                sizes="72px"
                className="object-contain"
              />
            </span>
          ) : (
            <ClubCrest
              crest={crestFor({ id: a.slug, name: a.name })}
              size={72}
            />
          )}
          <div className="grid min-w-0 gap-1">
            <p className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
              {a.city}, {a.country_name}
            </p>
            <h1 className="font-display text-[clamp(28px,4vw,48px)] leading-none font-bold [overflow-wrap:anywhere] uppercase">
              {a.name}
            </h1>
            {a.club_name ? (
              <p className="text-fs-14 text-fg-2">
                {t.officialAcademyOf} {a.club_name}
              </p>
            ) : null}
          </div>
          <span className="ml-auto le-720:ml-0">
            <VerifyBadge
              v={a.verification_status === "club_academy" ? "club" : "verified"}
            />
          </span>
        </div>
        {a.address ? <p className="text-fs-14 text-fg-3">{a.address}</p> : null}
      </header>

      {a.description ? (
        <section aria-labelledby="ap-about" className="grid max-w-[72ch] gap-3">
          <h2 id="ap-about" className={h2}>
            {t.about}
          </h2>
          <p className="text-fs-16 leading-lh-relaxed whitespace-pre-line text-fg-2">
            {a.description}
          </p>
        </section>
      ) : null}

      {a.facilities.length || a.policies ? (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 le-900:grid-cols-[minmax(0,1fr)]">
          {a.facilities.length ? (
            <section
              aria-labelledby="ap-fac"
              className="grid content-start gap-3"
            >
              <h2 id="ap-fac" className={h2}>
                {t.facilities}
              </h2>
              <CheckList items={a.facilities.map((text) => ({ text }))} />
            </section>
          ) : null}
          {a.policies ? (
            <section
              aria-labelledby="ap-pol"
              className="grid content-start gap-3"
            >
              <h2 id="ap-pol" className={h2}>
                {t.policies}
              </h2>
              <p className="text-fs-15 leading-lh-relaxed whitespace-pre-line text-fg-2">
                {a.policies}
              </p>
            </section>
          ) : null}
        </div>
      ) : null}

      {photos.length ? (
        <section aria-labelledby="ap-photos" className="grid gap-3">
          <h2 id="ap-photos" className={h2}>
            {t.photos}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-3">
            {photos.map((p) => (
              <div
                key={p.id}
                className="relative aspect-[4/3] overflow-hidden rounded-md bg-bg-3"
              >
                <SafeImage
                  src={p.url}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 720px) 100vw, 320px"
                  className="object-cover [filter:var(--filter-media)]"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="ap-programs" className="grid gap-4">
        <h2 id="ap-programs" className={h2}>
          {t.programs}
        </h2>
        {a.listings.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-x-[clamp(16px,2vw,28px)] gap-y-[clamp(20px,2.5vw,32px)]">
            {a.listings.map((c, i) => (
              <ListingCard
                key={c.id}
                index={i}
                card={cardFromSearch(c)}
                saved={saved.isSaved(c)}
                onSave={() => void saved.toggle(c)}
              />
            ))}
          </div>
        ) : (
          <p className="text-fs-15 text-fg-3">{t.noPrograms}</p>
        )}
      </section>
    </div>
  )
}
