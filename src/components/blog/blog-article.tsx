import Link from "next/link"

import { Icon } from "@/components/icons/icon"
import { SafeImage } from "@/components/shared/safe-image"
import { Tag } from "@/components/shared/tag"
import { ButtonLink } from "@/components/ui/button-link"
import { BLOG } from "@/data/copy"
import {
  blogDate,
  type BlogPost,
  type BlogPostDetail,
  type BlogSection,
} from "@/features/blog/queries"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

import { BlogCard } from "./blog-card"

const prose = "text-fs-17 leading-[1.75] text-fg-2 [overflow-wrap:anywhere]"

/** A YouTube or Vimeo link as a privacy-friendly embed; null for anything else */
function embedUrl(url: string): string | null {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/
  )
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

/** The editor's content blocks (Matchday's section types) */
function Section({ s }: { s: BlogSection }) {
  switch (s._type) {
    case "articleSection":
      return (
        <section className="grid gap-4">
          {s.heading ? (
            <h2 className="font-display text-[clamp(22px,2.6vw,28px)] leading-tight font-bold text-fg-1">
              {s.heading}
            </h2>
          ) : null}
          {(s.paragraphs ?? []).map((p, i) => (
            <p key={i} className={prose}>
              {p}
            </p>
          ))}
          {s.image ? (
            <span className="relative block aspect-[16/9] overflow-hidden rounded-lg bg-bg-3">
              <SafeImage
                src={s.image}
                alt=""
                fill
                sizes="(max-width: 760px) 100vw, 720px"
                className="object-cover"
              />
            </span>
          ) : null}
        </section>
      )
    case "quoteBlock":
      return (
        <figure className="m-0 grid gap-2 border-l-4 border-gf-neon pl-5">
          <blockquote className="font-display text-[clamp(20px,2.4vw,26px)] leading-snug font-semibold text-fg-1">
            “{s.quote}”
          </blockquote>
          {s.author ? (
            <figcaption className="text-fs-14 text-fg-3">
              {s.author}
              {s.role ? ` · ${s.role}` : ""}
            </figcaption>
          ) : null}
        </figure>
      )
    case "calloutBlock":
      return (
        <aside
          className={cn(
            "grid gap-1.5 rounded-md border p-4",
            s.calloutType === "warning"
              ? "border-gf-warning bg-[color-mix(in_srgb,var(--gf-warning)_10%,transparent)]"
              : "border-border-accent bg-tint-neon-1"
          )}
        >
          {s.title ? <b className="text-fs-15 text-fg-1">{s.title}</b> : null}
          <p className="text-fs-15 leading-lh-relaxed text-fg-2">{s.body}</p>
        </aside>
      )
    case "testimonialBlock":
      return (
        <figure className="m-0 grid gap-3 rounded-lg border border-border-1 bg-surface-elevated p-5">
          <blockquote className="text-fs-17 leading-lh-relaxed text-fg-1">
            “{s.quote}”
          </blockquote>
          <figcaption className="flex items-center gap-3 text-fs-14">
            {s.avatar ? (
              <span className="relative size-10 overflow-hidden rounded-full bg-bg-3">
                <SafeImage
                  src={s.avatar}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </span>
            ) : null}
            <span>
              <b className="text-fg-1">{s.authorName}</b>
              {s.role ? <span className="text-fg-3"> · {s.role}</span> : null}
            </span>
          </figcaption>
        </figure>
      )
    case "videoBlock": {
      const embed = s.videoUrl ? embedUrl(s.videoUrl) : null
      return (
        <figure className="m-0 grid gap-2">
          {s.videoFileUrl ? (
            <video
              controls
              preload="metadata"
              src={s.videoFileUrl}
              className="w-full rounded-lg bg-bg-3"
            />
          ) : embed ? (
            <span className="relative block aspect-video overflow-hidden rounded-lg bg-bg-3">
              <iframe
                src={embed}
                title={s.caption ?? BLOG.watch}
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="absolute inset-0 size-full border-0"
              />
            </span>
          ) : s.videoUrl ? (
            <a
              href={s.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="am-link"
            >
              {BLOG.watch}
            </a>
          ) : null}
          {s.caption ? (
            <figcaption className="text-fs-13 text-fg-3">
              {s.caption}
            </figcaption>
          ) : null}
        </figure>
      )
    }
    case "ctaBlock":
      return (
        <aside className="relative grid gap-3 overflow-hidden rounded-lg bg-gf-ink p-[clamp(20px,3vw,32px)] text-gf-white">
          {s.backgroundImage ? (
            <SafeImage
              src={s.backgroundImage}
              alt=""
              fill
              sizes="720px"
              className="object-cover opacity-30"
            />
          ) : null}
          <b className="relative font-display text-[clamp(20px,2.4vw,26px)] leading-tight">
            {s.heading}
          </b>
          {s.description ? (
            <p className="relative text-fs-15 text-gf-chalk">{s.description}</p>
          ) : null}
          <ButtonLink
            href={s.buttonLink || routes.academies()}
            className="relative justify-self-start"
          >
            {s.buttonText || BLOG.ctaFallback}
          </ButtonLink>
        </aside>
      )
    default:
      return null
  }
}

/** One article (as Matchday's blog-detail), in the academy's design */
export function BlogArticle({
  post,
  more,
}: {
  post: BlogPostDetail
  more: BlogPost[]
}) {
  return (
    <article className="mx-auto grid w-full max-w-[1200px] gap-[clamp(24px,3vw,40px)] px-[clamp(16px,3vw,32px)] py-[clamp(24px,4vw,56px)]">
      <div className="mx-auto grid w-full max-w-[760px] gap-4">
        <Link
          href={routes.blog}
          className="inline-flex items-center gap-1.5 justify-self-start text-fs-14 font-semibold text-fg-2 hover:text-fg-1"
        >
          <Icon name="arrowl" size={16} /> {BLOG.back}
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-fs-13 text-fg-3">
          {post.category ? <Tag mono>{post.category}</Tag> : null}
          <span>{blogDate(post.date)}</span>
          <span aria-hidden="true">·</span>
          <span>{post.readTime}</span>
        </div>
        <h1 className="font-display text-[clamp(30px,4.6vw,52px)] leading-[1.05] font-bold tracking-[-0.02em] text-fg-1">
          {post.title}
        </h1>
        <p className="text-fs-15 text-fg-3">{post.author}</p>
      </div>
      {post.heroImage ? (
        <figure className="m-0 mx-auto grid w-full max-w-[1000px] gap-2">
          <span className="relative block aspect-[16/8] overflow-hidden rounded-lg bg-bg-3 le-600:aspect-[4/3]">
            <SafeImage
              src={post.heroImage}
              alt=""
              fill
              priority
              sizes="(max-width: 1000px) 100vw, 1000px"
              className="object-cover"
            />
          </span>
          {post.featuredCaption ? (
            <figcaption className="text-fs-13 text-fg-3">
              {post.featuredCaption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
      <div className="mx-auto grid w-full max-w-[720px] gap-8">
        {(post.intro ?? []).length ? (
          <div className="grid gap-4">
            {(post.intro ?? []).map((p, i) => (
              <p
                key={i}
                className={cn(prose, i === 0 && "text-fs-19 text-fg-1")}
              >
                {p}
              </p>
            ))}
          </div>
        ) : null}
        {(post.sections ?? []).map((s, i) => (
          <Section key={i} s={s} />
        ))}
        {post.tags.length ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-border-1 pt-5">
            <span className="text-fs-13 font-semibold text-fg-3">
              {BLOG.tags}
            </span>
            {post.tags.map((t) => (
              <Tag key={t} mono>
                {t}
              </Tag>
            ))}
          </div>
        ) : null}
      </div>
      {more.length ? (
        <section
          aria-labelledby="h-more"
          className="grid gap-4 border-t border-border-1 pt-[clamp(24px,3vw,40px)]"
        >
          <h2 id="h-more" className="font-display text-fs-24 font-bold">
            {BLOG.more}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-5">
            {more.map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  )
}
