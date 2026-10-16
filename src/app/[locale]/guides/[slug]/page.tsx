import { Metadata } from 'next';
import { ADVENT_DESTINATIONS, isAdventSeason } from '@/lib/seasonal';
import { localizedUrl, localeAlternates } from '@/lib/urls';
import { DESTINATIONS } from '@/config/destinations';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { locales, localeFlags, type Locale } from '@/i18n/config';

import ArticleSchema from '@/components/article/ArticleSchema';

import ScrollReveal from '@/components/ui/ScrollReveal';
import ReadingProgress from '@/components/ui/ReadingProgress';
import AnimatedFaq from '@/components/ui/AnimatedFaq';
import { MapPin, Clock, Calendar, ChevronRight, CheckCircle, Sparkles, Shield, Star, HelpCircle, ArrowRight, Info } from 'lucide-react';
import Image from 'next/image';

// ISR strategy (since 2026-05-31): pre-render only top-traffic articles at build time
// (~500 pages instead of 25,000). Long-tail pages render on first request, then cache
// forever via `revalidate = false`. Build time drops from 2.5h → ~10 min.
// To revalidate after content changes, POST to /api/revalidate.
export const revalidate = false; // once rendered, cache forever until revalidatePath()
export const dynamicParams = true; // render unknown slugs on-demand (ISR), don't 404

// Article type matching the generated JSON structure
// Standard table data (for recommendations)
interface StandardTableRow {
  name: string;
  price: string;
  rating: string;
  distance: string;
}

// Comparison table data (for "vs" articles)
interface ComparisonTableRow {
  name: string;
  [key: string]: string; // e.g., dubrovnik, zadar, winner
}

interface GeneratedArticle {
  title: string;
  metaDescription: string;
  slug: string;
  content: string;
  faq: { question: string; answer: string }[];
  quickAnswer: string;
  tableData?: StandardTableRow[] | ComparisonTableRow[];
  destination: string;
  destinationName: string;
  region: string;
  theme: string;
  language: string;
  generatedAt: string;
  updatedAt?: string;
  lat: number;
  lng: number;
  // Pexels image fields
  imageUrl?: string;
  imageAlt?: string;
  imageCredit?: string;
  imageCreditUrl?: string;
  imageSource?: string;
}

type Props = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

