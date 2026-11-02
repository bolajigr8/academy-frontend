import { BLOG_SECTION, sanityQuery } from "./sanity"

/*
 * The academy blog's posts, with Matchday's GROQ projections (sanity/queries.ts
 * there), scoped to this site's section. A Sanity outage never breaks a page:
 * the index shows an empty state and an article a 404.
 */
export type BlogPost = {
  id: string
  slug: string
  title: string
  description: string | null
  date: string
  category: string | null
  tags: string[]
  image: string | null
  featured: boolean
}

export type ArticleSection = {
  _type: "articleSection"
  heading?: string
  paragraphs?: string[]
  image?: string
}
export type VideoBlock = {
  _type: "videoBlock"
  videoFileUrl?: string
  videoUrl?: string
  caption?: string
}
export type QuoteBlock = {
  _type: "quoteBlock"
  quote: string
  author?: string
  role?: string
}
export type CalloutBlock = {
  _type: "calloutBlock"
  calloutType: "info" | "warning" | "tip" | "note"
  title?: string
  body: string
}
export type TestimonialBlock = {
  _type: "testimonialBlock"
  quote: string
  authorName: string
  role?: string
  avatar?: string
}
export type CtaBlock = {
  _type: "ctaBlock"
  heading: string
  description?: string
  buttonText: string
  buttonLink?: string
  backgroundImage?: string
}
export type BlogSection =
  | ArticleSection
  | VideoBlock
  | QuoteBlock
  | CalloutBlock
  | TestimonialBlock
  | CtaBlock

export type BlogPostDetail = {
  id: string
  slug: string
  title: string
  category: string | null
  tags: string[]
  date: string
  author: string
  readTime: string
  heroImage: string | null
  featuredImage: string | null
  featuredCaption: string | null
  seoTitle: string | null
  metaDescription: string | null
  intro: string[] | null
  sections: BlogSection[] | null
}

const scope =
  BLOG_SECTION === "all" ? "" : ` && coalesce(section, "matchday") == $section`
const params = (): Record<string, string> =>
  BLOG_SECTION === "all" ? {} : { section: BLOG_SECTION }

const listFields = `
  "id": _id,
  "slug": slug.current,
  title,
  description,
  "date": coalesce(date, _createdAt),
  "category": category->title,
  "tags": coalesce(tags[]->title, []),
  "image": image.asset->url,
  "featured": coalesce(featured, false)
`

const detailFields = `
  "id": _id,
  "slug": slug.current,
  title,
  "category": category->title,
  "tags": coalesce(tags[]->title, []),
  "date": coalesce(date, _createdAt),
  "author": coalesce("By " + author, "By Golafly Team"),
  "readTime": coalesce(readTime, "5 min read"),
  "heroImage": coalesce(heroImage.asset->url, image.asset->url),
  "featuredImage": coalesce(featuredImage.asset->url, image.asset->url),
  featuredCaption,
  seoTitle,
  metaDescription,
  intro,
  "sections": sections[]{
    _type,
    _type == "articleSection" => { heading, paragraphs, "image": image.asset->url },
    _type == "videoBlock" => { "videoFileUrl": videoFile.asset->url, videoUrl, caption },
    _type == "quoteBlock" => { quote, author, role },
    _type == "calloutBlock" => { calloutType, title, body },
    _type == "testimonialBlock" => { quote, authorName, role, "avatar": avatar.asset->url },
    _type == "ctaBlock" => { heading, description, buttonText, buttonLink, "backgroundImage": backgroundImage.asset->url }
  }
`

/** Every post of the section, newest first (featured ones flagged) */
export async function getPosts(): Promise<BlogPost[]> {
  try {
    const posts = await sanityQuery<BlogPost[]>(
      `*[_type == "blogPost" && defined(slug.current)${scope}] | order(coalesce(date, _createdAt) desc) { ${listFields} }`,
      params()
    )
    return Array.isArray(posts) ? posts : []
  } catch {
    return []
  }
}

/** One post of the section by its slug; null when missing (a 404) */
export async function getPost(slug: string): Promise<BlogPostDetail | null> {
  try {
    return await sanityQuery<BlogPostDetail | null>(
      `*[_type == "blogPost" && slug.current == $slug${scope}][0] { ${detailFields} }`,
      { slug, ...params() }
    )
  } catch {
    return null
  }
}

/** A few more posts of the section, for "Keep reading" */
export async function getMorePosts(exceptSlug: string): Promise<BlogPost[]> {
  const all = await getPosts()
  return all.filter((p) => p.slug !== exceptSlug).slice(0, 3)
}

export const blogDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
