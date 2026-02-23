import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { locales, localeFlags, type Locale } from '@/i18n/config';
import { shouldShowBookingWidget } from '@/config/features';
import ArticleSchema from '@/components/article/ArticleSchema';
import BookingWidget from '@/components/ui/BookingWidget';
import ScrollReveal from '@/components/ui/ScrollReveal';
import ReadingProgress from '@/components/ui/ReadingProgress';
import AnimatedFaq from '@/components/ui/AnimatedFaq';
import { MapPin, Clock, Calendar, ChevronRight, CheckCircle, Sparkles, Shield, Star, HelpCircle, ArrowRight } from 'lucide-react';

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

// Get related articles (same destination or same theme)
function getRelatedArticles(lang: string, currentSlug: string, destination: string, theme: string, limit: number = 3): GeneratedArticle[] {
  const articlesDir = path.join(process.cwd(), 'src', 'content', 'articles', lang);
  const related: GeneratedArticle[] = [];

  try {
    if (fs.existsSync(articlesDir)) {
      const files = fs.readdirSync(articlesDir);
      for (const file of files) {
        if (file.endsWith('.json') && file !== `${currentSlug}.json`) {
          const content = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
          const article = JSON.parse(content) as GeneratedArticle;
          // Prioritize same destination, then same theme
          if (article.destination === destination || article.theme === theme) {
            related.push(article);
          }
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }

  // Sort: same destination first, then by date
  return related
    .sort((a, b) => {
      if (a.destination === destination && b.destination !== destination) return -1;
      if (b.destination === destination && a.destination !== destination) return 1;
      return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
    })
    .slice(0, limit);
}

// Generate static params for all articles
export async function generateStaticParams() {
  const params: { slug: string }[] = [];
  const articlesDir = path.join(process.cwd(), 'src', 'content', 'articles');

  try {
    for (const locale of locales) {
      const langDir = path.join(articlesDir, locale);
      if (fs.existsSync(langDir) && fs.statSync(langDir).isDirectory()) {
        const files = fs.readdirSync(langDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const slug = file.replace('.json', '');
            if (!params.find(p => p.slug === slug)) {
              params.push({ slug });
            }
          }
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist yet
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookiscout.com';
  const url = `${baseUrl}/${locale}/guides/${slug}`;

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
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        locales.map(loc => [loc, `${baseUrl}/${loc}/guides/${slug}`])
      ),
    },
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

// Simple markdown to HTML converter
function renderMarkdown(content: string): string {
  const lines = content.split('\n');
  const processedLines: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Detect markdown table: line starts with | and has at least 2 |
    if (line.trimStart().startsWith('|') && (line.match(/\|/g) || []).length >= 3) {
      // Collect all consecutive table lines
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith('|') && (lines[i].match(/\|/g) || []).length >= 3) {
        tableLines.push(lines[i]);
        i++;
      }
      processedLines.push(renderMarkdownTable(tableLines));
      continue;
    }

    // Headers - must be at start of line, with accent bars
    let processed = line;
    if (processed.startsWith('#### ')) {
      processed = `<h4 class="text-lg font-bold text-slate-900 mt-6 mb-3">${processed.slice(5)}</h4>`;
    } else if (processed.startsWith('### ')) {
      processed = `<h3 class="text-xl font-bold text-slate-900 mt-8 mb-4 flex items-center gap-2"><span class="w-1 h-6 bg-ocean-300 rounded-full flex-shrink-0"></span>${processed.slice(4)}</h3>`;
    } else if (processed.startsWith('## ')) {
      processed = `<div class="section-divider my-8"></div><h2 class="text-2xl font-bold text-slate-900 mt-2 mb-5 flex items-center gap-3"><span class="w-1 h-8 bg-gradient-to-b from-ocean-400 to-seafoam-400 rounded-full flex-shrink-0"></span>${processed.slice(3)}</h2>`;
    } else if (processed.startsWith('# ')) {
      processed = `<h1 class="text-3xl font-bold text-slate-900 mt-12 mb-6">${processed.slice(2)}</h1>`;
    } else if (processed.startsWith('*   ')) {
      // List item
      processed = `<li class="flex items-start gap-3 mb-2"><span class="w-2 h-2 bg-ocean-500 rounded-full mt-2 flex-shrink-0"></span><span>${processed.slice(4)}</span></li>`;
    }

    processedLines.push(processed);
    i++;
  }

  let html = processedLines.join('\n');

  // Bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');
  // Italic text (but not list items)
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // Wrap consecutive list items in ul
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, '<ul class="space-y-2 my-6">$&</ul>');

  // Convert double newlines to paragraph breaks
  html = html.replace(/\n\n+/g, '</p><p class="text-slate-700 leading-relaxed mb-4">');

  // Remove single newlines within paragraphs (but preserve those after block elements)
  html = html.replace(/(?<!>)\n(?!<)/g, ' ');

  return html;
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookiscout.com';
  const url = `${baseUrl}/${locale}/guides/${slug}`;

  // Calculate reading time from content
  const wordCount = article.content.split(/\s+/).length;
  const readingTime = Math.max(3, Math.ceil(wordCount / 200));

  // Should show booking widget?
  const showBooking = shouldShowBookingWidget('guide');

  // Get related articles
  const relatedArticles = getRelatedArticles(locale, slug, article.destination, article.theme, 3);

  // Format theme for display
  const formatTheme = (theme: string) => {
    return theme.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <>
      {/* Schema.org structured data for AI crawlers */}
      <ArticleSchema
        title={article.title}
        description={article.metaDescription}
        url={url}
        datePublished={article.generatedAt}
        dateModified={article.generatedAt}
        destination={article.destinationName}
        image={article.imageUrl}
        faq={article.faq}
      />

      {/* Reading Progress Bar */}
      <ReadingProgress />

      {/* Breadcrumb */}
      <nav className="bg-gradient-ocean-subtle border-b border-ocean-100" aria-label="Breadcrumb">
        <div className="container py-3 md:py-4">
          <ol className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-600 overflow-x-auto whitespace-nowrap" itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href="/" className="hover:text-ocean-600 transition-colors" itemProp="item">
                <span itemProp="name">{t('breadcrumb.home')}</span>
              </Link>
              <meta itemProp="position" content="1" />
            </li>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href="/guides" className="hover:text-ocean-600 transition-colors" itemProp="item">
                <span itemProp="name">{t('breadcrumb.guides')}</span>
              </Link>
              <meta itemProp="position" content="2" />
            </li>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href={`/destinations/${article.destination}`} className="hover:text-ocean-600 transition-colors" itemProp="item">
                <span itemProp="name">{article.destinationName}</span>
              </Link>
              <meta itemProp="position" content="3" />
            </li>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span className="text-slate-900 font-semibold" itemProp="name">{formatTheme(article.theme)}</span>
              <meta itemProp="position" content="4" />
            </li>
          </ol>
        </div>
      </nav>

      {/* Hero with background image (like destinations) */}
      <header className="relative text-white min-h-[85vh] sm:min-h-[70vh] md:min-h-[85vh] flex items-end overflow-hidden">
        {/* Background image or gradient fallback */}
        <div className="absolute inset-0">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.imageAlt || article.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-ocean-500 via-ocean-600 to-seafoam-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
        </div>

        {/* Content */}
        <div className="container pb-16 sm:pb-20 md:pb-28 relative z-10 w-full">
          <div className="max-w-4xl animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/30 backdrop-blur-sm rounded-full text-sm font-semibold mb-6 border border-white/20">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              <span>{article.destinationName}</span>
              <span aria-hidden="true">•</span>
              <span>{formatTheme(article.theme)}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6 leading-tight tracking-tight text-white [text-shadow:_0_2px_10px_rgba(0,0,0,0.9),_0_4px_20px_rgba(0,0,0,0.7),_0_0_40px_rgba(0,0,0,0.5)]">
              {article.title}
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white max-w-3xl mb-6 md:mb-8 leading-relaxed [text-shadow:_0_2px_8px_rgba(0,0,0,0.7)]">
              {article.metaDescription}
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm md:text-base">
              <div className="flex items-center gap-2 px-3 py-2 bg-black/30 backdrop-blur-sm rounded-xl border border-white/20">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                <span className="font-bold text-xs sm:text-sm">{readingTime} min read</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-black/30 backdrop-blur-sm rounded-xl border border-white/20">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                <time dateTime={article.generatedAt} className="font-bold text-xs sm:text-sm">
                  {new Date(article.generatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </time>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-black/30 backdrop-blur-sm rounded-xl border border-white/20">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span className="font-bold text-xs sm:text-sm">{t('sidebar.aiPowered')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Image credit */}
        {article.imageUrl && article.imageCredit && (
          <div className="absolute bottom-2 right-2 z-10 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded">
            Photo by{' '}
            <a href={article.imageCreditUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-ocean-200">
              {article.imageCredit}
            </a>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      </header>

      {/* Main Content */}
      <div className="container py-8 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Article Content */}
          <article className="lg:col-span-2 space-y-6 md:space-y-10">
            {/* Quick Answer Box - Important for AI crawlers */}
            <ScrollReveal delay={100}>
              <section className="relative bg-gradient-to-br from-ocean-50 via-cyan-50 to-seafoam-50 border-2 border-ocean-200 p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-soft overflow-hidden pulse-glow" aria-labelledby="quick-answer-heading">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-ocean-200/30 rounded-full blur-3xl animate-float-slow" aria-hidden="true" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-seafoam-200/20 rounded-full blur-2xl animate-float-slower" aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 md:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-ocean">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                    </div>
                    <h2 id="quick-answer-heading" className="text-lg sm:text-xl font-bold text-gradient-ocean">{t('quickAnswer')}</h2>
                  </div>
                  <p className="text-base sm:text-lg text-slate-800 leading-relaxed">{article.quickAnswer}</p>
                </div>
              </section>
            </ScrollReveal>

            {/* Main Article Content */}
            <ScrollReveal delay={150}>
              <section className="prose prose-base sm:prose-lg prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed">
                <div
                  className="text-sm sm:text-base text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: `<p class="text-slate-700 leading-relaxed mb-4">${renderMarkdown(article.content)}</p>` }}
                />
              </section>
            </ScrollReveal>

            {/* Table Data if available - Cards on mobile, table on desktop */}
            {article.tableData && article.tableData.length > 0 && (() => {
              // Detect if this is a comparison table (has "winner" field) or standard table
              const isComparisonTable = 'winner' in article.tableData[0];

              if (isComparisonTable) {
                // Get comparison columns (all keys except 'name' and 'winner')
                const firstRow = article.tableData[0] as ComparisonTableRow;
                const comparisonColumns = Object.keys(firstRow).filter(k => k !== 'name' && k !== 'winner');

                return (
                  <section className="bg-white rounded-2xl md:rounded-3xl border-2 border-ocean-100 p-4 sm:p-6 md:p-8 shadow-soft overflow-hidden" aria-labelledby="comparison-heading">
                    <h2 id="comparison-heading" className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6 flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-seafoam-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-soft">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                      </div>
                      Comparison
                    </h2>

                    {/* Mobile: Cards layout for comparison */}
                    <div className="md:hidden space-y-3">
                      {(article.tableData as ComparisonTableRow[]).map((row, index) => (
                        <div key={index} className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-xl border border-slate-100">
                          <h3 className="font-bold text-slate-900 text-base mb-3">{row.name}</h3>
                          <div className="space-y-2 text-sm">
                            {comparisonColumns.map(col => (
                              <div key={col} className="flex justify-between items-center">
                                <span className="text-slate-500 capitalize">{col}</span>
                                <span className="font-semibold text-slate-700">{row[col]}</span>
                              </div>
                            ))}
                            {row.winner && (
                              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                <span className="text-slate-500">Winner</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${
                                  row.winner.toLowerCase() === 'tie' || row.winner.toLowerCase() === 'neriješeno'
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-seafoam-100 text-seafoam-700'
                                }`}>
                                  {row.winner}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop: Table layout for comparison */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b-2 border-slate-100">
                            <th className="py-3 px-4 font-bold text-slate-900">Category</th>
                            {comparisonColumns.map(col => (
                              <th key={col} className="py-3 px-4 font-bold text-slate-900 capitalize">{col}</th>
                            ))}
                            <th className="py-3 px-4 font-bold text-slate-900">Winner</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(article.tableData as ComparisonTableRow[]).map((row, index) => (
                            <tr key={index} className="border-b border-slate-50 hover:bg-ocean-50/50 transition-colors">
                              <td className="py-4 px-4 font-semibold text-slate-900">{row.name}</td>
                              {comparisonColumns.map(col => (
                                <td key={col} className="py-4 px-4 text-slate-700">{row[col]}</td>
                              ))}
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold ${
                                  row.winner?.toLowerCase() === 'tie' || row.winner?.toLowerCase() === 'neriješeno'
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-seafoam-100 text-seafoam-700'
                                }`}>
                                  {row.winner}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                );
              } else {
                // Standard recommendations table
                return (
                  <section className="bg-white rounded-2xl md:rounded-3xl border-2 border-ocean-100 p-4 sm:p-6 md:p-8 shadow-soft overflow-hidden" aria-labelledby="recommendations-heading">
                    <h2 id="recommendations-heading" className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6 flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-seafoam-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-soft">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                      </div>
                      Top Recommendations
                    </h2>

                    {/* Mobile: Cards layout */}
                    <div className="md:hidden space-y-3">
                      {(article.tableData as StandardTableRow[]).map((row, index) => (
                        <div key={index} className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-xl border border-slate-100">
                          <h3 className="font-bold text-slate-900 text-base mb-3">{row.name}</h3>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-slate-500 text-xs mb-0.5">Price</p>
                              <p className="font-semibold text-slate-700">{row.price}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs mb-0.5">Rating</p>
                              <span className="inline-flex items-center px-2 py-0.5 bg-seafoam-100 text-seafoam-700 rounded-lg text-xs font-semibold">
                                {row.rating}
                              </span>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs mb-0.5">Distance</p>
                              <p className="font-medium text-slate-600">{row.distance}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop: Table layout */}
                    <div className="hidden md:block">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b-2 border-slate-100">
                            <th className="py-3 px-4 font-bold text-slate-900">Name</th>
                            <th className="py-3 px-4 font-bold text-slate-900">Price</th>
                            <th className="py-3 px-4 font-bold text-slate-900">Rating</th>
                            <th className="py-3 px-4 font-bold text-slate-900">Distance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(article.tableData as StandardTableRow[]).map((row, index) => (
                            <tr key={index} className="border-b border-slate-50 hover:bg-ocean-50/50 transition-colors">
                              <td className="py-4 px-4 font-semibold text-slate-900">{row.name}</td>
                              <td className="py-4 px-4 text-slate-700">{row.price}</td>
                              <td className="py-4 px-4">
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-seafoam-100 text-seafoam-700 rounded-lg text-sm font-semibold">
                                  {row.rating}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-slate-600">{row.distance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                );
              }
            })()}

            {/* FAQ Section - Critical for AI optimization */}
            {article.faq && article.faq.length > 0 && (
              <ScrollReveal delay={200}>
                <section
                  className="bg-gradient-to-br from-slate-50 via-ocean-50/50 to-seafoam-50/30 p-5 sm:p-6 md:p-8 lg:p-10 rounded-2xl md:rounded-3xl border-2 border-ocean-100"
                  aria-labelledby="faq-heading"
                  itemScope
                  itemType="https://schema.org/FAQPage"
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-5 md:mb-8">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-ocean">
                      <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 id="faq-heading" className="text-xl sm:text-2xl md:text-3xl font-bold text-gradient-ocean">Frequently Asked Questions</h2>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">Common questions about {article.destinationName}</p>
                    </div>
                  </div>
                  <AnimatedFaq items={article.faq} />
                </section>
              </ScrollReveal>
            )}

            {/* Related Guides - Good for AI and user engagement */}
            {relatedArticles.length > 0 && (
              <ScrollReveal delay={250}>
                <section className="bg-white rounded-2xl md:rounded-3xl border-2 border-slate-100 p-5 sm:p-6 md:p-8 shadow-soft" aria-labelledby="related-heading">
                  <div className="flex items-center gap-2 sm:gap-3 mb-5 md:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-coral-400 to-coral-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-soft">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 id="related-heading" className="text-xl sm:text-2xl font-bold text-slate-900">Related Guides</h2>
                      <p className="text-xs sm:text-sm text-slate-600">More helpful travel guides</p>
                    </div>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {relatedArticles.map((related) => (
                      <Link
                        key={related.slug}
                        href={`/guides/${related.slug}`}
                        className="group flex gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 hover:bg-gradient-ocean-subtle rounded-xl sm:rounded-2xl border-2 border-slate-100 hover:border-ocean-200 transition-all hover:shadow-soft hover:-translate-y-0.5"
                      >
                        {related.imageUrl ? (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl flex-shrink-0 overflow-hidden">
                            <img
                              src={related.imageUrl}
                              alt={related.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-ocean rounded-lg sm:rounded-xl flex-shrink-0 flex items-center justify-center">
                            <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-slate-500 font-medium mb-1">{related.destinationName}</p>
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-2 group-hover:text-ocean-600 transition-colors">
                            {related.title}
                          </h3>
                        </div>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-ocean-600 group-hover:translate-x-1 transition-all flex-shrink-0 self-center" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                </section>
              </ScrollReveal>
            )}
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1 order-first lg:order-last">
            <div className="lg:sticky lg:top-20 space-y-4 sm:space-y-6">
              {/* Booking Widget */}
              {showBooking && (
                <BookingWidget
                  destination={article.destinationName}
                  destinationSlug={article.destination}
                />
              )}

              {/* Language Switcher - hidden on mobile (auto-detected via middleware, also available in header) */}
              <div className="hidden lg:block bg-white rounded-2xl border-2 border-slate-100 p-4 sm:p-6 shadow-soft">
                <h3 className="font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-ocean-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ocean-600" aria-hidden="true" />
                  </div>
                  {t('sidebar.otherLanguages')}
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-3 gap-1.5 sm:gap-2">
                  {locales.map((code) => (
                    <Link
                      key={code}
                      href={`/guides/${slug}`}
                      locale={code as Locale}
                      className={`flex flex-col items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm font-semibold transition-all ${
                        code === locale
                          ? 'bg-gradient-ocean text-white shadow-soft'
                          : 'bg-slate-50 text-slate-600 hover:bg-ocean-50 hover:text-ocean-600 hover:scale-105'
                      }`}
                    >
                      <span className="text-base sm:text-xl">{localeFlags[code]}</span>
                      <span className="truncate text-[10px] sm:text-xs">{code.toUpperCase()}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Trust Signals */}
              <div className="bg-gradient-to-br from-sand-50 to-coral-50 rounded-2xl border-2 border-sand-200 p-4 sm:p-6 shadow-soft">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-sand-400 to-coral-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-soft">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">{t('sidebar.trustedGuide')}</h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-seafoam-600 flex-shrink-0" aria-hidden="true" />
                    <span className="text-slate-700">{t('sidebar.aiPowered')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-seafoam-600 flex-shrink-0" aria-hidden="true" />
                    <span className="text-slate-700">{t('sidebar.humanReviewed')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-seafoam-600 flex-shrink-0" aria-hidden="true" />
                    <span className="text-slate-700">{t('sidebar.regularlyUpdated')}</span>
                  </div>
                </div>
              </div>

              {/* More Guides */}
              <div className="bg-gradient-to-br from-seafoam-50 to-ocean-50 rounded-2xl border-2 border-seafoam-100 p-4 sm:p-6 shadow-soft">
                <h3 className="font-bold text-slate-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-seafoam-600" aria-hidden="true" />
                  {t('sidebar.moreAbout', { destination: article.destinationName })}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 mb-3 sm:mb-4 leading-relaxed">
                  {t('sidebar.exploreOther', { destination: article.destinationName })}
                </p>
                <Link
                  href={`/destinations/${article.destination}`}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white hover:bg-gradient-ocean hover:text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm text-ocean-600 transition-all shadow-soft hover:shadow-ocean"
                >
                  {t('sidebar.viewAllGuides')}
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