// Load article from JSON file
function getArticle(lang: string, slug: string): GeneratedArticle | null {
  const filePath = path.join(process.cwd(), 'src', 'content', 'articles', lang, `${slug}.json`);

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error loading article: ${filePath}`, error);
  }

  return null;
}

// Themes that naturally connect — pick clusters that answer "the next question users have".
// When user reads X, they often want to know Y next. Keyed by the current article's theme.
const THEME_AFFINITY: Record<string, string[]> = {
  // Transport-related
  'parking': ['parking-difficulty', 'car-vs-no-car', 'walkability', 'public-transport-quality'],
  'parking-difficulty': ['parking', 'car-vs-no-car', 'walkability', 'transport'],
  'car-vs-no-car': ['parking', 'public-transport-quality', 'walkability', 'transport'],
  'transport': ['car-vs-no-car', 'public-transport-quality', 'airport-access', 'ferry-connections'],
  'public-transport-quality': ['car-vs-no-car', 'walkability', 'transport', 'parking'],
  'walkability': ['car-vs-no-car', 'public-transport-quality', 'things-to-do'],
  'airport-access': ['transport', 'car-vs-no-car', 'first-time-visitors'],
  'ferry-connections': ['island-hopping', 'day-trips', 'transport'],

  // Accommodation / where to stay
  'apartments': ['where-to-stay', 'family', 'couples', 'budget'],
  'where-to-stay': ['apartments', 'family', 'budget', 'luxury'],

  // Traveler types — connect to relevant practical topics
  'family': ['families-with-toddlers', 'families-with-teens', 'beach', 'stroller-friendly'],
  'families-with-toddlers': ['family', 'stroller-friendly', 'beach', 'safety'],
  'families-with-teens': ['family', 'things-to-do', 'nightlife', 'day-trips'],
  'couples': ['nightlife', 'restaurants', 'food-and-wine', 'luxury'],
  'solo-travel': ['safety', 'walkability', 'nightlife', 'budget'],
  'seniors': ['walkability', 'wheelchair-access', 'public-transport-quality', 'safety'],
  'digital-nomads': ['wifi-quality', 'mobile-coverage', 'walkability', 'cost-guide'],
  'lgbt-friendly': ['nightlife', 'safety', 'things-to-do'],
  'first-time-visitors': ['things-to-do', 'best-time-to-visit', 'safety', 'transport'],

  // Activities & sights
  'beach': ['things-to-do', 'family', 'snorkeling-and-diving', 'best-time-to-visit'],
  'things-to-do': ['hidden-gems', 'photo-spots', 'day-trips', 'history-and-culture'],
  'day-trips': ['things-to-do', 'island-hopping', 'hidden-gems'],
  'hidden-gems': ['things-to-do', 'photo-spots', 'local-food'],
  'photo-spots': ['hidden-gems', 'things-to-do', 'history-and-culture'],
  'nightlife': ['restaurants', 'couples', 'food-and-wine'],
  'restaurants': ['local-food', 'food-and-wine', 'nightlife'],
  'local-food': ['restaurants', 'food-and-wine', 'history-and-culture'],
  'food-and-wine': ['restaurants', 'local-food', 'couples'],
  'island-hopping': ['ferry-connections', 'day-trips', 'sailing'],
  'sailing': ['island-hopping', 'ferry-connections'],
  'hiking': ['things-to-do', 'hidden-gems', 'photo-spots'],
  'snorkeling-and-diving': ['beach', 'things-to-do', 'day-trips'],
  'history-and-culture': ['things-to-do', 'photo-spots', 'first-time-visitors'],

  // Timing / weather
  'best-time-to-visit': ['weather-by-month', 'crowds-by-month', 'peak-season', 'shoulder-season'],
  'weather': ['weather-by-month', 'best-time-to-visit', 'peak-season'],
  'weather-by-month': ['best-time-to-visit', 'crowds-by-month', 'peak-season'],
  'crowds-by-month': ['peak-season', 'shoulder-season', 'off-season', 'best-time-to-visit'],
  'peak-season': ['crowds-by-month', 'best-time-to-visit', 'shoulder-season'],
  'shoulder-season': ['off-season', 'peak-season', 'best-time-to-visit'],
  'off-season': ['shoulder-season', 'weather-by-month', 'best-time-to-visit'],

  // Budget / cost
  'budget': ['cost-guide', 'prices', 'where-to-stay'],
  'cost-guide': ['budget', 'prices', 'where-to-stay'],
  'prices': ['budget', 'cost-guide', 'where-to-stay'],
  'luxury': ['where-to-stay', 'couples', 'restaurants'],

  // Comparisons
  'vs-dubrovnik': ['vs-split', 'vs-zadar', 'best-time-to-visit'],
  'vs-split': ['vs-dubrovnik', 'vs-zadar', 'best-time-to-visit'],
  'vs-zadar': ['vs-dubrovnik', 'vs-split', 'best-time-to-visit'],
  'vs-zagreb': ['vs-split', 'vs-dubrovnik'],
  'vs-istria': ['coast-vs-inland', 'vs-split'],
  'coast-vs-inland': ['vs-istria', 'best-time-to-visit'],

  // Practical
  'safety': ['solo-travel', 'first-time-visitors'],
  'visa-and-entry': ['first-time-visitors', 'safety'],
  'wifi-quality': ['mobile-coverage', 'digital-nomads'],
  'mobile-coverage': ['wifi-quality', 'digital-nomads'],
  'stroller-friendly': ['families-with-toddlers', 'walkability', 'family'],
  'wheelchair-access': ['walkability', 'seniors', 'public-transport-quality'],
  'pet-friendly': ['walkability', 'beach'],
  'pool': ['apartments', 'family', 'luxury'],
  'camping-and-glamping': ['budget', 'things-to-do'],
  'road-trip': ['car-vs-no-car', 'day-trips', 'things-to-do'],
  'sustainable-travel': ['hidden-gems', 'off-season'],
  'itinerary': ['things-to-do', 'first-time-visitors', 'day-trips'],
};

// Load all articles for a language into memory once
function loadAllArticles(lang: string): GeneratedArticle[] {
  const articlesDir = path.join(process.cwd(), 'src', 'content', 'articles', lang);
  if (!fs.existsSync(articlesDir)) return [];
  const articles: GeneratedArticle[] = [];
  try {
    const files = fs.readdirSync(articlesDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
        articles.push(JSON.parse(content) as GeneratedArticle);
      }
    }
  } catch {
    // Ignore errors
  }
  return articles;
}

// Score articles for relevance to the current page.
// Higher score = better match. Used for both inline and bottom-of-page widgets.
function scoreArticle(
  candidate: GeneratedArticle,
  currentDestination: string,
  currentTheme: string
): number {
  let score = 0;
  const isSameDestination = candidate.destination === currentDestination;
  const isAffinityTheme = THEME_AFFINITY[currentTheme]?.includes(candidate.theme) ?? false;
  const isSameTheme = candidate.theme === currentTheme;

  // Strongest signal: same destination AND a theme the user is likely to want next.
  if (isSameDestination && isAffinityTheme) score += 100;
  // Same destination, related but not affinity-mapped
  else if (isSameDestination) score += 50;
  // Different destination but same affinity theme — useful for cross-destination comparisons
  else if (isAffinityTheme) score += 30;
  // Same theme on a different destination — last-resort fallback
  else if (isSameTheme) score += 10;

  return score;
}

// Get related articles (smart: contextual theme affinity + same destination priority)
function getRelatedArticles(
  lang: string,
  currentSlug: string,
  destination: string,
  theme: string,
  limit: number = 3
): GeneratedArticle[] {
  const all = loadAllArticles(lang);
  const scored = all
    .filter(a => a.slug !== currentSlug)
    .map(a => ({ article: a, score: scoreArticle(a, destination, theme) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Same score → prefer newer
      return new Date(b.article.generatedAt).getTime() - new Date(a.article.generatedAt).getTime();
    });

  return scored.slice(0, limit).map(s => s.article);
}

// Get inline "you might also want to know" suggestions: PRIORITIZE same-destination
// articles whose theme answers a question naturally adjacent to the current one.
// We exclude any slugs already in the bottom related list to avoid duplication.
function getInlineNextReads(
  lang: string,
  currentSlug: string,
  destination: string,
  theme: string,
  excludeSlugs: Set<string>,
  limit: number = 2
): GeneratedArticle[] {
  const affinityThemes = THEME_AFFINITY[theme] || [];
  if (affinityThemes.length === 0) return [];

  const all = loadAllArticles(lang);
  // Strong filter: same destination AND theme is in affinity list
  const candidates = all
    .filter(a => a.slug !== currentSlug && !excludeSlugs.has(a.slug))
    .filter(a => a.destination === destination && affinityThemes.includes(a.theme))
    // Order by the affinity ranking (earlier in the affinity list = more relevant)
    .sort((a, b) => {
      const aRank = affinityThemes.indexOf(a.theme);
      const bRank = affinityThemes.indexOf(b.theme);
      return aRank - bRank;
    });

  return candidates.slice(0, limit);
}

// Generate static params for all articles
// Top-traffic destinations and themes (from Vercel Analytics May 2026).
// Cross-product = ~156 article slugs; pages outside this set render on-demand.
const TOP_DESTINATIONS = [
  'zadar', 'split', 'zagreb', 'dubrovnik', 'krka',
  'rijeka', 'makarska', 'pula', 'trogir', 'cavtat',
  'rovinj', 'sibenik', 'opatija', 'hvar', 'brac',
];

const TOP_THEMES = [
  'parking-difficulty', 'parking', 'nightlife', 'prices',
  'public-transport-quality', 'vs-dubrovnik', 'restaurants',
  'families-with-toddlers', 'airport-access', 'vs-zadar',
  'vs-split', 'crowds-by-month', 'weather-by-month',
  'ferry-connections', 'family', 'transport',
];

export async function generateStaticParams() {
  // Build only the slugs likely to drive most traffic — long tail uses ISR on-demand.
  // To force-prerender additional pages (e.g. after publishing campaign), add the slug
  // here OR call /api/revalidate to warm the cache.
  const articlesDir = path.join(process.cwd(), 'src', 'content', 'articles', 'en');
  const candidates = new Set<string>();

  for (const destination of TOP_DESTINATIONS) {
    for (const theme of TOP_THEMES) {
      candidates.add(`${destination}-${theme}`);
    }
  }

  // Keep only slugs that actually have an English article on disk
  // (Next.js will 500 on prerender if the JSON is missing).
  const params: { slug: string }[] = [];
  for (const slug of candidates) {
    if (fs.existsSync(path.join(articlesDir, `${slug}.json`))) {
      params.push({ slug });
    }
  }

  return params;
}

// Generate metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getArticle(locale, slug);

  if (!article) {
    return {
      title: 'Guide Not Found',
    };
  }

  const url = localizedUrl(locale, `/guides/${slug}`);
  // hreflang only for languages this guide actually exists in (others would 404)
  const available = locales.filter(loc =>
    fs.existsSync(path.join(process.cwd(), 'src', 'content', 'articles', loc, `${slug}.json`))
  );

  return {
    title: article.title,
    description: article.metaDescription,
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      url,
      type: 'article',
      siteName: 'BookiScout',
      images: article.imageUrl ? [{ url: article.imageUrl, alt: article.imageAlt || article.title }] : undefined,
      locale,
    },
    alternates: localeAlternates(locale, `/guides/${slug}`, available),
  };
}

// Parse a markdown table row into cells
function parseTableRow(line: string): string[] {
  return line.split('|').slice(1, -1).map(cell => cell.trim());
}

// Check if a line is a markdown table separator (|---|---|)
function isTableSeparator(line: string): boolean {
  return /^\|[\s:]*-{2,}[\s:]*\|/.test(line.trim());
}

// Render a markdown table block as responsive HTML (cards on mobile, table on desktop)
function renderMarkdownTable(tableLines: string[]): string {
  if (tableLines.length < 2) return tableLines.join('\n');

  const headerLine = tableLines[0];
  const headers = parseTableRow(headerLine);

  // Find separator line and data rows after it
  let dataStartIndex = 1;
  if (tableLines.length > 1 && isTableSeparator(tableLines[1])) {
    dataStartIndex = 2;
  }

  const rows = tableLines.slice(dataStartIndex).map(line => parseTableRow(line));
  if (rows.length === 0) return tableLines.join('\n');

  // Apply bold/italic inline formatting to cell content
  const formatCell = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  };

  // Mobile: card layout with glass morphism
  let mobileHtml = '<div class="md:hidden space-y-3 my-6">';
  for (const row of rows) {
    const title = formatCell(row[0] || '');
    mobileHtml += `<div class="glass-card table-card-mobile p-4 rounded-xl border border-ocean-100/50 shadow-soft">`;
    mobileHtml += `<div class="font-bold text-slate-900 text-base mb-3 pb-2 border-b border-ocean-100/50 flex items-center gap-2">`;
    mobileHtml += `<span class="w-2 h-2 bg-gradient-to-br from-ocean-400 to-seafoam-400 rounded-full flex-shrink-0"></span>`;
    mobileHtml += `${title}</div>`;
    mobileHtml += `<div class="space-y-2.5 text-sm">`;
    for (let j = 1; j < headers.length; j++) {
      const headerText = formatCell(headers[j]);
      const cellText = formatCell(row[j] || '');
      mobileHtml += `<div class="flex items-start justify-between gap-2">`;
      mobileHtml += `<span class="text-slate-500 text-xs uppercase tracking-wide font-medium bg-slate-50 px-2 py-0.5 rounded flex-shrink-0">${headerText}</span>`;
      mobileHtml += `<span class="text-slate-800 text-right leading-relaxed">${cellText}</span></div>`;
    }
    mobileHtml += `</div></div>`;
  }
  mobileHtml += '</div>';

  // Desktop: table layout
  let desktopHtml = '<div class="hidden md:block my-6 overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm">';
  desktopHtml += '<table class="w-full text-left text-sm">';
  desktopHtml += '<thead><tr class="bg-gradient-to-r from-ocean-50 to-slate-50">';
  for (const h of headers) {
    desktopHtml += `<th class="py-3.5 px-5 font-bold text-slate-900 text-xs uppercase tracking-wide border-b-2 border-ocean-100">${formatCell(h)}</th>`;
  }
  desktopHtml += '</tr></thead><tbody>';
  for (let i = 0; i < rows.length; i++) {
    const stripe = i % 2 === 1 ? ' bg-slate-50/50' : '';
    desktopHtml += `<tr class="border-b border-slate-100 hover:bg-ocean-50/30 transition-colors${stripe}">`;
    for (let j = 0; j < headers.length; j++) {
      const cls = j === 0 ? 'font-semibold text-slate-900' : 'text-slate-700';
      desktopHtml += `<td class="py-3.5 px-5 ${cls} leading-relaxed">${formatCell(rows[i][j] || '')}</td>`;
    }
    desktopHtml += '</tr>';
  }
  desktopHtml += '</tbody></table></div>';

  return mobileHtml + desktopHtml;
}

// Languages whose headings should be sentence case. The translator copied
// English Title Case ("Vaš Ultimativni Vodič za Parkiranje") — wrong outside
// English and German (where nouns are capitalised anyway).
const SENTENCE_CASE_LOCALES = new Set(['hr', 'sl', 'cz', 'sk', 'pl', 'hu', 'it', 'fr', 'es', 'nl', 'ru']);

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9Ѐ-ӿ]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'section';
}

/**
 * Title Case → sentence case. Conservative: a word is lowercased ONLY if the
 * same word also appears in lowercase in the article body — positive proof it
 * is an ordinary word. Names (München, Zadar, Poluotok…) never appear in
 * lowercase, so they are always kept.
 */
// Word stem used to match inflected forms (München / Münchena, garaža / garaže)
const stemOf = (w: string) => w.toLowerCase().slice(0, Math.max(4, w.length - 2));

function toSentenceCase(heading: string, counts: { lower: Map<string, number>; upper: Map<string, number> }): string {
  const parts = heading.split(' ');
  const capitalised = parts.filter(w => /^\p{Lu}/u.test(w)).length;
  if (parts.length < 3 || capitalised / parts.length < 0.6) return heading; // not Title Case
  return parts
    .map((w, i) => {
      if (i === 0 || !/^\p{Lu}\p{Ll}/u.test(w)) return w;
      const bare = w.replace(/[^\p{L}]/gu, '');
      const stem = stemOf(bare);
      const lower = counts.lower.get(stem) ?? 0;
      const upper = counts.upper.get(stem) ?? 0;
      // Lowercase only with clear evidence it is an ordinary word (the body writes
      // it lowercase more often than capitalised). No evidence → keep: a stray
      // capital is harmless, a lowercased city name ("iz münchena") is not.
      const ordinary = !isPlaceName(bare) && lower > upper;
      return ordinary ? w.charAt(0).toLowerCase() + w.slice(1) : w;
    })
    .join(' ');
}

function collectWords(content: string): { lower: Map<string, number>; upper: Map<string, number> } {
  const lower = new Map<string, number>();
  const upper = new Map<string, number>();
  const bump = (m: Map<string, number>, w: string) => m.set(stemOf(w), (m.get(stemOf(w)) ?? 0) + 1);
  for (const line of content.split('\n')) {
    if (line.startsWith('#') || line.startsWith('|')) continue;
    const plain = line.replace(/\*\*[^*]*\*\*/g, ' '); // bold labels are Title Cased too
    for (const m of plain.matchAll(/(?<![\p{L}])(\p{Ll}\p{Ll}+)/gu)) bump(lower, m[1]);
    // capitalised but NOT at the start of a sentence
    for (const m of plain.matchAll(/[^.!?:\n]\s+(\p{Lu}\p{Ll}+)/gu)) bump(upper, m[1]);
  }
  return { lower, upper };
}

// Stems of every destination name, so inflected forms (Zadru, Splitu) count as names
const PLACE_STEMS = DESTINATIONS.flatMap(d => d.name.split(/\s+/))
  .filter(w => w.length >= 4)
  .map(w => w.toLowerCase().slice(0, Math.max(3, w.length - 2)));

function isPlaceName(word: string): boolean {
  const w = word.toLowerCase();
  return PLACE_STEMS.some(stem => w.startsWith(stem));
}

// Other destinations mentioned in the text become links to their hub pages
// Names that are also ordinary words: "Stari Grad" usually means "the old town",
// not the town on Hvar.
const AMBIGUOUS_PLACES = new Set(['stari-grad']);
const LINKABLE_PLACES = DESTINATIONS
  .filter(d => d.name.length >= 4 && !AMBIGUOUS_PLACES.has(d.slug))
  .sort((a, b) => b.name.length - a.name.length);

function linkPlaces(html: string, locale: string, currentDestination: string, max = 6): string {
  const prefix = locale === 'en' ? '' : `/${locale}`;
  let added = 0;
  const done = new Set<string>();
  // Only touch text inside <p>…</p>, never inside tags, links or headings
  return html.replace(/<p>([\s\S]*?)<\/p>/g, (_m, inner: string) => {
    const parts = inner.split(/(<[^>]+>)/);
    let inLink = false;
    for (let k = 0; k < parts.length; k++) {
      const part = parts[k];
      if (part.startsWith('<')) {
        if (/^<a\b/.test(part)) inLink = true;
        if (/^<\/a>/.test(part)) inLink = false;
        continue;
      }
      if (inLink || added >= max) continue;
      for (const d of LINKABLE_PLACES) {
        if (d.slug === currentDestination || done.has(d.slug) || added >= max) continue;
        const re = new RegExp(`(?<![\\p{L}])(${d.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![\\p{L}])`, 'u');
        if (re.test(parts[k])) {
          parts[k] = parts[k].replace(re, `<a href="${prefix}/destinations/${d.slug}" class="place-link">$1</a>`);
          done.add(d.slug);
          added++;
        }
      }
    }
    return `<p>${parts.join('')}</p>`;
  });
}

export interface TocEntry { id: string; text: string; level: 2 | 3 }

// "**Cijena:** 1,60 €/sat" — a bullet that is a label/value pair
const LABEL_ITEM = /^\*\*([^*]{1,40}?):?\*\*:?\s+(.+)$/;

// Markdown → HTML for article bodies. Returns the HTML plus a table of contents.
function renderMarkdown(content: string, locale: string, destination: string, quickAnswer?: string): { html: string; toc: TocEntry[] } {
  const sentenceCase = SENTENCE_CASE_LOCALES.has(locale);
  const words = sentenceCase ? collectWords(content) : { lower: new Map<string, number>(), upper: new Map<string, number>() };
  const fixHeading = (text: string) => (sentenceCase ? toSentenceCase(text.trim(), words) : text.trim());

  // Drop a leading paragraph that just repeats the Quick Answer
  const norm = (t: string) => t.replace(/[*_#]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (quickAnswer) {
    const paras = content.split(/\n\n+/);
    const firstText = paras.findIndex(pg => pg.trim() && !pg.trim().startsWith('#'));
    if (firstText >= 0 && norm(paras[firstText]).startsWith(norm(quickAnswer).slice(0, 80))) {
      paras.splice(firstText, 1);
      content = paras.join('\n\n');
    }
  }

  const toc: TocEntry[] = [];
  const usedIds = new Set<string>();
  const headingId = (text: string) => {
    let id = slugifyHeading(text);
    while (usedIds.has(id)) id += '-2';
    usedIds.add(id);
    return id;
  };

  const lines = content.split('\n');
  const out: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push(`<p>${para.join(' ')}</p>`);
    para = [];
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      flush();
      i++;
      continue;
    }

    // Tables
    if (line.trimStart().startsWith('|') && (line.match(/\|/g) || []).length >= 3) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith('|') && (lines[i].match(/\|/g) || []).length >= 3) {
        tableLines.push(lines[i]);
        i++;
      }
      flush();
      out.push(renderMarkdownTable(tableLines));
      continue;
    }

    // Lists: consecutive "- ", "* " or "1. " lines become one block
    const bullet = /^\s*[*-]\s+(.*)$/;
    const numbered = /^\s*\d+[.)]\s+(.*)$/;
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line);
      const re = ordered ? numbered : bullet;
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i])) {
        items.push(lines[i].match(re)![1].trim());
        i++;
        if (i + 1 < lines.length && lines[i].trim() === '' && re.test(lines[i + 1])) i++;
      }
      flush();

      // Every item is "**Label:** value" → a facts card (price / limit / hours…)
      if (!ordered && items.length >= 2 && items.every(it => LABEL_ITEM.test(it))) {
        out.push(`<dl class="facts-card">${items.map(it => {
          const [, label, value] = it.match(LABEL_ITEM)!;
          return `<div><dt>${label.trim()}</dt><dd>${value}</dd></div>`;
        }).join('')}</dl>`);
        continue;
      }

      if (ordered) {
        out.push(`<ol class="steps">${items.map(it => `<li>${it}</li>`).join('')}</ol>`);
      } else {
        out.push(`<ul class="bullets">${items.map(it => `<li>${it}</li>`).join('')}</ul>`);
      }
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (!h) {
      para.push(line.trim());
      i++;
      continue;
    }
    flush();
    const text = fixHeading(h[2]);
    const level = h[1].length;
    if (level <= 2) {
      const id = headingId(text);
      toc.push({ id, text: text.replace(/\*\*/g, ''), level: 2 });
      out.push(`<h2 id="${id}"><!--k:${id}-->${text}</h2>`);
    } else if (level === 3) {
      const id = headingId(text);
      toc.push({ id, text: text.replace(/\*\*/g, ''), level: 3 });
      out.push(`<h3 id="${id}"><!--k:${id}-->${text}</h3>`);
    } else {
      out.push(`<h4>${text}</h4>`);
    }
    i++;
  }
  flush();

  let html = out.join('\n');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  html = linkPlaces(html, locale, destination);

  // When the article only uses one h2 (a title), the h3s are the real sections
  const h2s = toc.filter(t => t.level === 2).length;
  const sections = (h2s >= 3 ? toc.filter(t => t.level === 2) : toc.filter(t => t.level === 3)).slice(0, 14);
  // Numbered kicker ("01") on section headings only
  sections.forEach((entry, n) => {
    html = html.replace(`<!--k:${entry.id}-->`, `<span class="kicker">${String(n + 1).padStart(2, '0')}</span>`);
  });
  html = html.replace(/<!--k:[^>]*-->/g, '');
  return { html, toc: sections.length >= 3 ? sections : toc.slice(0, 14) };
}

// Split the Quick Answer into scannable points ("Ukratko")
function quickPoints(text: string): string[] {
  const parts = text.split(/(?<=[.!?])\s+(?=[\p{Lu}0-9])/u).map(p => p.trim()).filter(Boolean);
  return parts.length >= 2 && parts.length <= 6 ? parts : [];
}

// Theme label in the page language ("parking-difficulty" → "Parkiranje")
function themeLabel(tThemes: (key: string) => string, theme: string): string {
  const key = theme.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  try {
    const label = tThemes(key);
    if (label && label !== key && !label.includes('guides.themes')) return label;
  } catch {
    /* missing translation */
  }
  return theme.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default async function GuidePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Load article
  const article = getArticle(locale, slug);

  if (!article) {
    notFound();
  }

  const t = await getTranslations('guides.detail');

  const url = localizedUrl(locale, `/guides/${slug}`);

  // Calculate reading time from content
  const wordCount = article.content.split(/\s+/).length;
  const readingTime = Math.max(3, Math.ceil(wordCount / 200));

  // Should show booking widget?

  // Get related articles (smart contextual scoring)
  const relatedArticles = getRelatedArticles(locale, slug, article.destination, article.theme, 3);

  // Get inline "next reads" — same-destination + theme-affinity matches.
  // Excludes anything already shown in the bottom Related Guides widget.
  const inlineNextReads = getInlineNextReads(
    locale,
    slug,
    article.destination,
    article.theme,
    new Set(relatedArticles.map(a => a.slug)),
    2
  );

  // Seasonal cross-link: during Advent season every guide for an Advent town
  // points to its Advent guide (helps Google discover/rank them before late Nov).
  const adventGuide = article.theme !== 'advent'
    && isAdventSeason()
    && ADVENT_DESTINATIONS.includes(article.destination)
    ? getArticle(locale, `${article.destination}-advent`)
    : null;

  const tThemes = await getTranslations({ locale, namespace: 'guides.themes' });
  const theme = themeLabel(tThemes as unknown as (k: string) => string, article.theme);
  const { html: bodyHtml, toc } = renderMarkdown(article.content, locale, article.destination, article.quickAnswer);
  const points = quickPoints(article.quickAnswer);
  const updatedIso = article.updatedAt || article.generatedAt;
  const updated = new Date(updatedIso).toLocaleDateString(locale === 'cz' ? 'cs' : locale, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Hide meaningless rating cells ("N/A", empty) — and the whole column if no row has one
  const hasRating = (r?: string) => !!r && /\d/.test(r);
  const standardRows = (article.tableData ?? []) as StandardTableRow[];
  const isComparison = !!article.tableData?.length && 'winner' in article.tableData[0];
  const showRating = standardRows.some(r => hasRating(r.rating));

  const tocList = (mobile: boolean) => (
    <ol className={mobile ? 'px-4 pb-4 space-y-2.5 text-[15px]' : 'space-y-1 text-sm'}>
      {toc.map((entry, n) => (
        <li key={entry.id}>
          <a
            href={`#${entry.id}`}
            className={mobile
              ? 'flex gap-3 text-slate-700 hover:text-ocean-700'
              : 'group flex gap-3 rounded-lg px-2 py-1.5 text-slate-600 hover:bg-white hover:text-ocean-800 hover:shadow-sm'}
          >
            <span className="font-display text-coral-500 tabular-nums">{String(n + 1).padStart(2, '0')}</span>
            <span className="leading-snug">{entry.text}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <ArticleSchema
        title={article.title}
        description={article.metaDescription}
        url={url}
        datePublished={article.generatedAt}
        dateModified={updatedIso}
        destination={article.destinationName}
        image={article.imageUrl}
        faq={article.faq}
      />

      <ReadingProgress />

      {/* Hero: deep Adriatic block, title beside the photo on desktop */}
      <header className="relative overflow-hidden bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-700 pt-6 md:pt-8 pb-16 md:pb-24 text-white">
        {/* Late-afternoon Dalmatian sun */}
        <div className="pointer-events-none absolute -top-32 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-sand-300/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 left-[-10%] h-72 w-72 rounded-full bg-seafoam-400/15 blur-3xl" aria-hidden="true" />
        <div className="relative container max-w-7xl">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-ocean-100/60 overflow-x-auto whitespace-nowrap" itemScope itemType="https://schema.org/BreadcrumbList">
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link href="/" className="text-ocean-100/80 hover:text-white" itemProp="item"><span itemProp="name">{t('breadcrumb.home')}</span></Link>
                <meta itemProp="position" content="1" />
              </li>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link href="/guides" className="text-ocean-100/80 hover:text-white" itemProp="item"><span itemProp="name">{t('breadcrumb.guides')}</span></Link>
                <meta itemProp="position" content="2" />
              </li>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link href={`/destinations/${article.destination}`} className="text-ocean-100/80 hover:text-white" itemProp="item"><span itemProp="name">{article.destinationName}</span></Link>
                <meta itemProp="position" content="3" />
              </li>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <span className="font-medium text-sand-200" itemProp="name">{theme}</span>
                <meta itemProp="position" content="4" />
              </li>
            </ol>
          </nav>

          <div className="mt-6 md:mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-center">
            <div>
              <Link
                href={`/destinations/${article.destination}`}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sand-200 ring-1 ring-white/15 hover:bg-white/15"
              >
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                {article.destinationName} · {theme}
              </Link>
              <h1 className="mt-4 font-display text-[2.1rem] sm:text-5xl lg:text-[3.4rem] font-semibold leading-[1.05] tracking-tight text-white">
                {article.title}
              </h1>
              {/* Hidden on phones: it repeats the Quick Answer and pushed it below the fold */}
              <p className="hidden sm:block mt-5 text-lg md:text-xl text-ocean-50/80 leading-relaxed max-w-2xl">{article.metaDescription}</p>
              <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ocean-100/70">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  <time dateTime={updatedIso}>{t('ui.updated', { date: updated })}</time>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  {t('minRead', { count: readingTime })}
                </span>
              </p>
            </div>

            {article.imageUrl && (
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-white/5 shadow-2xl shadow-ocean-900/40 ring-1 ring-white/10">
                  <Image
                    src={article.imageUrl}
                    alt={article.imageAlt || article.title}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 640px"
                  />
                </div>
                {article.imageCredit && (
                  <figcaption className="mt-2 text-xs text-white/45">
                    {t('ui.photoBy')}{' '}
                    <a href={article.imageCreditUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white/80">
                      {article.imageCredit}
                    </a>
                  </figcaption>
                )}
              </figure>
            )}
          </div>
        </div>
        <svg className="absolute bottom-0 left-0 h-6 w-full text-[#e8f2f9] md:h-10" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0,32 C240,58 480,58 720,34 C960,10 1200,10 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </header>

      <div className="bg-[#e8f2f9] pt-10 pb-16 md:pt-14 md:pb-20">
        <div className="container max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,44rem)_16rem] justify-center gap-10 xl:gap-12">

            {/* Left: sticky table of contents (desktop) */}
            <aside className="hidden lg:block">
              {toc.length >= 3 && (
                <nav className="sticky top-24" aria-label={t('ui.onThisPage')}>
                  <p className="px-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">{t('ui.onThisPage')}</p>
                  {tocList(false)}
                </nav>
              )}
            </aside>

            <article className="min-w-0">
              {/* Quick answer card */}
              <section className="relative overflow-hidden rounded-2xl bg-white p-5 md:p-7 shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.12)] ring-1 ring-ocean-900/[0.06]" aria-labelledby="quick-answer-heading">
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sand-400 via-coral-400 to-ocean-500" aria-hidden="true" />
                <h2 id="quick-answer-heading" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ocean-700">
                  <CheckCircle className="w-4 h-4" aria-hidden="true" />
                  {t('quickAnswer')}
                </h2>
                {points.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {points.map((pt, n) => (
                      <li key={n} className="flex gap-3 text-[17px] leading-relaxed text-slate-800">
                        <span className="mt-2.5 h-2 w-2 flex-shrink-0 rounded-full bg-sand-400 ring-2 ring-sand-100" aria-hidden="true" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-[17px] md:text-lg leading-relaxed text-slate-800">{article.quickAnswer}</p>
                )}
              </section>

              {adventGuide && (
                <Link
                  href={`/guides/${article.destination}-advent`}
                  className="group mt-4 flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-coral-200 hover:ring-coral-300"
                >
                  <span className="text-2xl flex-shrink-0" aria-hidden="true">🎄</span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-coral-600">{t('adventCallout')}</span>
                    <span className="block font-semibold text-ocean-900 group-hover:underline underline-offset-2">{adventGuide.title}</span>
                  </span>
                  <ArrowRight className="w-5 h-5 ml-auto flex-shrink-0 text-coral-400 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </Link>
              )}

              {/* Mobile table of contents */}
              {toc.length >= 3 && (
                <details className="lg:hidden mt-4 rounded-2xl bg-white shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.12)] ring-1 ring-ocean-900/[0.06]">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                    {t('ui.onThisPage')}
                    <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" aria-hidden="true" />
                  </summary>
                  {tocList(true)}
                </details>
              )}

              {/* Body */}
              <div className="article-body mt-10" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

              {/* Recommendations / comparison table */}
              {article.tableData && article.tableData.length > 0 && (isComparison ? (() => {
                const firstRow = article.tableData![0] as ComparisonTableRow;
                const cols = Object.keys(firstRow).filter(k => k !== 'name' && k !== 'winner');
                return (
                  <section className="mt-14" aria-labelledby="comparison-heading">
                    <h2 id="comparison-heading" className="font-display text-[1.75rem] font-semibold tracking-tight text-ocean-900 mb-4">{t('ui.comparison')}</h2>
                    <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.12)] ring-1 ring-ocean-900/[0.06]">
                      <table className="w-full text-left text-[15px]">
                        <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="py-3 px-4 font-semibold">{t('ui.category')}</th>
                            {cols.map(col => <th key={col} className="py-3 px-4 font-semibold">{col}</th>)}
                            <th className="py-3 px-4 font-semibold">{t('ui.winner')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(article.tableData as ComparisonTableRow[]).map((row, index) => (
                            <tr key={index}>
                              <td className="py-3 px-4 font-semibold text-slate-900">{row.name}</td>
                              {cols.map(col => <td key={col} className="py-3 px-4 text-slate-700">{row[col]}</td>)}
                              <td className="py-3 px-4 font-semibold text-seafoam-700">{row.winner}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                );
              })() : (
                <section className="mt-14" aria-labelledby="recommendations-heading">
                  <h2 id="recommendations-heading" className="font-display text-[1.75rem] font-semibold tracking-tight text-ocean-900 mb-4">{t('ui.topRecommendations')}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {standardRows.map((row, index) => (
                      <div key={index} className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.12)] ring-1 ring-ocean-900/[0.06]">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-semibold text-slate-900 leading-snug">{row.name}</p>
                          {showRating && hasRating(row.rating) && (
                            <span className="flex-shrink-0 rounded-full bg-sand-100 px-2 py-0.5 text-xs font-bold text-sand-800">{row.rating}</span>
                          )}
                        </div>
                        <dl className="mt-3 space-y-1 text-sm">
                          {row.price && (<div className="flex gap-2"><dt className="text-slate-500">{t('ui.price')}:</dt><dd className="font-medium text-slate-800">{row.price}</dd></div>)}
                          {row.distance && (<div className="flex gap-2"><dt className="text-slate-500">{t('ui.distance')}:</dt><dd className="text-slate-700">{row.distance}</dd></div>)}
                        </dl>
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              {/* FAQ */}
              {article.faq && article.faq.length > 0 && (
                <section className="mt-14 rounded-2xl bg-white p-5 md:p-7 shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.12)] ring-1 ring-ocean-900/[0.06]" aria-labelledby="faq-heading" itemScope itemType="https://schema.org/FAQPage">
                  <h2 id="faq-heading" className="font-display text-[1.75rem] font-semibold tracking-tight text-ocean-900 mb-2">{t('faq.title')}</h2>
                  <AnimatedFaq items={article.faq} />
                </section>
              )}

              {/* About this guide */}
              <section className="mt-8 flex gap-3 px-1" aria-labelledby="disclaimer-heading">
                <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 id="disclaimer-heading" className="text-sm font-semibold text-slate-700 mb-1">{t('disclaimer.title')}</h2>
                  <p className="text-sm text-slate-500 leading-relaxed mb-1">{t('disclaimer.body')}</p>
                  <p className="text-xs text-slate-400">{t('disclaimer.lastUpdated', { date: updated })}</p>
                </div>
              </section>
            </article>

            {/* Right: at-a-glance card (wide screens) */}
            <aside className="hidden xl:block">
              <div className="sticky top-24 space-y-4">
                {!isComparison && standardRows.length > 0 && (
                  <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.12)] ring-1 ring-ocean-900/[0.06]">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">{t('ui.topRecommendations')}</p>
                    <ul className="space-y-3">
                      {standardRows.slice(0, 4).map((row, n) => (
                        <li key={n} className="text-sm">
                          <p className="font-semibold text-slate-900 leading-snug">{row.name}</p>
                          {row.price && <p className="text-slate-500">{row.price}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Link
                  href={`/destinations/${article.destination}`}
                  className="group block overflow-hidden rounded-2xl bg-gradient-to-br from-ocean-800 to-ocean-900 p-5 text-white"
                >
                  <MapPin className="w-5 h-5 text-sand-300" aria-hidden="true" />
                  <div className="mt-3 font-display text-xl font-semibold leading-tight text-white">
                    {t('sidebar.moreAbout', { destination: article.destinationName })}
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm text-white/70 group-hover:text-white">
                    {t('sidebar.viewAllGuides')} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Related guides */}
      {(relatedArticles.length > 0 || inlineNextReads.length > 0) && (
        <section className="bg-white border-t border-ocean-100 pt-12 pb-16 md:pt-16 md:pb-24" aria-labelledby="related-heading">
          <div className="container max-w-7xl">
            <h2 id="related-heading" className="font-display text-3xl font-semibold tracking-tight text-ocean-900 mb-6">{t('ui.relatedTitle')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...inlineNextReads, ...relatedArticles].slice(0, 4).map(related => (
                <Link key={related.slug} href={`/guides/${related.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                    {related.imageUrl && (
                      <Image src={related.imageUrl} alt={related.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" sizes="(max-width: 640px) 100vw, 300px" />
                    )}
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-ocean-700">{related.destinationName}</p>
                  <p className="mt-1 text-base font-semibold leading-snug text-slate-900 line-clamp-3 group-hover:text-ocean-700">{related.title}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
