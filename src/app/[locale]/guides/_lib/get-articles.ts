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

  return articles.sort((a, b) =>
    new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );
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
