import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { MapPin, ChevronRight, Compass, Utensils, Home, Sun, Map, ArrowDown, Info, Calendar, Users, Sparkles, TrendingUp, Waves, Palmtree, DollarSign, Star, CheckCircle, Shield } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { DESTINATIONS, THEMES, ALL_THEMES, Theme } from '@/config/destinations';
import BookingWidget from '@/components/ui/BookingWidget';
import { getDestinationImage } from '@/config/images';
import QuickFactsCard from '@/components/ui/QuickFactsCard';
import DestinationSchema from '@/components/schema/DestinationSchema';
import { SITE_URL, localizedUrl, localeAlternates } from '@/lib/urls';
import DestinationHub, { type DestinationHubContent } from '@/components/destination/DestinationHub';
import DestinationCard from '@/components/ui/DestinationCard';
import Image from 'next/image';

// Check if stay-check area data exists for this destination
function hasStayCheckData(slug: string): boolean {
  const filePath = path.join(process.cwd(), 'src', 'content', 'stay-check', 'en', `${slug}.json`);
  return fs.existsSync(filePath);
}

// Destinations are a small fixed set (~30), so we still prerender them all at build time.
// Keep ISR-style settings consistent with [[isr-refactor-todo]] anyway.
export const revalidate = false;
export const dynamicParams = true; // allow on-demand if a new destination is added

type Props = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

