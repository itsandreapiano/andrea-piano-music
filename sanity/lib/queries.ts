
import { defineQuery } from "next-sanity";

export const NEWS_QUERY = defineQuery(`
  *[_type == "newsArticle" && defined(slug.current)]
  | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    coverImage
  }
`);


export const NEWS_ARTICLE_QUERY = defineQuery(`
  *[_type == "newsArticle" && slug.current == $slug][0] {
    _id,
    title,
    publishedAt,
    excerpt,
    coverImage,
    body,
    seoTitle,
    seoDescription
  }
`);
