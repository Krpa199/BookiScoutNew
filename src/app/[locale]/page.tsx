import { Sparkles, MapPin, ArrowRight, Award, Users, Shield, CheckCircle, HelpCircle, Clock, Car, Search } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import DestinationCard from '@/components/ui/DestinationCard';
import { getDestinationImage } from '@/config/images';
import { DESTINATIONS } from '@/config/destinations';
import fs from 'fs';
import path from 'path';
import Image from 'next/image';
import { ADVENT_DESTINATIONS, isAdventSeason } from '@/lib/seasonal';
import { localeAlternates } from '@/lib/urls';
import type { Metadata } from 'next';

export const revalidate = false; // fully static - rebuilt only via CI/CD

// Helper to get article image from JSON file
function getArticleImage(locale: string, destination: string, theme: string): string | undefined {
  return getArticleData(locale, destination, theme)?.imageUrl;
}

// Load a translated article's title + meta + image directly from its JSON file,
// falling back to English if the locale-specific file is missing.
function getArticleData(
  locale: string,
  destination: string,
  theme: string,
): { title?: string; metaDescription?: string; imageUrl?: string } | undefined {
  try {
    const filePath = path.join(process.cwd(), 'src', 'content', 'articles', locale, `${destination}-${theme}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    const enPath = path.join(process.cwd(), 'src', 'content', 'articles', 'en', `${destination}-${theme}.json`);
    if (fs.existsSync(enPath)) {
      return JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    }
  } catch {
    // Ignore errors
  }
  return undefined;
}

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localeAlternates(locale, '') };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');

  const popularDestinations = DESTINATIONS.filter(d => d.popular).slice(0, 6);

  // AI Decision-focused featured guides.
  // Title + description come from the article's localized JSON so each locale
  // sees its own language (previously hardcoded English on every locale).
  const splitSolo = getArticleData(locale, 'split', 'solo-travel');
  const dubrovnikCar = getArticleData(locale, 'dubrovnik', 'car-vs-no-car');
  const dubrovnikFirst = getArticleData(locale, 'dubrovnik', 'first-time-visitors');

  const featuredArticles = [
    {
      title: splitSolo?.title ?? 'Is Split Good for Solo Travelers?',
      description: splitSolo?.metaDescription ?? 'Find out if Split is the right choice for independent travelers: safety, walkability, social scene, and practical tips.',
      destination: 'split',
      destinationName: 'Split',
      theme: 'solo-travel',
      language: locale,
      image: splitSolo?.imageUrl,
    },
    {
      title: dubrovnikCar?.title ?? 'Do You Need a Car in Dubrovnik?',
      description: dubrovnikCar?.metaDescription ?? 'Complete breakdown of getting around Dubrovnik: when a car helps, when it\'s a burden, and the best alternatives.',
      destination: 'dubrovnik',
      destinationName: 'Dubrovnik',
      theme: 'car-vs-no-car',
      language: locale,
      image: dubrovnikCar?.imageUrl,
    },
    {
      title: dubrovnikFirst?.title ?? 'Dubrovnik First-Timer\'s Guide',
      description: dubrovnikFirst?.metaDescription ?? 'Essential tips for your first visit: top attractions, costs, where to stay, and insider knowledge for an amazing trip.',
      destination: 'dubrovnik',
      destinationName: 'Dubrovnik',
      theme: 'first-time-visitors',
      language: locale,
      image: dubrovnikFirst?.imageUrl,
    },
  ];

  // Seasonal Advent block (Oct–early Jan): one card per Advent guide that exists
  // in this locale. Gives the new guides a homepage link for fast crawling.
  const adventGuides = isAdventSeason()
    ? ADVENT_DESTINATIONS.flatMap(slug => {
        const data = getArticleData(locale, slug, 'advent');
        const name = DESTINATIONS.find(d => d.slug === slug)?.name ?? slug;
        return data?.title ? [{ slug, name, title: data.title, image: data.imageUrl }] : [];
      })
    : [];

  // AI Decision Quick Answers
  const quickAnswers = [
    {
      question: t('quickAnswers.q1.question'),
      answer: t('quickAnswers.q1.answer'),
      icon: Shield,
    },
    {
      question: t('quickAnswers.q2.question'),
      answer: t('quickAnswers.q2.answer'),
      icon: Car,
    },
    {
      question: t('quickAnswers.q3.question'),
      answer: t('quickAnswers.q3.answer'),
      icon: Clock,
    },
  ];

  const features = [
    {
      icon: HelpCircle,
      title: t('features.decisionFirst.title'),
      description: t('features.decisionFirst.description'),
      color: 'ocean',
    },
    {
      icon: CheckCircle,
      title: t('features.aiVerified.title'),
      description: t('features.aiVerified.description'),
      color: 'seafoam',
    },
    {
      icon: Users,
      title: t('features.travelerFocused.title'),
      description: t('features.travelerFocused.description'),
      color: 'coral',
    },
    {
      icon: Award,
      title: t('features.noBias.title'),
      description: t('features.noBias.description'),
      color: 'sand',
    },
  ];

  // Hero mosaic: four signature destinations
  const mosaic = ['dubrovnik', 'split', 'rovinj', 'zadar'].map(slug => ({
    slug,
    name: DESTINATIONS.find(d => d.slug === slug)?.name ?? slug,
    image: getDestinationImage(slug),
  }));

  const card = 'rounded-2xl bg-white shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.12)] ring-1 ring-ocean-900/[0.06]';

  return (
    <>
      {/* Hero — same deep-Adriatic language as the guides */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-700 pt-12 pb-24 md:pt-20 md:pb-32 text-white">
        <div className="pointer-events-none absolute -top-32 right-[-10%] h-[30rem] w-[30rem] rounded-full bg-sand-300/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 left-[-10%] h-80 w-80 rounded-full bg-seafoam-400/15 blur-3xl" aria-hidden="true" />

        <div className="relative container">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-10 lg:gap-14 items-center">
            <div>
              <h1 className="font-display text-[2.6rem] sm:text-6xl lg:text-[4.2rem] font-semibold leading-[1.02] tracking-tight text-white">
                {t('hero.headline')}{' '}
                <span className="text-sand-200">{t('hero.headlinePart2')}</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-ocean-50/80 leading-relaxed max-w-xl">
                {t('hero.subheadline')}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/stay-check"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-coral-500 to-sand-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-coral-900/20 transition hover:brightness-105"
                >
                  <Search className="w-5 h-5" />
                  {t('hero.stayCheckTitle')}
                </Link>
                <Link
                  href="/guides"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-3.5 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/15"
                >
                  {t('hero.browseGuides')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <p className="mt-3 text-sm text-ocean-100/60">{t('hero.stayCheckSubtitle')}</p>
            </div>

            {/* Photo mosaic */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {mosaic.map((m, i) => (
                <Link
                  key={m.slug}
                  href={`/destinations/${m.slug}`}
                  className={`group relative overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-xl shadow-ocean-900/30 ${i % 2 === 1 ? 'translate-y-6' : ''} ${i > 1 ? 'hidden sm:block' : ''}`}
                >
                  <div className="relative aspect-[4/5]">
                    <Image src={m.image.url} alt={m.image.alt} fill priority={i < 2} className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 50vw, 280px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/70 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-4 font-display text-xl font-semibold text-white">{m.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <svg className="absolute bottom-0 left-0 h-8 w-full text-[#e8f2f9] md:h-12" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0,32 C240,58 480,58 720,34 C960,10 1200,10 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </section>

      <div className="bg-[#e8f2f9]">
        {/* Seasonal: Advent in Croatia */}
        {adventGuides.length > 0 && (
          <section className="pt-12 pb-16 md:pt-16 md:pb-20">
            <div className="container">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-coral-600">🎄 {t('advent.badge')}</p>
                  <h2 className="mt-2 font-display text-3xl md:text-[2.6rem] font-semibold tracking-tight text-ocean-900">{t('advent.title')}</h2>
                  <p className="mt-2 text-base md:text-lg text-slate-600 max-w-2xl">{t('advent.subtitle')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {adventGuides.map(guide => (
                  <Link key={guide.slug} href={`/guides/${guide.slug}-advent`} className={`group block overflow-hidden ${card}`}>
                    <div className="relative aspect-[4/3] bg-ocean-100">
                      {guide.image && (
                        <Image src={guide.image} alt={guide.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                      )}
                    </div>
                    <div className="p-3 md:p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-coral-600">{guide.name}</p>
                      <p className="mt-1 text-sm md:text-base font-semibold leading-snug text-ocean-900 line-clamp-2 group-hover:text-ocean-700">{guide.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Quick answers */}
        <section className="pb-16 md:pb-20">
          <div className="container">
            <p className="text-xs font-bold uppercase tracking-wider text-ocean-700">{t('quickAnswers.badge')}</p>
            <h2 className="mt-2 font-display text-3xl md:text-[2.6rem] font-semibold tracking-tight text-ocean-900 mb-8">{t('quickAnswers.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {quickAnswers.map((qa, index) => {
                const Icon = qa.icon;
                return (
                  <div key={index} className={`p-5 md:p-6 ${card}`}>
                    <Icon className="w-5 h-5 text-coral-500" aria-hidden="true" />
                    <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-ocean-900">{qa.question}</h3>
                    <p className="mt-2 text-[15px] md:text-base leading-relaxed text-slate-700">{qa.answer}</p>
                  </div>
                );
              })}
            </div>
            <Link href="/guides" className="mt-6 inline-flex items-center gap-2 font-semibold text-ocean-700 hover:text-ocean-800">
              {t('quickAnswers.seeAll')} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Destinations */}
        <section className="pb-16 md:pb-20">
          <div className="container">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ocean-700">{t('destinations.badge')}</p>
                <h2 className="mt-2 font-display text-3xl md:text-[2.6rem] font-semibold tracking-tight text-ocean-900">{t('destinations.title')}</h2>
                <p className="mt-2 text-base md:text-lg text-slate-600">{t('destinations.subtitle')}</p>
              </div>
              <Link href="/destinations" className="inline-flex items-center gap-2 font-semibold text-ocean-700 hover:text-ocean-800">
                {t('destinations.viewAll')} <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {popularDestinations.map(destination => (
                <DestinationCard key={destination.slug} destination={destination} />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Featured guides */}
      <section className="bg-white border-t border-ocean-100 pt-14 pb-20 md:pt-20 md:pb-24">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ocean-700">{t('guides.badge')}</p>
              <h2 className="mt-2 font-display text-3xl md:text-[2.6rem] font-semibold tracking-tight text-ocean-900">{t('guides.title')}</h2>
              <p className="mt-2 text-base md:text-lg text-slate-600">{t('guides.subtitle')}</p>
            </div>
            <Link href="/guides" className="inline-flex items-center gap-2 font-semibold text-ocean-700 hover:text-ocean-800">
              {t('guides.viewAll')} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredArticles.map(article => (
              <Link key={article.theme + article.destination} href={`/guides/${article.destination}-${article.theme}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ocean-100">
                  {article.image && (
                    <Image src={article.image} alt={article.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 400px" />
                  )}
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-ocean-700">{article.destinationName}</p>
                <h3 className="mt-1 font-display text-xl font-semibold leading-snug text-ocean-900 group-hover:text-ocean-700">{article.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600 line-clamp-2">{article.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
