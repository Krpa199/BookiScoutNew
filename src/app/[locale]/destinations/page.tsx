import { Metadata } from 'next';
import { MapPin, ChevronRight, Sparkles, TrendingUp, Building, Waves, Mountain } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { DESTINATIONS, Destination } from '@/config/destinations';
import DestinationCard from '@/components/ui/DestinationCard';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('destinationsTitle'),
    description: t('destinationsDescription'),
  };
}

// Group destinations by region
function groupByRegion(destinations: Destination[]): Record<string, Destination[]> {
  return destinations.reduce((acc, dest) => {
    if (!acc[dest.region]) {
      acc[dest.region] = [];
    }
    acc[dest.region].push(dest);
    return acc;
  }, {} as Record<string, Destination[]>);
}

// Region display names and ocean-themed colors
const REGIONS: Record<string, { gradient: string; badge: string }> = {
  'istria': {
    gradient: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  },
  'kvarner': {
    gradient: 'from-blue-500 to-cyan-600',
    badge: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  'dalmatia': {
    gradient: 'from-cyan-500 to-ocean-600',
    badge: 'bg-cyan-100 text-cyan-700 border-cyan-200'
  },
  'split-dalmatia': {
    gradient: 'from-ocean-500 to-indigo-600',
    badge: 'bg-ocean-100 text-ocean-700 border-ocean-200'
  },
  'dubrovnik': {
    gradient: 'from-sand-500 to-coral-600',
    badge: 'bg-sand-100 text-sand-700 border-sand-200'
  },
  'continental': {
    gradient: 'from-lime-500 to-seafoam-600',
    badge: 'bg-lime-100 text-lime-700 border-lime-200'
  },
  'zagreb': {
    gradient: 'from-rose-500 to-pink-600',
    badge: 'bg-rose-100 text-rose-700 border-rose-200'
  },
};

export default async function DestinationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('destinations');
  const tRegions = await getTranslations('regions');

  const grouped = groupByRegion(DESTINATIONS);
  const popularDestinations = DESTINATIONS.filter(d => d.popular);

  return (
    <>
      {/* Hero - Ocean gradient */}
      <section className="relative bg-gradient-to-br from-ocean-500 via-ocean-600 to-seafoam-600 text-white py-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-seafoam-300 rounded-full blur-3xl" />
        </div>

        <div className="container relative">
          <nav className="flex items-center gap-2 text-sm text-ocean-100 mb-8">
            <Link href="/" className="hover:text-white transition-colors">{t('hero.statCities').split(' ')[0] === 'Cities' ? 'Home' : t('hero.statCities').split(' ')[0]}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-semibold">{t('hero.title').split(' ')[0]}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full mb-6">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-semibold">{t('hero.badge', { count: DESTINATIONS.length })}</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-ocean-50 leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-wrap items-center gap-6 mt-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <span className="font-semibold">{t('hero.statCities')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Waves className="w-5 h-5" />
                </div>
                <span className="font-semibold">{t('hero.statIslands')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Mountain className="w-5 h-5" />
                </div>
                <span className="font-semibold">{t('hero.statParks')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 text-white">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path
              d="M0,48 C240,64 480,64 720,48 C960,32 1200,32 1440,48 L1440,80 L0,80 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sand-100 text-sand-700 rounded-full text-sm font-semibold mb-4">
                <TrendingUp className="w-4 h-4" />
                <span>{t('popular.badge')}</span>
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-3">
                {t('popular.title')}
              </h2>
              <p className="text-lg text-slate-600">
                {t('popular.subtitle')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {popularDestinations.map(dest => (
              <DestinationCard
                key={dest.slug}
                destination={dest}
                articleCount={20}
              />
            ))}
          </div>
        </div>
      </section>

      {/* By Region */}
      <section className="py-20 bg-gradient-ocean-subtle">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ocean-100 text-ocean-700 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              <span>{t('byRegion.badge')}</span>
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-3">
              {t('byRegion.title')}
            </h2>
            <p className="text-lg text-slate-600">
              {t('byRegion.subtitle')}
            </p>
          </div>

          <div className="space-y-10">
            {Object.entries(grouped).map(([region, destinations]) => {
              const regionStyleKey = region as keyof typeof REGIONS;
              // Convert region key to camelCase for translation lookup
              // "split-dalmatia" -> "splitDalmatia"
              const regionTranslationKey = region.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
              const regionName = (() => {
                try {
                  return tRegions(regionTranslationKey as any);
                } catch {
                  return region;
                }
              })();

              return (
                <div key={region} className="bg-white rounded-3xl p-8 shadow-soft border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${REGIONS[regionStyleKey]?.gradient || 'from-slate-400 to-slate-600'} shadow-soft flex items-center justify-center`}>
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {regionName}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium">
                        {destinations.length === 1
                          ? t('byRegion.count', { count: destinations.length })
                          : t('byRegion.countPlural', { count: destinations.length })
                        }
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {destinations.map(dest => (
                      <Link
                        key={dest.slug}
                        href={`/destinations/${dest.slug}`}
                        className="group flex flex-col items-center gap-2 px-3 py-4 bg-slate-50 hover:bg-white rounded-xl border-2 border-slate-100 hover:border-ocean-300 hover:shadow-soft transition-all"
                      >
                        <div className="w-10 h-10 bg-white rounded-xl shadow-xs flex items-center justify-center group-hover:scale-110 transition-transform">
                          <MapPin className="w-5 h-5 text-ocean-500" />
                        </div>
                        <span className="text-sm font-bold text-slate-700 group-hover:text-ocean-600 transition-colors text-center">
                          {dest.name}
                        </span>
                        {dest.popular && (
                          <span className="px-2 py-0.5 bg-sand-100 text-sand-700 rounded-full text-xs font-bold">
                            {t('card.popular')}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* By Type */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-3">
              {t('byType.title')}
            </h2>
            <p className="text-lg text-slate-600">
              {t('byType.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Cities */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl border-2 border-slate-100 p-8 hover:border-ocean-200 hover:shadow-soft transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-2xl flex items-center justify-center mb-5 shadow-soft">
                <Building className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-5">{t('byType.cities')}</h3>
              <div className="space-y-3">
                {DESTINATIONS.filter(d => d.type === 'city').slice(0, 8).map(dest => (
                  <Link
                    key={dest.slug}
                    href={`/destinations/${dest.slug}`}
                    className="flex items-center gap-2 text-slate-600 hover:text-ocean-600 text-sm font-medium transition-colors group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-ocean-500 transition-colors" />
                    {dest.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Towns */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl border-2 border-slate-100 p-8 hover:border-ocean-200 hover:shadow-soft transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-seafoam-400 to-seafoam-600 rounded-2xl flex items-center justify-center mb-5 shadow-soft">
                <Building className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-5">{t('byType.coastalTowns')}</h3>
              <div className="space-y-3">
                {DESTINATIONS.filter(d => d.type === 'town').slice(0, 8).map(dest => (
                  <Link
                    key={dest.slug}
                    href={`/destinations/${dest.slug}`}
                    className="flex items-center gap-2 text-slate-600 hover:text-seafoam-600 text-sm font-medium transition-colors group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-seafoam-500 transition-colors" />
                    {dest.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Islands */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl border-2 border-slate-100 p-8 hover:border-ocean-200 hover:shadow-soft transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center mb-5 shadow-soft">
                <Waves className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-5">{t('byType.islands')}</h3>
              <div className="space-y-3">
                {DESTINATIONS.filter(d => d.type === 'island').map(dest => (
                  <Link
                    key={dest.slug}
                    href={`/destinations/${dest.slug}`}
                    className="flex items-center gap-2 text-slate-600 hover:text-cyan-600 text-sm font-medium transition-colors group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-cyan-500 transition-colors" />
                    {dest.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* National Parks */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl border-2 border-slate-100 p-8 hover:border-ocean-200 hover:shadow-soft transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-soft">
                <Mountain className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-5">{t('byType.nationalParks')}</h3>
              <div className="space-y-3">
                {DESTINATIONS.filter(d => d.type === 'national-park').map(dest => (
                  <Link
                    key={dest.slug}
                    href={`/destinations/${dest.slug}`}
                    className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 text-sm font-medium transition-colors group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-emerald-500 transition-colors" />
                    {dest.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
