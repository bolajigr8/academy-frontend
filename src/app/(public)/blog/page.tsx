import type { Metadata } from "next"

import { BlogIndex } from "@/components/blog/blog-index"
import { BLOG } from "@/data/copy"
import { getPosts } from "@/features/blog/queries"

/* the posts are refreshed from Sanity every 60 seconds (as Matchday) */
export const revalidate = 60

export const metadata: Metadata = {
  title: BLOG.metaTitle,
  description: BLOG.metaDescription,
  alternates: { canonical: "/blog" },
}

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const q = await searchParams
  const category =
    typeof q.category === "string" && q.category ? q.category : null
  const posts = await getPosts()
  return <BlogIndex posts={posts} category={category} />
}
