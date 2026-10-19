"use client"

import Link from "next/link"

import { LISTING_STATUS } from "@/components/club/listing-status"
import { PageHeading } from "@/components/layout/page-heading"
import { Icon } from "@/components/icons/icon"
import { AvatarInitials } from "@/components/shared/avatar-initials"
import { CardBlock } from "@/components/shared/card-block"
import { CheckList } from "@/components/shared/check-list"
import { ClubCrest } from "@/components/shared/club-crest"
import { DocItem, DocList } from "@/components/shared/doc-list"
import { EmptyState } from "@/components/shared/empty-state"
import { Grid2, Stack } from "@/components/shared/page-grid"
import { QueryState } from "@/components/shared/query-state"
import { SafeImage } from "@/components/shared/safe-image"
import { SectionHead } from "@/components/shared/section-head"
import { SpecCells } from "@/components/shared/spec-cells"
import { StatusPill } from "@/components/shared/status-pill"
import { VerifyBadge } from "@/components/shared/verify-badge"
import { notify } from "@/components/shared/notify"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { VerificationDocuments } from "@/components/club/verification-documents"
import { DATES } from "@/data/catalog"
import { CLUB } from "@/data/club-copy"
import { LIVE } from "@/data/live-copy"
import { useClubProfile } from "@/features/club/hooks"
import { isLive } from "@/lib/data-source"
import type { ClubProfileView } from "@/features/club/view-models"
import { routes } from "@/routes"

/* Academy profile (host/profile.html) */
export function ClubProfileClient() {
  const query = useClubProfile()
  const t = CLUB.profile
  const canEdit = query.data?.demo?.edit ?? false
  // api mode: Edit opens the organization + academy forms
  const live = isLive("clubPortal")

  return (
    <>
      <PageHeading
        title={t.title}
        subtitle={t.subtitle}
        actions={
          live ? (
            <ButtonLink
              href={routes.club.editProfile}
              variant="secondary"
              size="sm"
            >
              <Icon name="edit" size={16} />
              <span className="le-600:hidden">{LIVE.profileForm.edit}</span>
            </ButtonLink>
          ) : canEdit ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => notify(t.editToast)}
            >
              <Icon name="edit" size={16} />
              <span className="le-600:hidden">{t.edit}</span>
            </Button>
          ) : null
        }
      />
      <QueryState
        query={query}
        errorFallback={LIVE.requestFailed}
        skeleton={<ProfileSkeleton />}
        isEmpty={(p) => p.academy === null}
        empty={
          <EmptyState
            icon="building"
            title={LIVE.noAcademy.title}
            text={LIVE.noAcademy.text}
            cta={
              <ButtonLink href={routes.club.editProfile} variant="primary">
                {LIVE.profileForm.createAcademy}
              </ButtonLink>
            }
          />
        }
      >
        {(p) => <Profile p={p} />}
      </QueryState>
    </>
  )
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-[clamp(20px,2.4vw,28px)]">
      <div className="h-[132px] animate-pulse rounded-lg bg-bg-2" />
      <div className="grid grid-cols-2 gap-[clamp(20px,2.4vw,28px)] le-1024:grid-cols-1">
        <div className="h-[360px] animate-pulse rounded-lg bg-bg-2" />
        <div className="h-[360px] animate-pulse rounded-lg bg-bg-2" />
      </div>
    </div>
  )
}

/* Offline verification (contract section 11): status and the admin's note only */
function LiveVerification({
  v,
}: {
  v: NonNullable<ClubProfileView["liveVerification"]>
}) {
  const t = LIVE.verification
  return (
    <div className="mt-3 grid gap-1.5 text-fs-14 text-fg-2">
      {v.status === "pending" ? <p>{t.pending}</p> : null}
      {v.status === "rejected" ? (
        <>
          {v.note ? <p className="text-fg-1">{v.note}</p> : null}
          <p>{t.rejectedReply}</p>
        </>
      ) : null}
      {v.reviewedAt ? (
        <p className="text-fs-13 text-fg-3">
          {t.decided(DATES.fmt(v.reviewedAt.slice(0, 10)))}
        </p>
      ) : null}
      {/* hidden until the backend turns document verification on */}
      <VerificationDocuments academyId={v.academyId} status={v.status} />
    </div>
  )
}

