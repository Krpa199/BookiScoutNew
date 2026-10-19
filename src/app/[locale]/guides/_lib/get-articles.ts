import fs from 'fs';
import path from 'path';

export interface ArticlePreview {
  title: string;
  metaDescription: string;
  destination: string;
  destinationName: string;
  theme: string;
  slug: string;
  generatedAt: string;
  imageUrl?: string;
  readingTime: number;
}

export const ARTICLES_PER_PAGE = 60;

function calculateReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, '').replace(/[#*_\[\]()]/g, '');
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.ceil(wordCount / 200));
}

export function getAllArticles(locale: string): ArticlePreview[] {
  const articles: ArticlePreview[] = [];
  const articlesDir = path.join(process.cwd(), 'src', 'content', 'articles', locale);

  try {
    if (fs.existsSync(articlesDir)) {
      const files = fs.readdirSync(articlesDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
          const data = JSON.parse(content);
          articles.push({
            title: data.title,
            metaDescription: data.metaDescription,
            destination: data.destination,
            destinationName: data.destinationName,
            theme: data.theme,
            slug: file.replace('.json', ''),
            generatedAt: data.generatedAt,
            imageUrl: data.imageUrl,
            readingTime: calculateReadingTime(data.content || ''),
          });
        }
      }
    }
  } catch (error) {
    console.error('Error reading articles:', error);
  }

  const guidesDir = path.join(process.cwd(), 'src', 'content', 'guides', locale);
  try {
    if (fs.existsSync(guidesDir)) {
      const files = fs.readdirSync(guidesDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = fs.readFileSync(path.join(guidesDir, file), 'utf-8');
          const data = JSON.parse(content);
          if (!articles.find(a => a.slug === file.replace('.json', ''))) {
            articles.push({
              title: data.title || data.h1,
              metaDescription: data.metaDescription || data.summary,
              destination: data.destination || data.topicMeta?.destination || '',
              destinationName: data.destinationName || data.topicMeta?.destination || '',
              theme: data.theme || data.topicMeta?.theme || '',
              slug: file.replace('.json', ''),
              generatedAt: data.generatedAt || new Date().toISOString(),
              readingTime: calculateReadingTime(data.content || ''),
            });
          }
        }
      }
    }
  } catch {
    // Guides directory doesn't exist yet
  }

  const sorted = articles.sort((a, b) =>
    new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );
  return spreadRepeatedImages(sorted);
}

/**
 * Some guides about the same place share a cover photo; on a grid sorted by
 * date they can land side by side, which looks mass-produced. Keep the date
 * order, but when a card's image is already among the previous few cards
 * (about two rows), pull forward the next card with a different image.
 */
export function spreadRepeatedImages<T extends { imageUrl?: string }>(items: T[], window = 6, lookahead = 30): T[] {
  const out = [...items];
  for (let i = 1; i < out.length; i++) {
    const recent = new Set(out.slice(Math.max(0, i - window), i).map(x => x.imageUrl).filter(Boolean));
    if (!out[i].imageUrl || !recent.has(out[i].imageUrl)) continue;
    for (let j = i + 1; j < Math.min(out.length, i + lookahead); j++) {
      if (!out[j].imageUrl || !recent.has(out[j].imageUrl)) {
        const [moved] = out.splice(j, 1);
        out.splice(i, 0, moved);
        break;
      }
    }
  }
  return out;
}

export function getTotalPages(articleCount: number): number {
  return Math.max(1, Math.ceil(articleCount / ARTICLES_PER_PAGE));
}

export function paginateArticles(
  articles: ArticlePreview[],
  pageNum: number
): ArticlePreview[] {
  const start = (pageNum - 1) * ARTICLES_PER_PAGE;
  return articles.slice(start, start + ARTICLES_PER_PAGE);
}
