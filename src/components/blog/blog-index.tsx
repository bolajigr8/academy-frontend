import Link from "next/link"

import { EmptyState } from "@/components/shared/empty-state"
import { BLOG } from "@/data/copy"
import type { BlogPost } from "@/features/blog/queries"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

import { BlogCard } from "./blog-card"

/*
 * The blog index (as Matchday's): the newest featured post as a hero, the
 * categories as chips (?category=…), then every other post in a grid.
 */
export function BlogIndex({
  posts,
  category,
}: {
  posts: BlogPost[]
  category: string | null
}) {
  const categories = [
    ...new Set(posts.map((p) => p.category).filter(Boolean)),
  ] as string[]
  const shown = category ? posts.filter((p) => p.category === category) : posts
  const hero = category
    ? null
    : (shown.find((p) => p.featured) ?? shown[0] ?? null)
  const rest = shown.filter((p) => p !== hero)
  const chip = (label: string, href: string, on: boolean) => (
    <Link
      key={label}
      href={href}
      aria-current={on ? "page" : undefined}
      className={cn(
        "inline-flex min-h-10 items-center rounded-pill border border-border-2 px-4 text-fs-14 font-semibold text-fg-2 hover:text-fg-1",
        on && "border-fg-1 bg-fg-1 text-bg-0 hover:text-bg-0"
      )}
    >
      {label}
    </Link>
  )
  return (
    <div className="mx-auto grid w-full max-w-[1200px] gap-[clamp(20px,3vw,32px)] px-[clamp(16px,3vw,32px)] py-[clamp(28px,5vw,64px)]">
      <header className="grid max-w-[720px] gap-3">
        <h1 className="font-display text-[clamp(32px,5vw,56px)] leading-[1.02] font-bold tracking-[-0.03em] uppercase">
          {BLOG.title}
        </h1>
        <p className="text-fs-18 leading-lh-relaxed text-fg-2">{BLOG.lead}</p>
      </header>
      {categories.length > 1 ? (
        <nav aria-label="Categories" className="flex flex-wrap gap-2">
          {chip(BLOG.all, routes.blog, !category)}
          {categories.map((c) =>
            chip(
              c,
              `${routes.blog}?category=${encodeURIComponent(c)}`,
              c === category
            )
          )}
        </nav>
      ) : null}
      {shown.length === 0 ? (
        <EmptyState
          icon="doc"
          title={BLOG.title}
          text={category ? BLOG.emptyCategory : BLOG.empty}
        />
      ) : (
        <>
          {hero ? <BlogCard post={hero} large /> : null}
          {rest.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-5">
              {rest.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