function Profile({ p }: { p: ClubProfileView }) {
  const t = CLUB.profile
  const a = p.academy
  if (!a) return null
  const specs: { label: string; value: string | null }[] = [
    { label: t.address, value: a.specs.address },
    { label: t.languages, value: a.specs.languages },
    { label: t.responseRate, value: a.specs.responseRate },
    { label: t.usuallyReplies, value: a.specs.usuallyReplies },
  ]
  const shownSpecs = specs.filter((s): s is { label: string; value: string } =>
    Boolean(s.value)
  )

  return (
    <div className="grid gap-[clamp(20px,2.4vw,28px)]">
      <section
        aria-labelledby="h-acad"
        className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5 overflow-hidden rounded-lg border border-border-1 bg-surface-elevated p-[clamp(18px,2.4vw,26px)] le-900:grid-cols-[auto_minmax(0,1fr)]"
      >
        {a.logoUrl ? (
          <span className="relative size-[72px] overflow-hidden rounded-md bg-bg-3">
            <SafeImage
              src={a.logoUrl}
              alt=""
              fill
              unoptimized
              sizes="72px"
              className="object-contain"
            />
          </span>
        ) : (
          <ClubCrest crest={a.crest} size={72} />
        )}
        <div className="grid min-w-0 gap-1">
          <p className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
            {a.locationLine}
          </p>
          <h2
            id="h-acad"
            className="font-display text-[clamp(24px,2.6vw,32px)] leading-none font-bold uppercase"
          >
            {a.name}
          </h2>
          <p className="text-fs-14 text-fg-2">
            {t.operatedBy} {p.orgName}
          </p>
        </div>
        <div className="relative w-[220px] le-900:col-span-full le-900:w-full">
          {a.verification.kind === "badge" ? (
            <VerifyBadge v={a.verification.value} />
          ) : (
            <StatusPill tone="warning">{LIVE.verificationRejected}</StatusPill>
          )}
        </div>
      </section>
      <Grid2>
        <Stack>
          <CardBlock aria-labelledby="h-about">
            <SectionHead id="h-about" title={t.about} />
            <p className="text-fs-16 leading-lh-relaxed text-fg-2">
              {a.description}
            </p>
            {shownSpecs.length > 0 ? (
              <SpecCells className="mt-[14px]" items={shownSpecs} />
            ) : null}
          </CardBlock>
          {a.facilities.length > 0 ? (
            <CardBlock aria-labelledby="h-fac">
              <SectionHead id="h-fac" title={t.facilities} />
              <CheckList items={a.facilities.map((text) => ({ text }))} />
            </CardBlock>
          ) : null}
          {p.demo?.team ? (
            <CardBlock aria-labelledby="h-team">
              <SectionHead id="h-team" title={t.team} />
              <DocList>
                {t.team_members.map((m) => (
                  <DocItem
                    key={m.initials}
                    lead={
                      <AvatarInitials
                        initials={m.initials}
                        size={34}
                        tone={m.tone}
                      />
                    }
                    title={m.name}
                    sub={m.sub}
                    trailing={
                      m.you ? (
                        <StatusPill tone="success">{t.you}</StatusPill>
                      ) : undefined
                    }
                  />
                ))}
              </DocList>
            </CardBlock>
          ) : null}
        </Stack>
        <Stack>
          <CardBlock aria-labelledby="h-ver">
            <SectionHead
              id="h-ver"
              title={t.verification}
              sub={
                p.verifiedSince === null
                  ? undefined
                  : p.demo
                    ? `Golafly Verified since ${p.verifiedSince} · checks renewed every 12 months`
                    : `Golafly Verified since ${p.verifiedSince}`
              }
            />
            {p.demo ? (
              <DocList>
                {p.demo.checks.map((c) => (
                  <DocItem
                    key={c.id}
                    icon="shieldcheck"
                    title={c.label}
                    sub={`Checked ${c.date}`}
                    trailing={
                      <StatusPill tone="success">{t.verified}</StatusPill>
                    }
                  />
                ))}
                {p.demo.affiliation ? (
                  <DocItem
                    icon="flag"
                    title={t.clubStatus}
                    sub={t.clubStatusSub}
                    trailing={
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => notify(t.affiliationToast)}
                      >
                        {t.apply}
                      </Button>
                    }
                  />
                ) : null}
              </DocList>
            ) : null}
            {p.liveVerification ? (
              <LiveVerification v={p.liveVerification} />
            ) : null}
            <p className="mt-3 text-fs-14 text-fg-3">{t.note}</p>
          </CardBlock>
          <CardBlock aria-labelledby="h-listings">
            <SectionHead
              id="h-listings"
              title={t.listings}
              action={
                <Link href={routes.club.listings} className="am-link">
                  {t.manage}
                </Link>
              }
            />
            <ul className="grid gap-0.5">
              {p.listings.map((l) => {
                const body = (
                  <>
                    <Icon name="layers" size={16} />
                    <span className="grid min-w-0">
                      <b className="text-fs-13">{l.title}</b>
                      <small className="truncate text-fs-12 text-fg-3">
                        {[LISTING_STATUS[l.status][0], l.fee]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </span>
                  </>
                )
                const row =
                  "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[10px] rounded-[8px] p-[10px]"
                return (
                  <li key={l.id}>
                    {l.editHref ? (
                      <Link
                        href={l.editHref}
                        className={`${row} hover:bg-tint-neon-1`}
                      >
                        {body}
                        <Icon name="chevr" size={16} />
                      </Link>
                    ) : (
                      <div className={row}>{body}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </CardBlock>
        </Stack>
      </Grid2>
    </div>
  )
}
