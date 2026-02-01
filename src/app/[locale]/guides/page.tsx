import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { ChevronRight, MapPin, Clock, Star, Sparkles, BookOpen, TrendingUp, Filter } from 'lucide-react';
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
  const tThemes = await getTranslations('guides.themes');

  const articles = getAllArticles(locale);
  const totalGuides = articles.length * locales.length;

  // Theme styles
  const themeStyles: Record<string, { bg: string; text: string; gradient: string }> = {
    apartments: { bg: 'bg-ocean-100', text: 'text-ocean-700', gradient: 'from-ocean-400 to-ocean-600' },
    family: { bg: 'bg-seafoam-100', text: 'text-seafoam-700', gradient: 'from-seafoam-400 to-seafoam-600' },
    beach: { bg: 'bg-cyan-100', text: 'text-cyan-700', gradient: 'from-cyan-400 to-cyan-600' },
    budget: { bg: 'bg-sand-100', text: 'text-sand-700', gradient: 'from-sand-400 to-sand-600' },
    luxury: { bg: 'bg-purple-100', text: 'text-purple-700', gradient: 'from-purple-400 to-purple-600' },
    restaurants: { bg: 'bg-coral-100', text: 'text-coral-700', gradient: 'from-coral-400 to-coral-600' },
    'things-to-do': { bg: 'bg-indigo-100', text: 'text-indigo-700', gradient: 'from-indigo-400 to-indigo-600' },
    'hidden-gems': { bg: 'bg-pink-100', text: 'text-pink-700', gradient: 'from-pink-400 to-pink-600' },
    couples: { bg: 'bg-rose-100', text: 'text-rose-700', gradient: 'from-rose-400 to-rose-600' },
    nightlife: { bg: 'bg-violet-100', text: 'text-violet-700', gradient: 'from-violet-400 to-violet-600' },
    'day-trips': { bg: 'bg-teal-100', text: 'text-teal-700', gradient: 'from-teal-400 to-teal-600' },
    weather: { bg: 'bg-sky-100', text: 'text-sky-700', gradient: 'from-sky-400 to-sky-600' },
    'local-food': { bg: 'bg-orange-100', text: 'text-orange-700', gradient: 'from-orange-400 to-orange-600' },
  };

  const getThemeLabel = (theme: string): string => {
    const themeKeyMap: Record<string, string> = {
      'apartments': 'apartments',
      'family': 'family',
      'beach': 'beach',
      'budget': 'budget',
      'luxury': 'luxury',
      'restaurants': 'restaurants',
      'things-to-do': 'thingsToDo',
      'hidden-gems': 'hiddenGems',
      'couples': 'couples',
      'nightlife': 'nightlife',
      'day-trips': 'dayTrips',
      'weather': 'weather',
      'local-food': 'localFood',
    };
    const key = themeKeyMap[theme];
    if (key) {
      try {
        return tThemes(key as any);
      } catch {
        return theme;
      }
    }
    return theme;
  };

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-ocean-500 via-ocean-600 to-seafoam-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
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

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-ocean-50 leading-relaxed">
              {articles.length > 0
                ? t('hero.subtitle', { count: totalGuides, langCount: locales.length })
                : t('hero.subtitleEmpty')}
            </p>

            {articles.length > 0 && (
              <div className="flex flex-wrap items-center gap-6 mt-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">{articles.length} {t('hero.statGuides')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">{t('hero.statDestinations')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">{t('hero.statUpdated')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 text-white">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path
              d="M0,48 C240,64 480,64 720,48 C960,32 1200,32 1440,48 L1440,80 L0,80 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-20 bg-white">
        <div className="container">
          {articles.length > 0 ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    {t('listing.title')}
                  </h2>
                  <p className="text-slate-600">
                    {t('listing.subtitle', { count: articles.length })}
                  </p>
                </div>

                <button className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-medium">
                  <Filter className="w-4 h-4" />
                  {t('listing.filterByTopic')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article) => {
                  const style = themeStyles[article.theme] || {
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    gradient: 'from-slate-400 to-slate-600',
                  };

                  return (
                    <Link
                      key={article.slug}
                      href={`/guides/${article.slug}`}
                      className="group block"
                    >
                      <article className="bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-ocean transition-all duration-500 border border-slate-100 hover:border-ocean-200 h-full flex flex-col hover:-translate-y-1">
                        <div className="relative h-52 overflow-hidden">
                          <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient}`}>
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

                          <div className="absolute top-4 left-4">
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${style.bg} ${style.text} shadow-soft`}>
                              {getThemeLabel(article.theme)}
                            </span>
                          </div>

                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-xl text-xs font-bold text-slate-700 shadow-soft flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-ocean-500" />
                              AI
                            </span>
                          </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 text-slate-500 text-sm mb-3">
                            <div className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center">
                              <MapPin className="w-3 h-3" />
                            </div>
                            <span className="font-medium">{article.destinationName}, Croatia</span>
                          </div>

                          <h3 className="font-bold text-xl text-slate-900 mb-3 line-clamp-2 group-hover:text-ocean-600 transition-colors leading-snug">
                            {article.title}
                          </h3>

                          <p className="text-slate-600 text-sm line-clamp-2 mb-5 leading-relaxed flex-1">
                            {article.metaDescription}
                          </p>

                          <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">{t('detail.minRead', { count: 5 })}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sand-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-bold text-slate-700">{t('detail.rating')}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`h-1 bg-gradient-to-r ${style.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                      </article>
                    </Link>
                  );
                })}
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
      <section className="py-20 bg-gradient-ocean-subtle">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              {t('byDestination.title')}
            </h2>
            <p className="text-lg text-slate-600">
              {t('byDestination.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {DESTINATIONS.filter(d => d.popular).map(dest => (
              <Link
                key={dest.slug}
                href={`/destinations/${dest.slug}`}
                className="group flex flex-col items-center gap-3 px-4 py-5 bg-white rounded-2xl border-2 border-slate-100 hover:border-ocean-300 hover:shadow-soft transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-gradient-ocean-subtle rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-ocean-600" />
                </div>
                <span className="text-sm font-bold text-slate-700 group-hover:text-ocean-600 transition-colors text-center">
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
