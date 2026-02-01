import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { locales, localeFlags, type Locale } from '@/i18n/config';
import { shouldShowBookingWidget, features } from '@/config/features';
import ArticleSchema from '@/components/article/ArticleSchema';
import BookingWidget from '@/components/ui/BookingWidget';
import { MapPin, Clock, Calendar, ChevronRight, AlertTriangle, CheckCircle, Info, Sparkles, Award, Users, DollarSign, Sun, Shield, Star, List, Lightbulb } from 'lucide-react';
import QuickFactsCard from '@/components/ui/QuickFactsCard';
import ProConList from '@/components/ui/ProConList';
import ComparisonTable from '@/components/ui/ComparisonTable';

// AI Decision Article type
interface AIDecisionArticle {
  type: 'ai_decision';
  lang: string;
  slug: string;
  title: string;
  h1: string;
  summary: string;
  avoidSummary?: string;
  comparisonNote?: string;
  recommendations?: string[];
  bestForFamilies?: string[];
  avoid: string[];
  practicalNotes: string[];
  qa: { q: string; a: string }[];
  internalLinks: { label: string; href: string }[];
  monetizationAllowed: boolean;
  topicMeta: {
    destination: string;
    audience: string;
    intent: 'decision';
    seedQuery: string;
    theme?: string;
  };
}

type Props = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

