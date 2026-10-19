"use client"

import { motion } from "framer-motion"

import { Icon, type IconName } from "@/components/icons/icon"
import { CheckList } from "@/components/shared/check-list"
import { DisplayHeading } from "@/components/shared/display-heading"
import { Eyebrow } from "@/components/shared/eyebrow"
import { Pitch } from "@/components/shared/pitch"
import { Reveal } from "@/components/shared/reveal"
import { SafeImage } from "@/components/shared/safe-image"
import { Section } from "@/components/shared/section"
import { Tag } from "@/components/shared/tag"
import { VerifyBadge } from "@/components/shared/verify-badge"
import { ButtonLink } from "@/components/ui/button-link"
import { HOST_BAND, HOW, TRAVEL, VERIFY, VOICE } from "@/data/copy"
import { HOME } from "@/data/home-copy"
import type { Verification } from "@/data/types"
import { inView, press } from "@/lib/motion"

/* AmHow + .amk-how: js/amk-ui.jsx:366, css/amk.css:183-185 */
export function HowItWorks() {
  return (
    <Section alt id="how-it-works" aria-labelledby="amk-how-title">
      <Reveal className="am-container">
        <Eyebrow>{HOW.eyebrow}</Eyebrow>
        <DisplayHeading id="amk-how-title">{HOW.title}</DisplayHeading>
        <ol className="mt-[clamp(28px,4vw,48px)] grid grid-cols-[repeat(4,minmax(0,1fr))] gap-[clamp(20px,3vw,40px)] le-1024:grid-cols-[repeat(2,minmax(0,1fr))] le-720:grid-cols-[1fr]">
          {HOW.steps.map((s, i) => (
            <motion.li
              {...inView(i)}
              key={s.n}
              className="grid content-start gap-[10px] border-t-2 border-fg-1 pt-[18px]"
            >
              <>
                <span
                  aria-hidden="true"
                  className="font-display text-[clamp(56px,7vw,104px)] leading-[0.85] font-bold tracking-[-0.04em] text-transparent tabular-nums [-webkit-text-stroke:1.5px_var(--amk-accent-ink)]"
                >
                  {s.n}
                </span>
                <h3 className="font-display text-fs-18 leading-lh-snug font-bold text-fg-1">
                  {s.title}
                </h3>
                <p className="text-fs-14 leading-lh-relaxed text-fg-2">
                  {s.text}
                </p>
              </>
            </motion.li>
          ))}
        </ol>
      </Reveal>
    </Section>
  )
}

/* AmVerifyBand + .amk-verifyband*: js/amk-ui.jsx:387, css/amk.css:188-195 */
export function VerifyBand() {
  return (
    <Section id="verification" aria-labelledby="amk-verify-title">
      <Reveal className="am-container grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start gap-[clamp(28px,5vw,72px)] le-1024:grid-cols-[1fr]">
        <div className="grid gap-4">
          <Eyebrow className="mb-0">{VERIFY.eyebrow}</Eyebrow>
          <DisplayHeading id="amk-verify-title">{VERIFY.title}</DisplayHeading>
          <p className="max-w-[58ch] text-fs-18 leading-lh-relaxed text-fg-2">
            {VERIFY.lead}
          </p>
          <p className="flex items-start gap-[10px] rounded-sm bg-bg-3 px-4 py-[14px] text-fs-14 text-fg-2">
            <Icon
              name="info"
              size={16}
              className="mt-0.5 flex-none text-fg-1"
            />
            {VERIFY.disclaimer}
          </p>
        </div>
        <ul className="grid gap-[14px]">
          {VERIFY.badges.map((b, i) => (
            <motion.li
              {...inView(i)}
              key={b.key}
              className="grid gap-[14px] rounded-lg border border-border-1 bg-surface-elevated p-[clamp(18px,2.4vw,28px)]"
            >
              <>
                <VerifyBadge v={b.key as Verification} />
                <CheckList items={b.points.map((text) => ({ text }))} />
              </>
            </motion.li>
          ))}
        </ul>
      </Reveal>
    </Section>
  )
}

