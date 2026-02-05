import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { MapPin, ChevronRight, Compass, Utensils, Home, Sun, Map, ArrowDown, Info, Calendar, Users, Sparkles, TrendingUp, Waves, Palmtree, DollarSign, Star, CheckCircle, Shield } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { DESTINATIONS, THEMES, Theme } from '@/config/destinations';
import BookingWidget from '@/components/ui/BookingWidget';
import { getDestinationImage } from '@/config/images';
import QuickFactsCard from '@/components/ui/QuickFactsCard';
import DestinationSchema from '@/components/schema/DestinationSchema';

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
};

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

// Generate static params
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

  return {
    title: `${destination.name} Travel Guide 2026`,
    description: t('guides.subtitle'),
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookiscout.com';
  const pageUrl = locale === 'en' ? `${baseUrl}/destinations/${slug}` : `${baseUrl}/${locale}/destinations/${slug}`;

  return (
    <>
      {/* Schema.org TouristDestination */}
      <DestinationSchema
        destination={destination}
        description={t('guides.subtitle')}
        regionName={regionName}
        url={pageUrl}
        imageUrl={destinationImage.url.startsWith('http') ? destinationImage.url : `${baseUrl}${destinationImage.url}`}
      />

      {/* Hero */}
      <section className="relative text-white min-h-[70vh] sm:min-h-[75vh] md:min-h-[85vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={destinationImage.url}
            alt={destinationImage.alt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
        </div>

        {/* Floating elements - hidden on mobile */}
        <div className="hidden md:block absolute top-20 right-10 w-24 h-24 bg-ocean-400/10 rounded-full blur-2xl animate-float" />
        <div className="hidden md:block absolute bottom-32 left-20 w-32 h-32 bg-seafoam-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

        {/* Breadcrumbs */}
        <div className="absolute top-4 left-0 right-0 z-20">
          <div className="container">
            <nav className="flex items-center gap-2 text-xs md:text-sm text-white/80 bg-black/20 backdrop-blur-sm px-3 py-2 rounded-full w-fit">
              <Link href="/" className="hover:text-white">{t('breadcrumb.home')}</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/destinations" className="hover:text-white">{t('breadcrumb.destinations')}</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">{destination.name}</span>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="container pb-20 sm:pb-24 md:pb-28 relative z-10 w-full">
          <div className="max-w-4xl animate-slide-up">
            <div className="flex items-center gap-2 sm:gap-2.5 mb-3 md:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black/30 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center border border-white/20">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-sm sm:text-base md:text-lg text-white capitalize font-semibold [text-shadow:_0_2px_8px_rgba(0,0,0,0.8)]">
                {regionName} • {destination.type.replace('-', ' ')}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 md:mb-7 leading-tight tracking-tight text-white [text-shadow:_0_2px_10px_rgba(0,0,0,0.9),_0_4px_20px_rgba(0,0,0,0.7),_0_0_40px_rgba(0,0,0,0.5)]">
              {destination.name}
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white max-w-3xl mb-6 md:mb-10 leading-relaxed [text-shadow:_0_2px_8px_rgba(0,0,0,0.7)]">
              {t('guides.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <Link
                href="#guides"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-ocean-600 font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl hover:bg-ocean-50 transition-all shadow-large hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>{t('cta.exploreGuides')}</span>
              </Link>
              <Link
                href="#guides"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl hover:bg-white/20 hover:border-white/50 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>{t('cta.compareAreas')}</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      </section>

      {/* Main Content */}
      <div className="bg-gradient-ocean-subtle">
        <div className="container pt-12 pb-16 md:pt-16 md:pb-24">
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

            {/* Nearby Destinations */}
            {nearbyDestinations.length > 0 && (
              <div className="mt-12 md:mt-20">
                <div className="text-center mb-8 md:mb-12">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-2 md:mb-4">
                    {t('nearby.title')}
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg text-slate-600">
                    {t('nearby.subtitle', { region: regionName })}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                  {nearbyDestinations.map(dest => (
                    <Link
                      key={dest.slug}
                      href={`/destinations/${dest.slug}`}
                      className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 md:p-5 bg-white rounded-xl sm:rounded-2xl border-2 border-slate-100 hover:border-ocean-300 hover:shadow-soft transition-all hover:-translate-y-1"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-ocean-subtle rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-ocean-600" />
                      </div>
                      <span className="text-xs sm:text-sm md:text-base font-bold text-slate-900 group-hover:text-ocean-600 transition-colors text-center">
                        {dest.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Widget */}
            <div className="mt-12 md:mt-20 p-5 sm:p-6 md:p-8 lg:p-10 bg-white rounded-2xl md:rounded-3xl border-2 border-slate-100 shadow-soft">
              <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-ocean rounded-xl sm:rounded-2xl flex items-center justify-center shadow-ocean flex-shrink-0">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">
                    {t('booking.title')}
                  </h3>
                  <p className="text-slate-600 text-sm sm:text-base md:text-lg">
                    {t('booking.subtitle')}
                  </p>
                </div>
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
