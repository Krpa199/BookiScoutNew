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
import { MapPin, Clock, Calendar, ChevronRight, CheckCircle, Sparkles, Shield, Star, HelpCircle } from 'lucide-react';

// Article type matching the generated JSON structure
interface GeneratedArticle {
  title: string;
  metaDescription: string;
  slug: string;
  content: string;
  faq: { question: string; answer: string }[];
  quickAnswer: string;
  tableData?: { name: string; price: string; rating: string; distance: string }[];
  destination: string;
  destinationName: string;
  region: string;
  theme: string;
  language: string;
  generatedAt: string;
  lat: number;
  lng: number;
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
    },
    alternates: {
      canonical: url,
    },
  };
}

// Simple markdown to HTML converter
function renderMarkdown(content: string): string {
  // Split content into lines for proper header detection
  const lines = content.split('\n');
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Headers - must be at start of line
    if (line.startsWith('#### ')) {
      line = `<h4 class="text-lg font-bold text-slate-900 mt-6 mb-3">${line.slice(5)}</h4>`;
    } else if (line.startsWith('### ')) {
      line = `<h3 class="text-xl font-bold text-slate-900 mt-8 mb-4">${line.slice(4)}</h3>`;
    } else if (line.startsWith('## ')) {
      line = `<h2 class="text-2xl font-bold text-slate-900 mt-10 mb-5">${line.slice(3)}</h2>`;
    } else if (line.startsWith('# ')) {
      line = `<h1 class="text-3xl font-bold text-slate-900 mt-12 mb-6">${line.slice(2)}</h1>`;
    } else if (line.startsWith('*   ')) {
      // List item
      line = `<li class="flex items-start gap-3 mb-2"><span class="w-2 h-2 bg-ocean-500 rounded-full mt-2 flex-shrink-0"></span><span>${line.slice(4)}</span></li>`;
    }

    processedLines.push(line);
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
        faq={article.faq}
      />

      {/* Breadcrumb */}
      <nav className="bg-gradient-ocean-subtle border-b border-ocean-100" aria-label="Breadcrumb">
        <div className="container py-4">
          <ol className="flex items-center gap-2 text-sm text-slate-600" itemScope itemType="https://schema.org/BreadcrumbList">
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

      {/* Article Header */}
      <header className="relative bg-gradient-to-br from-ocean-500 via-ocean-600 to-seafoam-600 text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-seafoam-300 rounded-full blur-3xl" />
        </div>

        <div className="container relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-6">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              <span>{article.destinationName}</span>
              <span aria-hidden="true">•</span>
              <span>{formatTheme(article.theme)}</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
              {article.title}
            </h1>

            <p className="text-xl md:text-2xl text-ocean-50 mb-8 leading-relaxed">
              {article.metaDescription}
            </p>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-ocean-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="font-medium">{readingTime} min read</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-seafoam-500/90 backdrop-blur-sm rounded-xl">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <time dateTime={article.generatedAt} className="font-bold">
                  Updated {new Date(article.generatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </time>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span className="font-bold">{t('sidebar.aiPowered')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 text-white" aria-hidden="true">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0,32 C240,48 480,48 720,32 C960,16 1200,16 1440,32 L1440,60 L0,60 Z" fill="currentColor" />
          </svg>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Article Content */}
          <article className="lg:col-span-2 space-y-10">
            {/* Quick Answer Box - Important for AI crawlers */}
            <section className="relative bg-gradient-to-br from-ocean-50 to-cyan-50 border-2 border-ocean-200 p-8 rounded-3xl shadow-soft overflow-hidden" aria-labelledby="quick-answer-heading">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ocean-100 rounded-full blur-3xl opacity-50" aria-hidden="true" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-ocean-500 rounded-xl flex items-center justify-center shadow-soft">
                    <CheckCircle className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <h2 id="quick-answer-heading" className="text-xl font-bold text-ocean-900">{t('quickAnswer')}</h2>
                </div>
                <p className="text-lg text-slate-800 leading-relaxed">{article.quickAnswer}</p>
              </div>
            </section>

            {/* Main Article Content */}
            <section className="prose prose-lg prose-slate max-w-none">
              <div
                className="text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: `<p class="text-slate-700 leading-relaxed mb-4">${renderMarkdown(article.content)}</p>` }}
              />
            </section>

            {/* Table Data if available */}
            {article.tableData && article.tableData.length > 0 && (
              <section className="bg-white rounded-3xl border-2 border-ocean-100 p-6 md:p-8 shadow-soft overflow-hidden" aria-labelledby="recommendations-heading">
                <h2 id="recommendations-heading" className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-seafoam-500 rounded-xl flex items-center justify-center shadow-soft">
                    <Star className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  Top Recommendations
                </h2>
                <div className="overflow-x-auto">
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
                      {article.tableData.map((row, index) => (
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
            )}

            {/* FAQ Section - Critical for AI optimization */}
            {article.faq && article.faq.length > 0 && (
              <section
                className="bg-gradient-to-br from-slate-50 to-ocean-50 p-8 md:p-10 rounded-3xl border-2 border-ocean-100"
                aria-labelledby="faq-heading"
                itemScope
                itemType="https://schema.org/FAQPage"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-ocean rounded-2xl flex items-center justify-center shadow-ocean">
                    <HelpCircle className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 id="faq-heading" className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
                    <p className="text-sm text-slate-600 mt-1">Common questions about {article.destinationName}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {article.faq.map((item, index) => (
                    <details
                      key={index}
                      className="group bg-white border-2 border-slate-100 rounded-2xl overflow-hidden hover:border-ocean-300 hover:shadow-soft transition-all"
                      itemScope
                      itemProp="mainEntity"
                      itemType="https://schema.org/Question"
                    >
                      <summary className="flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-gradient-ocean-subtle transition-all">
                        <span className="font-bold text-slate-900 pr-4 text-lg" itemProp="name">{item.question}</span>
                        <div className="w-8 h-8 rounded-lg bg-ocean-100 group-hover:bg-ocean-500 flex items-center justify-center transition-all flex-shrink-0">
                          <ChevronRight className="w-5 h-5 text-ocean-600 group-hover:text-white transition-all group-open:rotate-90" aria-hidden="true" />
                        </div>
                      </summary>
                      <div
                        className="px-6 pb-5 text-slate-700 leading-relaxed border-t-2 border-slate-100 bg-gradient-to-br from-white to-slate-50"
                        itemScope
                        itemProp="acceptedAnswer"
                        itemType="https://schema.org/Answer"
                      >
                        <p className="pt-5 text-base" itemProp="text">{item.answer}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Booking Widget */}
              {showBooking && (
                <BookingWidget
                  destination={article.destinationName}
                  destinationSlug={article.destination}
                />
              )}

              {/* Language Switcher */}
              <div className="bg-white rounded-2xl border-2 border-slate-100 p-6 shadow-soft">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-ocean-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-ocean-600" aria-hidden="true" />
                  </div>
                  {t('sidebar.otherLanguages')}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {locales.map((code) => (
                    <Link
                      key={code}
                      href={`/guides/${slug}`}
                      locale={code as Locale}
                      className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                        code === locale
                          ? 'bg-gradient-ocean text-white shadow-soft'
                          : 'bg-slate-50 text-slate-600 hover:bg-ocean-50 hover:text-ocean-600 hover:scale-105'
                      }`}
                    >
                      <span className="text-xl">{localeFlags[code]}</span>
                      <span className="truncate text-xs">{code.toUpperCase()}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Trust Signals */}
              <div className="bg-gradient-to-br from-sand-50 to-coral-50 rounded-2xl border-2 border-sand-200 p-6 shadow-soft">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-sand-400 to-coral-500 rounded-xl flex items-center justify-center shadow-soft">
                    <Shield className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-slate-900">{t('sidebar.trustedGuide')}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-seafoam-600 flex-shrink-0" aria-hidden="true" />
                    <span className="text-slate-700">{t('sidebar.aiPowered')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-seafoam-600 flex-shrink-0" aria-hidden="true" />
                    <span className="text-slate-700">{t('sidebar.humanReviewed')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-seafoam-600 flex-shrink-0" aria-hidden="true" />
                    <span className="text-slate-700">{t('sidebar.regularlyUpdated')}</span>
                  </div>
                </div>
              </div>

              {/* More Guides */}
              <div className="bg-gradient-to-br from-seafoam-50 to-ocean-50 rounded-2xl border-2 border-seafoam-100 p-6 shadow-soft">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-seafoam-600" aria-hidden="true" />
                  {t('sidebar.moreAbout', { destination: article.destinationName })}
                </h3>
                <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                  {t('sidebar.exploreOther', { destination: article.destinationName })}
                </p>
                <Link
                  href={`/destinations/${article.destination}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gradient-ocean hover:text-white rounded-xl font-semibold text-sm text-ocean-600 transition-all shadow-soft hover:shadow-ocean"
                >
                  {t('sidebar.viewAllGuides')}
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