// Load guide from JSON file
function getGuide(lang: string, slug: string): AIDecisionArticle | null {
  const filePath = path.join(process.cwd(), 'src', 'content', 'guides', lang, `${slug}.json`);

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error loading guide: ${filePath}`, error);
  }

  return null;
}

// Generate static params for all guides
export async function generateStaticParams() {
  const params: { slug: string }[] = [];
  const guidesDir = path.join(process.cwd(), 'src', 'content', 'guides');

  try {
    // Get slugs from the first available language directory
    for (const locale of locales) {
      const langDir = path.join(guidesDir, locale);
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
  const guide = getGuide(locale, slug);

  if (!guide) {
    return {
      title: 'Guide Not Found',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookiscout.com';
  const url = `${baseUrl}/${locale}/guides/${slug}`;

  return {
    title: guide.title,
    description: guide.summary,
    openGraph: {
      title: guide.title,
      description: guide.summary,
      url,
      type: 'article',
      siteName: 'BookiScout',
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Load guide
  const guide = getGuide(locale, slug);

  if (!guide) {
    notFound();
  }

  const t = await getTranslations('guides.detail');
  const tCommon = await getTranslations('common');

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookiscout.com';
  const url = `${baseUrl}/${locale}/guides/${slug}`;

  // Calculate reading time
  const wordCount = guide.summary.split(/\s+/).length +
    (guide.recommendations || guide.bestForFamilies || []).join(' ').split(/\s+/).length +
    guide.practicalNotes.join(' ').split(/\s+/).length;
  const readingTime = Math.max(2, Math.ceil(wordCount / 200));

  // Should show booking widget?
  const showBooking = shouldShowBookingWidget('guide') && guide.monetizationAllowed;

  // Get recommendation title based on audience
  const getRecommendationTitle = (audience: string): string => {
    const audienceKeyMap: Record<string, string> = {
      'families_kids_3_10': 'bestForFamilies',
      'families-with-toddlers': 'bestForFamilies',
      'families-with-teens': 'bestForFamilies',
      'solo-travel': 'bestForSolo',
      'seniors': 'bestForSeniors',
      'digital-nomads': 'bestForNomads',
      'lgbt-friendly': 'bestForLgbt',
      'first-time-visitors': 'bestForFirstTime',
      'couples': 'bestForCouples',
      'budget': 'bestBudget',
      'luxury': 'bestLuxury',
    };
    const key = audienceKeyMap[audience];
    if (key) {
      try {
        return t(`recommendations.${key}` as any);
      } catch {
        return t('recommendations.generic');
      }
    }
    return t('recommendations.generic');
  };

  // Get avoid title
  const getAvoidTitle = (audience: string, theme?: string): string => {
    if (theme?.includes('walkability') || theme?.includes('stroller')) {
      return t('avoid.accessibility');
    }
    if (theme?.includes('parking') || theme?.includes('car')) {
      return t('avoid.parking');
    }
    return t('avoid.title');
  };

  return (
    <>
      {/* Schema.org structured data */}
      <ArticleSchema
        title={guide.title}
        description={guide.summary}
        url={url}
        datePublished={new Date().toISOString()}
        dateModified={new Date().toISOString()}
        destination={guide.topicMeta.destination}
        faq={guide.qa.map(item => ({ question: item.q, answer: item.a }))}
      />

      {/* Breadcrumb */}
      <div className="bg-gradient-ocean-subtle border-b border-ocean-100">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-slate-600">
            <Link href="/" className="hover:text-ocean-600 transition-colors">{t('breadcrumb.home')}</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/guides" className="hover:text-ocean-600 transition-colors">{t('breadcrumb.guides')}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-semibold">{guide.topicMeta.destination}</span>
          </nav>
        </div>
      </div>

      {/* Article Header */}
      <header className="relative bg-gradient-to-br from-ocean-500 via-ocean-600 to-seafoam-600 text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-seafoam-300 rounded-full blur-3xl" />
        </div>

        <div className="container relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-6">
              <MapPin className="w-4 h-4" />
              {guide.topicMeta.destination} • {t('badge')}
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
              {guide.h1}
            </h1>

            <p className="text-xl md:text-2xl text-ocean-50 mb-8 leading-relaxed">
              {guide.summary}
            </p>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-ocean-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="font-medium">{t('minRead', { count: readingTime })}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-seafoam-500/90 backdrop-blur-sm rounded-xl">
                <Calendar className="w-4 h-4" />
                <span className="font-bold">Updated {new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold">{t('sidebar.aiPowered')}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                <Shield className="w-4 h-4" />
                <span className="font-bold">{t('sidebar.humanReviewed')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 text-white">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path
              d="M0,32 C240,48 480,48 720,32 C960,16 1200,16 1440,32 L1440,60 L0,60 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Guide Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Quick Answer Box */}
            <div className="relative bg-gradient-to-br from-ocean-50 to-cyan-50 border-2 border-ocean-200 p-8 rounded-3xl shadow-soft overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ocean-100 rounded-full blur-3xl opacity-50" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-ocean-500 rounded-xl flex items-center justify-center shadow-soft">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-ocean-900">{t('quickAnswer')}</h2>
                </div>
                <p className="text-lg text-slate-800 leading-relaxed">{guide.summary}</p>
              </div>
            </div>

            {/* Table of Contents */}
            <div className="bg-white rounded-3xl border-2 border-ocean-100 p-6 md:p-8 shadow-soft">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-ocean-500 rounded-xl flex items-center justify-center shadow-soft">
                  <List className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{t('tableOfContents')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a href="#quick-facts" className="flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-ocean-50 rounded-xl transition-colors group">
                  <CheckCircle className="w-4 h-4 text-ocean-500" />
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-ocean-600">{t('sections.quickFacts')}</span>
                </a>
                <a href="#pros-cons" className="flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-ocean-50 rounded-xl transition-colors group">
                  <CheckCircle className="w-4 h-4 text-ocean-500" />
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-ocean-600">{t('sections.prosCons')}</span>
                </a>
                {(guide.recommendations || guide.bestForFamilies || []).length > 0 && (
                  <a href="#recommendations" className="flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-ocean-50 rounded-xl transition-colors group">
                    <CheckCircle className="w-4 h-4 text-ocean-500" />
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-ocean-600">{getRecommendationTitle(guide.topicMeta.audience)}</span>
                  </a>
                )}
                <a href="#area-comparison" className="flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-ocean-50 rounded-xl transition-colors group">
                  <CheckCircle className="w-4 h-4 text-ocean-500" />
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-ocean-600">{t('sections.areaComparison')}</span>
                </a>
                {guide.practicalNotes.length > 0 && (
                  <a href="#practical-notes" className="flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-ocean-50 rounded-xl transition-colors group">
                    <CheckCircle className="w-4 h-4 text-ocean-500" />
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-ocean-600">{t('sections.practicalTips')}</span>
                  </a>
                )}
                {guide.qa.length > 0 && (
                  <a href="#faq" className="flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-ocean-50 rounded-xl transition-colors group">
                    <CheckCircle className="w-4 h-4 text-ocean-500" />
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-ocean-600">{t('sections.faq')}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Quick Facts */}
            <div id="quick-facts">
              <QuickFactsCard
                title={t('atAGlance')}
                facts={[
                  {
                    icon: <MapPin className="w-5 h-5" />,
                    label: "Location",
                    value: guide.topicMeta.destination,
                    color: "ocean"
                  },
                  {
                    icon: <Users className="w-5 h-5" />,
                    label: "Best For",
                    value: guide.topicMeta.audience || "All travelers",
                    color: "seafoam"
                  },
                  {
                    icon: <Sun className="w-5 h-5" />,
                    label: "Best Season",
                    value: "May - September",
                    color: "sand"
                  },
                  {
                    icon: <DollarSign className="w-5 h-5" />,
                    label: "Budget Level",
                    value: "Medium",
                    color: "coral"
                  }
                ]}
              />
            </div>

            {/* Pro/Con List */}
            {((guide.recommendations || guide.bestForFamilies || []).length > 0 || guide.avoid.length > 0) && (
              <div id="pros-cons">
                <ProConList
                  title={t('prosCons.title')}
                  pros={(guide.recommendations || guide.bestForFamilies || []).slice(0, 5)}
                  cons={guide.avoid.slice(0, 5)}
                  prosLabel={t('prosCons.advantages')}
                  consLabel={t('prosCons.disadvantages')}
                />
              </div>
            )}

            {/* Recommendations Section */}
            {(guide.recommendations || guide.bestForFamilies || []).length > 0 && (
              <section id="recommendations">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-seafoam-500 rounded-xl flex items-center justify-center shadow-soft">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    {getRecommendationTitle(guide.topicMeta.audience)}
                  </h2>
                </div>
                <ul className="space-y-4">
                  {(guide.recommendations || guide.bestForFamilies || []).map((item, index) => (
                    <li key={index} className="flex items-start gap-4 bg-seafoam-50 p-5 rounded-2xl border-2 border-seafoam-100 hover:border-seafoam-300 transition-colors">
                      <CheckCircle className="w-5 h-5 text-seafoam-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-800 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Areas to Avoid */}
            {guide.avoid.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-coral-500 rounded-xl flex items-center justify-center shadow-soft">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    {getAvoidTitle(guide.topicMeta.audience, guide.topicMeta.theme)}
                  </h2>
                </div>
                {guide.avoidSummary && (
                  <p className="text-slate-600 mb-5 text-lg italic">{guide.avoidSummary}</p>
                )}
                <ul className="space-y-4">
                  {guide.avoid.map((item, index) => (
                    <li key={index} className="flex items-start gap-4 bg-coral-50 p-5 rounded-2xl border-2 border-coral-100 hover:border-coral-300 transition-colors">
                      <AlertTriangle className="w-5 h-5 text-coral-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-800 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Practical Notes */}
            {guide.practicalNotes.length > 0 && (
              <section id="practical-notes">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-ocean-500 rounded-xl flex items-center justify-center shadow-soft">
                    <Info className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">{t('practicalNotes')}</h2>
                </div>
                <ul className="space-y-4">
                  {guide.practicalNotes.map((item, index) => (
                    <li key={index} className="flex items-start gap-4 bg-ocean-50 p-5 rounded-2xl border-2 border-ocean-100 hover:border-ocean-300 transition-colors">
                      <Info className="w-5 h-5 text-ocean-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-800 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Comparison Table */}
            <div id="area-comparison">
              <ComparisonTable
                title={t('sections.areaComparison')}
                headers={["Old Town", "City Center", "Beach Area"]}
                rows={[
                  { feature: "Family Friendly", values: [true, true, true] },
                  { feature: "Beach Access", values: [false, false, true] },
                  { feature: "Nightlife", values: [false, true, true] },
                  { feature: "Shopping", values: [true, true, false] },
                  { feature: "Price Range", values: ["€€€", "€€", "€€€"] },
                  { feature: "Parking", values: [false, true, true] },
                ]}
              />
            </div>

            {/* Key Takeaways */}
            <div className="bg-gradient-to-br from-sand-50 to-coral-50 rounded-3xl border-2 border-sand-200 p-8 md:p-10 shadow-soft">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-sand-400 to-coral-500 rounded-2xl flex items-center justify-center shadow-soft">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">{t('keyTakeaways')}</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-white/90 p-5 rounded-2xl border border-sand-100">
                  <div className="w-6 h-6 bg-seafoam-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {guide.summary}
                  </p>
                </div>
                {(guide.recommendations || guide.bestForFamilies || []).length > 0 && (
                  <div className="flex items-start gap-3 bg-white/90 p-5 rounded-2xl border border-sand-100">
                    <div className="w-6 h-6 bg-seafoam-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {(guide.recommendations || guide.bestForFamilies || [])[0]}
                    </p>
                  </div>
                )}
                {guide.practicalNotes.length > 0 && (
                  <div className="flex items-start gap-3 bg-white/90 p-5 rounded-2xl border border-sand-100">
                    <div className="w-6 h-6 bg-seafoam-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {guide.practicalNotes[0]}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Q&A Section */}
            {guide.qa.length > 0 && (
              <section id="faq" className="bg-gradient-to-br from-slate-50 to-ocean-50 p-8 md:p-10 rounded-3xl border-2 border-ocean-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-ocean rounded-2xl flex items-center justify-center shadow-ocean">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{t('faq.title')}</h2>
                    <p className="text-sm text-slate-600 mt-1">{t('faq.subtitle', { destination: guide.topicMeta.destination })}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {guide.qa.map((item, index) => (
                    <details
                      key={index}
                      className="group bg-white border-2 border-slate-100 rounded-2xl overflow-hidden hover:border-ocean-300 hover:shadow-soft transition-all"
                    >
                      <summary className="flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-gradient-ocean-subtle transition-all">
                        <span className="font-bold text-slate-900 pr-4 text-lg">{item.q}</span>
                        <div className="w-8 h-8 rounded-lg bg-ocean-100 group-hover:bg-ocean-500 flex items-center justify-center transition-all flex-shrink-0">
                          <ChevronRight className="w-5 h-5 text-ocean-600 group-hover:text-white transition-all group-open:rotate-90" />
                        </div>
                      </summary>
                      <div className="px-6 pb-5 text-slate-700 leading-relaxed border-t-2 border-slate-100 bg-gradient-to-br from-white to-slate-50">
                        <p className="pt-5 text-base">{item.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Booking Widget */}
              {showBooking && (
                <BookingWidget
                  destination={guide.topicMeta.destination}
                  destinationSlug={guide.slug}
                />
              )}

              {/* Language Switcher */}
              <div className="bg-white rounded-2xl border-2 border-slate-100 p-6 shadow-soft">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-ocean-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-ocean-600" />
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
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900">{t('sidebar.trustedGuide')}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-seafoam-600 flex-shrink-0" />
                    <span className="text-slate-700">{t('sidebar.aiPowered')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-seafoam-600 flex-shrink-0" />
                    <span className="text-slate-700">{t('sidebar.humanReviewed')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-seafoam-600 flex-shrink-0" />
                    <span className="text-slate-700">{t('sidebar.regularlyUpdated')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-sand-600 fill-sand-600 flex-shrink-0" />
                    <span className="text-slate-700 font-semibold">{t('rating')}/5 Rating</span>
                  </div>
                </div>
              </div>

              {/* More Guides */}
              <div className="bg-gradient-to-br from-seafoam-50 to-ocean-50 rounded-2xl border-2 border-seafoam-100 p-6 shadow-soft">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-seafoam-600" />
                  {t('sidebar.moreAbout', { destination: guide.topicMeta.destination })}
                </h3>
                <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                  {t('sidebar.exploreOther', { destination: guide.topicMeta.destination })}
                </p>
                <Link
                  href={`/destinations/${guide.slug.split('-')[0]}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gradient-ocean hover:text-white rounded-xl font-semibold text-sm text-ocean-600 transition-all shadow-soft hover:shadow-ocean"
                >
                  {t('sidebar.viewAllGuides')}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
