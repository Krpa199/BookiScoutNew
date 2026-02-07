import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { ChevronRight, MapPin, Clock, Sparkles, BookOpen, TrendingUp, Filter } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { DESTINATIONS } from '@/config/destinations';
import { locales } from '@/i18n/config';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('guidesTitle'),
    description: t('guidesDescription'),
  };
}

interface ArticlePreview {
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

function calculateReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, '').replace(/[#*_\[\]()]/g, '');
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.ceil(wordCount / 200));
}

// Get all available articles
function getAllArticles(locale: string): ArticlePreview[] {
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

  // Also check the guides folder
  const guidesDir = path.join(process.cwd(), 'src', 'content', 'guides', locale);
  try {
    if (fs.existsSync(guidesDir)) {
      const files = fs.readdirSync(guidesDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = fs.readFileSync(path.join(guidesDir, file), 'utf-8');
          const data = JSON.parse(content);
          // Avoid duplicates
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
  } catch (error) {
    // Guides directory doesn't exist yet
  }

  return articles.sort((a, b) =>
    new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );
}

export default async function GuidesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('guides');
  const tCommon = await getTranslations('common');
  const articles = getAllArticles(locale);
  const totalGuides = articles.length * locales.length;

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-ocean-500 via-ocean-600 to-seafoam-600 text-white py-12 md:py-20 overflow-hidden">
        <div className="hidden md:block absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-seafoam-300 rounded-full blur-3xl" />
        </div>

        <div className="container relative">
          <nav className="flex items-center gap-2 text-sm text-ocean-100 mb-8">
            <Link href="/" className="hover:text-white transition-colors">{tCommon('home')}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-semibold">{t('hero.title')}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">{t('hero.badge')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-ocean-50 leading-relaxed">
              {articles.length > 0
                ? t('hero.subtitle', { count: totalGuides, langCount: locales.length })
                : t('hero.subtitleEmpty')}
            </p>

            {articles.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-6 mt-6 md:mt-8">
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="font-semibold text-xs sm:text-sm text-center">{articles.length} {t('hero.statGuides')}</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="font-semibold text-xs sm:text-sm text-center">{t('hero.statDestinations')}</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="font-semibold text-xs sm:text-sm text-center">{t('hero.statUpdated')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 text-white">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-6 sm:h-auto" preserveAspectRatio="none">
            <path
              d="M0,48 C240,64 480,64 720,48 C960,32 1200,32 1440,48 L1440,80 L0,80 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container">
          {articles.length > 0 ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                    {t('listing.title')}
                  </h2>
                  <p className="text-sm md:text-base text-slate-600">
                    {t('listing.subtitle', { count: articles.length })}
                  </p>
                </div>

                <button className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-medium">
                  <Filter className="w-4 h-4" />
                  {t('listing.filterByTopic')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                {articles.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/guides/${article.slug}`}
                      className="group block"
                    >
                      <article className="bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-ocean transition-all duration-500 border border-slate-100 hover:border-ocean-200 h-full flex flex-col hover:-translate-y-1">
                        <div className="relative h-44 sm:h-48 md:h-52 overflow-hidden">
                          {article.imageUrl ? (
                            <img
                              src={article.imageUrl}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-ocean-400 to-ocean-600">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-16 h-16 text-white/30" />
                              </div>
                              <div className="absolute inset-0 opacity-10">
                                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                  <defs>
                                    <pattern id={`pattern-${article.slug}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                                      <circle cx="10" cy="10" r="1.5" fill="white" />
                                      <circle cx="30" cy="30" r="1" fill="white" />
                                    </pattern>
                                  </defs>
                                  <rect width="100%" height="100%" fill={`url(#pattern-${article.slug})`} />
                                </svg>
                              </div>
                            </div>
                          )}

                          {/* Gradient overlay for better text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />


                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-xl text-xs font-bold text-slate-700 shadow-soft flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-ocean-500" />
                              AI
                            </span>
                          </div>
                        </div>

                        <div className="p-4 sm:p-5 md:p-6 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2 sm:mb-3">
                            <div className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center">
                              <MapPin className="w-3 h-3" />
                            </div>
                            <span className="font-medium">{article.destinationName}, Croatia</span>
                          </div>

                          <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-2 sm:mb-3 line-clamp-2 group-hover:text-ocean-600 transition-colors leading-snug">
                            {article.title}
                          </h3>

                          <p className="text-slate-600 text-sm line-clamp-2 mb-3 sm:mb-5 leading-relaxed flex-1">
                            {article.metaDescription}
                          </p>

                          <div className="flex items-center pt-3 sm:pt-5 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">{t('detail.minRead', { count: article.readingTime })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="h-1 bg-gradient-to-r from-ocean-400 to-ocean-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                      </article>
                    </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-ocean rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-ocean">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                {t('empty.title')}
              </h2>
              <p className="text-lg text-slate-600 max-w-md mx-auto mb-8 leading-relaxed">
                {t('empty.subtitle')}
              </p>
              <Link
                href="/destinations"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-ocean text-white font-bold rounded-2xl hover:shadow-ocean transition-all shadow-soft"
              >
                {t('empty.cta')}
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Browse by Destination */}
      <section className="py-12 md:py-20 bg-gradient-ocean-subtle">
        <div className="container">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 md:mb-3">
              {t('byDestination.title')}
            </h2>
            <p className="text-base md:text-lg text-slate-600">
              {t('byDestination.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {DESTINATIONS.filter(d => d.popular).map(dest => (
              <Link
                key={dest.slug}
                href={`/destinations/${dest.slug}`}
                className="group flex flex-col items-center gap-2 sm:gap-3 px-3 py-4 sm:px-4 sm:py-5 bg-white rounded-2xl border-2 border-slate-100 hover:border-ocean-300 hover:shadow-soft transition-all hover:-translate-y-1"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-ocean-subtle rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-ocean-600" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-ocean-600 transition-colors text-center">
                  {dest.name}
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/destinations"
              className="inline-flex items-center gap-2 text-ocean-600 hover:text-ocean-700 font-semibold transition-colors group"
            >
              {t('byDestination.viewAll', { count: DESTINATIONS.length })}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