/* AmHostBand + .amk-hostband*: js/amk-ui.jsx:413, css/amk.css:198-212 */
export function HostBand() {
  const H = HOST_BAND
  return (
    <Section id="for-academies" aria-labelledby="amk-host-title">
      <div className="am-container">
        <Reveal className="relative grid grid-cols-[minmax(0,6fr)_minmax(0,5fr)] items-center gap-[clamp(24px,4vw,56px)] overflow-hidden rounded-xl border border-border-2 bg-bg-3 p-[clamp(28px,5vw,64px)] le-1024:grid-cols-[1fr]">
          <div
            aria-hidden="true"
            className="absolute inset-0 am-stripes opacity-55"
          />
          <Pitch
            variant="box"
            className="top-0 right-0 left-0 h-[45%] w-full text-border-1"
          />
          <div className="relative grid gap-[18px]">
            <Eyebrow className="mb-0">{H.eyebrow}</Eyebrow>
            <DisplayHeading id="amk-host-title">{H.title}</DisplayHeading>
            <p className="max-w-[58ch] text-fs-18 leading-lh-relaxed text-fg-2">
              {H.lead}
            </p>
            <ul className="grid gap-[10px]">
              {H.bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-[10px] text-fs-14 text-fg-2"
                >
                  <Icon
                    name="check"
                    size={18}
                    sw={2.2}
                    className="mt-0.5 flex-none text-amk-accent-ink"
                  />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-1.5 flex flex-wrap gap-3">
              <ButtonLink href={H.ctaHref} variant="primary" size="lg">
                {H.cta}
              </ButtonLink>
              <ButtonLink href={H.secondaryHref} variant="secondary" size="lg">
                {H.secondary}
              </ButtonLink>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="relative aspect-[4/3.4] overflow-hidden rounded-lg border border-border-2 bg-bg-4"
          >
            <SafeImage
              src={H.image}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 480px"
              className="object-cover [filter:var(--filter-media)]"
            />
            <div className="absolute right-[14px] bottom-[14px] left-[14px] grid grid-cols-[1fr_1fr] gap-[10px]">
              {HOME.hostKpis.map((k) => (
                <div
                  key={k.label}
                  className="grid gap-0.5 rounded-sm border border-glass-border bg-glass-bg-strong px-[14px] py-3 am-glass"
                >
                  <span className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
                    {k.label}
                  </span>
                  <b className="font-display text-fs-24">{k.value}</b>
                  <small className="text-fs-12 text-fg-3">{k.sub}</small>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

/* AmTravelBand + .amk-travel*: js/amk-ui.jsx:446, css/amk.css:215-226. Always dark. */
export function TravelBand() {
  const T = TRAVEL
  return (
    <section
      aria-labelledby="amk-travel-title"
      className="relative overflow-hidden bg-gf-black py-[clamp(56px,7vw,96px)]"
    >
      <SafeImage
        src={T.image}
        alt=""
        fill
        sizes="100vw"
        className="object-cover [filter:var(--filter-media-strong)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,var(--overlay-deep)_0%,var(--overlay-mid)_60%,var(--overlay-soft)_100%)]"
      />
      <Reveal className="relative am-container grid justify-items-start gap-[22px]">
        <div>
          <DisplayHeading
            className="max-w-[18ch] text-gf-white"
            id="amk-travel-title"
          >
            {T.titleA}{" "}
            <span className="text-gf-neon [text-shadow:var(--glow-neon-text)]">
              {T.titleBrand}
            </span>
          </DisplayHeading>
          <p className="mt-[10px] text-gf-chalk">{T.lead}</p>
        </div>
        <ul className="flex flex-wrap gap-[10px]">
          {T.items.map((i) => (
            <li key={i.label}>
              <motion.a
                {...press}
                href={i.href}
                className="inline-flex items-center gap-2 rounded-pill border border-gf-ash px-[14px] py-[9px] text-fs-14 font-semibold text-gf-white [transition:border-color_var(--dur-base)] hover:border-gf-neon"
              >
                <Icon
                  name={i.icon as IconName}
                  size={18}
                  className="text-gf-neon"
                />
                {i.label}
              </motion.a>
            </li>
          ))}
        </ul>
        <ButtonLink external href={T.href} variant="white">
          {T.cta} <Icon name="external" size={16} />
        </ButtonLink>
      </Reveal>
    </section>
  )
}

/* AmVoice + .amk-voice*: js/amk-ui.jsx:466, css/amk.css:229-240 */
export function Voice() {
  const V = VOICE
  return (
    <Section aria-labelledby="amk-voice-title">
      <Reveal className="am-container grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-center gap-[clamp(28px,5vw,72px)] le-1024:grid-cols-[1fr]">
        <figure className="m-0 grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-center gap-[clamp(20px,3vw,40px)] le-720:grid-cols-[1fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[18px_18px_18px_60px] border border-border-1 bg-bg-3 le-720:aspect-[16/10]">
            <SafeImage
              src={V.image}
              alt={V.imageAlt}
              fill
              sizes="(max-width: 720px) 100vw, 300px"
              className="object-cover [filter:var(--filter-media)]"
            />
          </div>
          <div>
            <Tag mono>
              <Icon name="shieldcheck" size={13} sw={2} />
              {V.tag}
            </Tag>
            <blockquote className="my-4">
              <p className="font-display text-[clamp(20px,2vw,26px)] leading-[1.35] font-medium tracking-[-0.01em] text-fg-1">
                “{V.quote}”
              </p>
            </blockquote>
            <figcaption className="grid gap-0.5">
              <b>{V.name}</b>
              <span className="text-fs-13 text-fg-3">{V.role}</span>
            </figcaption>
          </div>
        </figure>
        <div className="grid gap-[14px] rounded-lg border border-border-2 bg-surface-elevated p-[clamp(24px,3vw,36px)]">
          <h2
            id="amk-voice-title"
            className="font-display text-fs-24 leading-lh-snug font-bold tracking-[-0.01em] text-fg-1"
          >
            {V.nextTitle}
          </h2>
          <p className="text-fg-2">{V.nextSub}</p>
          <div className="flex flex-wrap gap-[10px]">
            <ButtonLink href={V.primary.href} variant="primary">
              {V.primary.label} <Icon name="arrow" size={16} />
            </ButtonLink>
            <ButtonLink href={V.secondary.href} variant="secondary">
              {V.secondary.label}
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
