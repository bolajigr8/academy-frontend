import Link from "next/link"

import { SafeImage } from "@/components/shared/safe-image"
import { Tag } from "@/components/shared/tag"
import { BLOG } from "@/data/copy"
import { blogDate, type BlogPost } from "@/features/blog/queries"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

/** One post in the grid, or (large) the featured hero */
export function BlogCard({
  post,
  large = false,
}: {
  post: BlogPost
  large?: boolean
}) {
  return (
    <article
      className={cn(
        "group relative grid min-w-0 overflow-hidden rounded-lg border border-border-1 bg-surface-elevated [transition:border-color_var(--dur-base)] hover:border-border-accent",
        large &&
          "grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] le-900:grid-cols-[minmax(0,1fr)]"
      )}
    >
      {/* a post without a picture starts with its text (no empty grey block) */}
      {post.image || large ? (
        <div
          className={cn(
            "relative overflow-hidden bg-bg-3",
            large
              ? "min-h-[320px] le-900:aspect-[16/9] le-900:min-h-0"
              : "aspect-[16/10]"
          )}
        >
          {post.image ? (
            <SafeImage
              src={post.image}
              alt=""
              fill
              sizes={
                large
                  ? "(max-width: 900px) 100vw, 60vw"
                  : "(max-width: 720px) 100vw, 33vw"
              }
              className="object-cover [transition:transform_var(--dur-slow)] group-hover:scale-[1.03]"
            />
          ) : null}
        </div>
      ) : null}
      <div
        className={cn(
          "grid content-start gap-2.5 p-5",
          large && "gap-3 p-[clamp(20px,3vw,36px)]"
        )}
      >
        <div className="flex flex-wrap items-center gap-2 text-fs-13 text-fg-3">
          {large ? (
            <Tag tone="neon" mono>
              {BLOG.featured}
            </Tag>
          ) : null}
          {post.category ? <Tag mono>{post.category}</Tag> : null}
          <span>{blogDate(post.date)}</span>
        </div>
        <h2
          className={cn(
            "font-display leading-tight font-bold text-fg-1",
            large ? "text-[clamp(24px,3vw,34px)]" : "text-fs-20"
          )}
        >
          {/* the whole card opens the post */}
          <Link
            href={routes.blogPost(post.slug)}
            className="after:absolute after:inset-0"
          >
            {post.title}
          </Link>
        </h2>
        {post.description ? (
          <p
            className={cn(
              "leading-lh-relaxed text-fg-2",
              large ? "text-fs-16" : "line-clamp-3 text-fs-14"
            )}
          >
            {post.description}
          </p>
        ) : null}
        <span className="mt-1 inline-flex items-center gap-1.5 text-fs-14 font-semibold text-amk-accent-ink">
          {BLOG.read} →
        </span>
      </div>
    </article>
  )
}