// Theme icons and labels - Ocean themed with gradients
const THEME_INFO: Partial<Record<Theme, { icon: React.ReactNode; gradient: string }>> = {
  'solo-travel': { icon: <Users className="w-5 h-5" />, gradient: 'from-violet-400 to-violet-600' },
  'seniors': { icon: <Users className="w-5 h-5" />, gradient: 'from-amber-400 to-amber-600' },
  'digital-nomads': { icon: <Compass className="w-5 h-5" />, gradient: 'from-cyan-400 to-cyan-600' },
  'lgbt-friendly': { icon: <Users className="w-5 h-5" />, gradient: 'from-pink-400 to-pink-600' },
  'families-with-toddlers': { icon: <Users className="w-5 h-5" />, gradient: 'from-seafoam-400 to-seafoam-600' },
  'families-with-teens': { icon: <Users className="w-5 h-5" />, gradient: 'from-teal-400 to-teal-600' },
  'first-time-visitors': { icon: <Sparkles className="w-5 h-5" />, gradient: 'from-ocean-400 to-ocean-600' },
  'couples': { icon: <Sun className="w-5 h-5" />, gradient: 'from-coral-400 to-coral-600' },
  'car-vs-no-car': { icon: <Map className="w-5 h-5" />, gradient: 'from-slate-400 to-slate-600' },
  'parking-difficulty': { icon: <Map className="w-5 h-5" />, gradient: 'from-gray-400 to-gray-600' },
  'walkability': { icon: <Map className="w-5 h-5" />, gradient: 'from-green-400 to-green-600' },
  'stroller-friendly': { icon: <Users className="w-5 h-5" />, gradient: 'from-seafoam-400 to-seafoam-600' },
  'wheelchair-access': { icon: <Users className="w-5 h-5" />, gradient: 'from-blue-400 to-blue-600' },
  'public-transport-quality': { icon: <Map className="w-5 h-5" />, gradient: 'from-indigo-400 to-indigo-600' },
  'ferry-connections': { icon: <Map className="w-5 h-5" />, gradient: 'from-ocean-400 to-ocean-600' },
  'airport-access': { icon: <Map className="w-5 h-5" />, gradient: 'from-sky-400 to-sky-600' },
  'wifi-quality': { icon: <Compass className="w-5 h-5" />, gradient: 'from-cyan-400 to-cyan-600' },
  'mobile-coverage': { icon: <Info className="w-5 h-5" />, gradient: 'from-purple-400 to-purple-600' },
  'off-season': { icon: <Calendar className="w-5 h-5" />, gradient: 'from-slate-400 to-slate-600' },
  'shoulder-season': { icon: <Calendar className="w-5 h-5" />, gradient: 'from-amber-400 to-amber-600' },
  'peak-season': { icon: <Calendar className="w-5 h-5" />, gradient: 'from-coral-400 to-coral-600' },
  'weather-by-month': { icon: <Sun className="w-5 h-5" />, gradient: 'from-yellow-400 to-yellow-600' },
  'crowds-by-month': { icon: <Users className="w-5 h-5" />, gradient: 'from-red-400 to-red-600' },
  'best-time-to-visit': { icon: <Calendar className="w-5 h-5" />, gradient: 'from-sky-400 to-sky-600' },
  'vs-dubrovnik': { icon: <TrendingUp className="w-5 h-5" />, gradient: 'from-orange-400 to-orange-600' },
  'vs-split': { icon: <TrendingUp className="w-5 h-5" />, gradient: 'from-ocean-400 to-ocean-600' },
  'vs-zadar': { icon: <TrendingUp className="w-5 h-5" />, gradient: 'from-teal-400 to-teal-600' },
  'vs-istria': { icon: <TrendingUp className="w-5 h-5" />, gradient: 'from-green-400 to-green-600' },
  'vs-zagreb': { icon: <TrendingUp className="w-5 h-5" />, gradient: 'from-purple-400 to-purple-600' },
  'coast-vs-inland': { icon: <TrendingUp className="w-5 h-5" />, gradient: 'from-emerald-400 to-emerald-600' },
  'apartments': { icon: <Home className="w-5 h-5" />, gradient: 'from-ocean-400 to-ocean-600' },
  'family': { icon: <Users className="w-5 h-5" />, gradient: 'from-seafoam-400 to-seafoam-600' },
  'budget': { icon: <Home className="w-5 h-5" />, gradient: 'from-sand-400 to-sand-600' },
  'luxury': { icon: <Home className="w-5 h-5" />, gradient: 'from-purple-400 to-purple-600' },
  'beach': { icon: <Sun className="w-5 h-5" />, gradient: 'from-cyan-400 to-cyan-600' },
  'pet-friendly': { icon: <Home className="w-5 h-5" />, gradient: 'from-green-400 to-green-600' },
  'pool': { icon: <Home className="w-5 h-5" />, gradient: 'from-blue-400 to-blue-600' },
  'parking': { icon: <Map className="w-5 h-5" />, gradient: 'from-slate-400 to-slate-600' },
  'restaurants': { icon: <Utensils className="w-5 h-5" />, gradient: 'from-red-400 to-red-600' },
  'nightlife': { icon: <Compass className="w-5 h-5" />, gradient: 'from-violet-400 to-violet-600' },
  'things-to-do': { icon: <Compass className="w-5 h-5" />, gradient: 'from-indigo-400 to-indigo-600' },
  'day-trips': { icon: <Map className="w-5 h-5" />, gradient: 'from-teal-400 to-teal-600' },
  'weather': { icon: <Sun className="w-5 h-5" />, gradient: 'from-amber-400 to-amber-600' },
  'prices': { icon: <Info className="w-5 h-5" />, gradient: 'from-emerald-400 to-emerald-600' },
  'transport': { icon: <Map className="w-5 h-5" />, gradient: 'from-blue-400 to-blue-600' },
  'hidden-gems': { icon: <Compass className="w-5 h-5" />, gradient: 'from-pink-400 to-pink-600' },
  'local-food': { icon: <Utensils className="w-5 h-5" />, gradient: 'from-orange-400 to-orange-600' },
  'safety': { icon: <Info className="w-5 h-5" />, gradient: 'from-rose-400 to-rose-600' },
  'advent': { icon: <Sparkles className="w-5 h-5" />, gradient: 'from-red-400 to-red-600' },
};

// Rich hub content (src/content/destinations/<locale>/<slug>.json, from
// scripts/generate-destination-hubs.ts). Destinations without it keep the old template.
function getHub(locale: string, slug: string): DestinationHubContent | null {
  const file = path.join(process.cwd(), 'src', 'content', 'destinations', locale, `${slug}.json`);
  try {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : null;
  } catch {
    return null;
  }
}

