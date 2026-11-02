import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BlogArticle } from "@/components/blog/blog-article"
import { BLOG } from "@/data/copy"
import { getMorePosts, getPost } from "@/features/blog/queries"

export const revalidate = 60

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: BLOG.notFoundTitle }
  const description =
    post.metaDescription || post.intro?.[0]?.slice(0, 160) || undefined
  return {
    // the editor's SEO title when set (Sanity), else the post title
    title: post.seoTitle || post.title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.seoTitle || post.title,
      description,
      images: post.heroImage ? [post.heroImage] : undefined,
    },
  }
}

export default async function BlogPostPage({
  params,
}: PageProps<"/blog/[slug]">) {
  const { slug } = await params
  const [post, more] = await Promise.all([getPost(slug), getMorePosts(slug)])
  if (!post) notFound()
  return <BlogArticle post={post} more={more} />
}
