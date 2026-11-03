import articlesData from "../../../content/blog/articles.json";
import type { BlogArticle } from "../../../content/blog/schema";

export const ALL_BLOG_ARTICLES: BlogArticle[] = articlesData as BlogArticle[];

export function getAllPublishedArticles(): BlogArticle[] {
  return ALL_BLOG_ARTICLES.filter(a => a.isPublished);
}

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return ALL_BLOG_ARTICLES.find(a => a.slug === slug && a.isPublished);
}

export function getRelatedArticles(currentSlug: string, count = 3): BlogArticle[] {
  const current = getArticleBySlug(currentSlug);
  if (!current) return [];

  // Match by explicit related slugs first
  const explicit = ALL_BLOG_ARTICLES.filter(
    a => a.isPublished && a.slug !== currentSlug && current.relatedSlugs?.includes(a.slug)
  );

  if (explicit.length >= count) {
    return explicit.slice(0, count);
  }

  // Fallback: match by same category
  const sameCategory = ALL_BLOG_ARTICLES.filter(
    a => a.isPublished && a.slug !== currentSlug && a.category === current.category && !explicit.some(e => e.slug === a.slug)
  );

  return [...explicit, ...sameCategory].slice(0, count);
}