// Guides that exist in this locale, with their localized titles as link text
function getLocalizedGuides(locale: string, slug: string): { theme: string; title: string; imageUrl?: string }[] {
  const dir = path.join(process.cwd(), 'src', 'content', 'articles', locale);
  const out: { theme: string; title: string; imageUrl?: string }[] = [];
  for (const theme of ALL_THEMES) {
    const file = path.join(dir, `${slug}-${theme}.json`);
    if (!fs.existsSync(file)) continue;
    try {
      const a = JSON.parse(fs.readFileSync(file, 'utf-8'));
      out.push({ theme, title: a.title || theme, imageUrl: a.imageUrl });
    } catch {
      /* skip unreadable */
    }
  }
  return out;
}

// Check which articles exist for a destination
function getAvailableGuides(destinationSlug: string): Theme[] {
  const articlesDir = path.join(process.cwd(), 'src', 'content', 'articles', 'en');
  const available: Theme[] = [];

  try {
    if (fs.existsSync(articlesDir)) {
      for (const theme of THEMES) {
        const filePath = path.join(articlesDir, `${destinationSlug}-${theme}.json`);
        if (fs.existsSync(filePath)) {
          available.push(theme);
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist
  }

  return available;
}

// Generate static params for all destinations
export async function generateStaticParams() {
  const params: { slug: string }[] = [];
  for (const dest of DESTINATIONS) {
    params.push({ slug: dest.slug });
  }
  return params;
}

// Generate metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const destination = DESTINATIONS.find(d => d.slug === slug);
  const t = await getTranslations({ locale, namespace: 'destinationDetail' });

  if (!destination) {
    return { title: 'Destination Not Found' };
  }

  const hub = getHub(locale, slug);

  return {
    title: hub?.title ?? `${destination.name} Travel Guide 2026`,
    description: hub?.metaDescription ?? t('guides.subtitle'),
    alternates: localeAlternates(locale, `/destinations/${slug}`),
  };
}

export default async function DestinationPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const destination = DESTINATIONS.find(d => d.slug === slug);

  if (!destination) {
    notFound();
  }

  const t = await getTranslations('destinationDetail');
  const tRegions = await getTranslations('regions');
  const tThemes = await getTranslations('guides.themes');

  const availableGuides = getAvailableGuides(slug);
  const hub = getHub(locale, slug);
  const hubGuides = hub ? getLocalizedGuides(locale, slug) : [];
  // Round inset photo in the hero: a beach / things-to-do guide cover if we have one
  const heroInset = ['beach', 'things-to-do', 'hidden-gems', 'day-trips']
    .map(theme => hubGuides.find(g => g.theme === theme)?.imageUrl)
    .find(Boolean);
  const nearbyDestinations = DESTINATIONS
    .filter(d => d.region === destination.region && d.slug !== slug)
    .slice(0, 6);

  const destinationImage = getDestinationImage(slug);

  // Get region name with translation
  const regionTranslationKey = destination.region.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const regionName = (() => {
    try {
      return tRegions(regionTranslationKey as any);
    } catch {
      return destination.region.replace('-', ' ');
    }
  })();

  // Get theme labels
  const getThemeLabel = (theme: Theme): string => {
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
      'families-with-toddlers': 'familiesWithToddlers',
      'families-with-teens': 'familiesWithTeens',
      'first-time-visitors': 'firstTimeVisitors',
      'car-vs-no-car': 'carVsNoCar',
      'best-time-to-visit': 'bestTimeToVisit',
      'walkability': 'walkability',
      'solo-travel': 'soloTravel',
      'seniors': 'seniors',
      'digital-nomads': 'digitalNomads',
      'lgbt-friendly': 'lgbtFriendly',
      'parking-difficulty': 'parkingDifficulty',
      'stroller-friendly': 'strollerFriendly',
      'wheelchair-access': 'wheelchairAccess',
      'public-transport-quality': 'publicTransport',
      'ferry-connections': 'ferryConnections',
      'airport-access': 'airportAccess',
      'wifi-quality': 'wifiQuality',
      'mobile-coverage': 'mobileCoverage',
      'off-season': 'offSeason',
      'shoulder-season': 'shoulderSeason',
      'peak-season': 'peakSeason',
      'weather-by-month': 'weatherByMonth',
      'crowds-by-month': 'crowdsByMonth',
    };
    const key = themeKeyMap[theme];
    if (key) {
      try {
        return tThemes(key as any);
      } catch {
        return theme.split('-').map(word => {
          if (word === 'vs') return 'vs';
          return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
      }
    }
    return theme.split('-').map(word => {
      if (word === 'vs') return 'vs';
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  const pageUrl = localizedUrl(locale, `/destinations/${slug}`);

  return (
    <>
      {/* Schema.org TouristDestination */}
      <DestinationSchema
        destination={destination}
        description={hub?.metaDescription ?? t('guides.subtitle')}
        regionName={regionName}
        url={pageUrl}
        imageUrl={destinationImage.url.startsWith('http') ? destinationImage.url : `${SITE_URL}${destinationImage.url}`}
      />

      {/* Hero — same deep-Adriatic language as the guides */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-700 pt-6 md:pt-8 pb-16 md:pb-24 text-white">
        <div className="pointer-events-none absolute -top-32 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-sand-300/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 left-[-10%] h-72 w-72 rounded-full bg-seafoam-400/15 blur-3xl" aria-hidden="true" />
        <div className="relative container">
          <nav className="flex items-center gap-2 text-sm text-ocean-100/60" aria-label="Breadcrumb">
            <Link href="/" className="text-ocean-100/80 hover:text-white">{t('breadcrumb.home')}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/destinations" className="text-ocean-100/80 hover:text-white">{t('breadcrumb.destinations')}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-medium text-sand-200">{destination.name}</span>
          </nav>

          <div className="mt-6 md:mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-8 lg:gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sand-200 ring-1 ring-white/15">
                <MapPin className="w-3.5 h-3.5" />
                {regionName}
              </span>
              <h1 className="mt-4 font-display text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1] tracking-tight text-white">
                {destination.name}
              </h1>
              <p className="mt-5 text-lg md:text-xl text-ocean-50/80 leading-relaxed max-w-xl">
                {hub ? hub.metaDescription : t('guides.subtitle')}
              </p>
              {hub && (
                <dl className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-2xl">
                  {hub.quickFacts.slice(0, 3).map(f => (
                    <div key={f.label} className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm">
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-sand-200/90">{f.label}</dt>
                      <dd className="mt-0.5 text-sm font-semibold leading-snug text-white">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link
                  href="#guides"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-ocean-900 transition hover:bg-ocean-50"
                >
                  {t('cta.exploreGuides')}
                  <ArrowDown className="w-4 h-4" />
                </Link>
                {hub && (
                  <Link
                    href="#where-to-stay"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-coral-500 to-sand-500 px-6 py-3 font-semibold text-white shadow-lg shadow-coral-900/20 transition hover:brightness-105"
                  >
                    {hub.headings.whereToStay}
                  </Link>
                )}
                {hasStayCheckData(slug) && (
                  <Link
                    href={`/stay-check/${slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/15"
                  >
                    {t('areaReview.title', { destination: destination.name })}
                  </Link>
                )}
              </div>
            </div>
            {/* Arched photo (Mediterranean window) with sun-gold frame, a floating
                fact card and a round inset photo from one of the guides */}
            <div className="relative mx-auto w-full max-w-[30rem] pb-6 pr-6 lg:ml-auto lg:mr-0">
              <div className="absolute inset-0 translate-x-5 translate-y-5 rounded-t-[999px] rounded-b-[2rem] border-2 border-sand-300/50" aria-hidden="true" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[2rem] bg-white/5 shadow-2xl shadow-ocean-900/50 ring-1 ring-white/10">
                <Image
                  src={destinationImage.url}
                  alt={destinationImage.alt}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 480px"
                />
              </div>

              {heroInset && (
                <div className="absolute -right-1 top-[18%] h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full shadow-xl ring-4 ring-ocean-800">
                  <Image src={heroInset} alt="" fill className="object-cover" sizes="112px" />
                </div>
              )}

              {hub && hub.quickFacts[3] && (
                <div className="absolute -left-4 bottom-12 sm:-left-8 max-w-[15rem] rounded-2xl bg-white/95 px-4 py-3 text-ocean-900 shadow-xl backdrop-blur">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-coral-600">
                    <Waves className="w-3.5 h-3.5" /> {hub.quickFacts[3].label}
                  </p>
                  <p className="mt-0.5 font-display text-xl font-semibold leading-tight">{hub.quickFacts[3].value}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <svg className="absolute bottom-0 left-0 h-6 w-full text-[#e8f2f9] md:h-10" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0,32 C240,58 480,58 720,34 C960,10 1200,10 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </section>

      {/* Main Content */}
      <div className="bg-[#e8f2f9] pt-10 pb-20 md:pt-14 md:pb-24">
        <div className="container">
          {hub && (
            <div className="mt-6 md:mt-0">
              <DestinationHub hub={hub} slug={slug} guides={hubGuides} />
            </div>
          )}

          {!hub && (<>
          {/* Quick Facts */}
          <div className="mb-10 md:mb-16 mt-6 md:mt-0">
            <QuickFactsCard
              title={t('atAGlance', { destination: destination.name })}
              facts={[
                {
                  icon: <MapPin className="w-5 h-5" />,
                  label: t('facts.region'),
                  value: regionName,
                  color: "ocean"
                },
                {
                  icon: destination.type === 'island' ? <Waves className="w-5 h-5" /> : <Palmtree className="w-5 h-5" />,
                  label: t('facts.type'),
                  value: destination.type.replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                  color: "seafoam"
                },
                {
                  icon: <Sun className="w-5 h-5" />,
                  label: t('facts.bestSeason'),
                  value: t('facts.maySeptember'),
                  color: "sand"
                },
                {
                  icon: <Users className="w-5 h-5" />,
                  label: t('facts.idealFor'),
                  value: destination.popular ? t('facts.allTravelers') : t('facts.explorers'),
                  color: "coral"
                },
                {
                  icon: <DollarSign className="w-5 h-5" />,
                  label: t('facts.priceLevel'),
                  value: destination.popular ? t('facts.mediumHigh') : t('facts.medium'),
                  color: "ocean"
                },
                {
                  icon: <Star className="w-5 h-5" />,
                  label: t('facts.popularity'),
                  value: destination.popular ? t('facts.topDestination') : t('facts.hiddenGem'),
                  color: "seafoam"
                },
              ]}
            />
          </div>

          {/* Why Visit */}
          <div className="bg-gradient-to-br from-ocean-50 to-seafoam-50 rounded-2xl md:rounded-3xl border-2 border-ocean-100 p-5 sm:p-6 md:p-8 lg:p-10 mb-10 md:mb-16 shadow-soft">
            <div className="flex items-center gap-2 sm:gap-3 mb-5 md:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-ocean rounded-xl sm:rounded-2xl flex items-center justify-center shadow-ocean">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">{t('whyVisit.title', { destination: destination.name })}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="flex items-start gap-2 sm:gap-3 bg-white/80 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-seafoam-100">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-seafoam-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1 text-sm sm:text-base">{t('whyVisit.authentic.title')}</h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{t('whyVisit.authentic.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3 bg-white/80 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-seafoam-100">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-seafoam-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1 text-sm sm:text-base">{t('whyVisit.waters.title')}</h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{t('whyVisit.waters.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3 bg-white/80 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-seafoam-100">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-seafoam-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1 text-sm sm:text-base">{t('whyVisit.history.title')}</h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{t('whyVisit.history.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3 bg-white/80 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-seafoam-100">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-seafoam-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1 text-sm sm:text-base">{t('whyVisit.value.title')}</h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{t('whyVisit.value.description')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Travel Guides */}
          <div id="guides" className="scroll-mt-20">
            <div className="text-center mb-8 md:mb-12 lg:mb-16">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-ocean-100 text-ocean-700 rounded-full text-xs sm:text-sm font-semibold mb-4 md:mb-6">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{t('guides.badge')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 md:mb-5">
                {t('guides.title', { destination: destination.name })}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                {t('guides.subtitle')}
              </p>
            </div>

            {availableGuides.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-10 md:mb-16">
                {/* Stay Check Area Review - prominent card if data exists */}
                {hasStayCheckData(slug) && (
                  <Link
                    href={`/stay-check/${slug}`}
                    className="group bg-gradient-to-br from-ocean-50 to-seafoam-50 rounded-2xl md:rounded-3xl border-2 border-ocean-200 hover:border-ocean-400 hover:shadow-ocean transition-all p-4 sm:p-5 md:p-6 hover:-translate-y-1 sm:col-span-2 lg:col-span-3"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-ocean-400 to-seafoam-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-soft group-hover:scale-110 transition-transform flex-shrink-0">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 mb-1 text-sm sm:text-base md:text-lg group-hover:text-ocean-600 transition-colors">
                          {t('areaReview.title', { destination: destination.name })}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500">
                          {t('areaReview.subtitle')}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-ocean-400 group-hover:text-ocean-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </Link>
                )}
                {availableGuides.map(theme => (
                  <Link
                    key={theme}
                    href={`/guides/${slug}-${theme}`}
                    className="group bg-white rounded-2xl md:rounded-3xl border-2 border-slate-100 hover:border-ocean-300 hover:shadow-ocean transition-all p-4 sm:p-5 md:p-6 hover:-translate-y-1"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br ${THEME_INFO[theme]?.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-soft group-hover:scale-110 transition-transform flex-shrink-0`}>
                        {THEME_INFO[theme]?.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 mb-1 sm:mb-2 text-sm sm:text-base md:text-lg group-hover:text-ocean-600 transition-colors">
                          {getThemeLabel(theme)}
                        </h3>
                      </div>
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-ocean-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-10 md:mb-16">
                {[
                  'families-with-toddlers',
                  'first-time-visitors',
                  'car-vs-no-car',
                  'best-time-to-visit',
                  'walkability',
                  'solo-travel',
                ].map((theme) => (
                  <div
                    key={theme}
                    className="bg-white/70 rounded-2xl md:rounded-3xl border-2 border-slate-200 p-4 sm:p-5 md:p-6 relative overflow-hidden"
                  >
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                      <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-ocean-100 text-ocean-700 text-[10px] sm:text-xs font-bold rounded-full">
                        <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {t('guides.comingSoon')}
                      </span>
                    </div>
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-slate-200 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400">
                        {THEME_INFO[theme as Theme]?.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-700 mb-1 sm:mb-2 text-sm sm:text-base md:text-lg">
                          {getThemeLabel(theme as Theme)}
                        </h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
          </>)}

          <div>
            {/* Nearby Destinations */}
            {nearbyDestinations.length > 0 && (
              <section className="mt-16 md:mt-20">
                <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-ocean-900">{t('nearby.title')}</h2>
                <p className="mt-2 text-base md:text-lg text-slate-600">{t('nearby.subtitle', { region: regionName })}</p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {nearbyDestinations.map(dest => (
                    <DestinationCard key={dest.slug} destination={dest} />
                  ))}
                </div>
              </section>
            )}

            {/* Booking Widget */}
            <div className="mt-16 md:mt-20 rounded-2xl bg-white p-5 sm:p-6 md:p-8 shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.12)] ring-1 ring-ocean-900/[0.06]">
              <div className="mb-5">
                <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-ocean-900">{t('booking.title')}</h2>
                <p className="mt-1 text-slate-600 md:text-lg">{t('booking.subtitle')}</p>
              </div>
              <BookingWidget
                destination={destination.name}
                destinationSlug={destination.slug}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
