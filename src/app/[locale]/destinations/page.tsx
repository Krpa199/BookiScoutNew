import { Metadata } from 'next';
import { localeAlternates } from '@/lib/urls';
import { MapPin, ChevronRight, Sparkles, TrendingUp, Building, Waves, Mountain } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { DESTINATIONS, Destination } from '@/config/destinations';
import DestinationCard from '@/components/ui/DestinationCard';
import Image from 'next/image';
import { getDestinationImage } from '@/config/images';

export const revalidate = false; // fully static - rebuilt only via CI/CD

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('destinationsTitle'),
    description: t('destinationsDescription'),
    alternates: localeAlternates(locale, '/destinations'),
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

export default async function DestinationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('destinations');
  const tRegions = await getTranslations('regions');
  const tCommon = await getTranslations('common');

  const grouped = groupByRegion(DESTINATIONS);
  const popularDestinations = DESTINATIONS.filter(d => d.popular).slice(0, 12);
  const heroArches = ['rovinj', 'dubrovnik', 'plitvice'].map(slug => ({
    slug,
    name: DESTINATIONS.find(d => d.slug === slug)?.name ?? slug,
    ...getDestinationImage(slug),
  }));
  const card = 'rounded-2xl bg-white shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.12)] ring-1 ring-ocean-900/[0.06]';

  const regionLabel = (region: string) => {
    try {
      return tRegions(region.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) as never);
    } catch {
      return region;
    }
  };

  return (
    <>
      {/* Hero — same deep-Adriatic language as the guides */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-700 pt-8 pb-20 md:pt-10 md:pb-28 text-white">
        <div className="pointer-events-none absolute -top-32 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-sand-300/25 blur-3xl" aria-hidden="true" />
        <div className="relative container">
          <nav className="flex items-center gap-2 text-sm text-ocean-100/60" aria-label="Breadcrumb">
            <Link href="/" className="text-ocean-100/80 hover:text-white">{tCommon('home')}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-medium text-sand-200">{t('hero.title')}</span>
          </nav>
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-10 items-center">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight max-w-3xl text-white">
                {t('hero.title')}
              </h1>
              <p className="mt-4 text-lg md:text-xl text-ocean-50/80 leading-relaxed max-w-2xl">{t('hero.subtitle')}</p>
              <dl className="mt-8 grid grid-cols-3 gap-2.5 max-w-xl">
                {[
                  [DESTINATIONS.filter(d => d.type === 'city' || d.type === 'town').length, t('hero.statCities')],
                  [DESTINATIONS.filter(d => d.type === 'island').length, t('hero.statIslands')],
                  [DESTINATIONS.filter(d => d.type === 'national-park').length, t('hero.statParks')],
                ].map(([n, label]) => (
                  <div key={label as string} className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm">
                    <dd className="font-display text-3xl font-semibold text-white">{n}</dd>
                    <dt className="mt-0.5 text-xs font-semibold leading-snug text-sand-200/90">{label}</dt>
                  </div>
                ))}
              </dl>
            </div>

            {/* Three arched postcards fanned out; the middle one in front */}
            <div className="relative flex h-[19rem] sm:h-[26rem] md:h-[30rem] items-center justify-center lg:justify-end lg:pr-4">
              {heroArches.map((img, i) => {
                const pose = [
                  'z-10 -mr-8 sm:-mr-12 h-52 w-32 sm:h-72 sm:w-44 md:h-80 md:w-52 -rotate-6 translate-y-5',
                  'z-20 h-64 w-40 sm:h-[22rem] sm:w-52 md:h-[26rem] md:w-60 ring-2 ring-sand-300/70 ring-offset-[6px] sm:ring-offset-[10px] ring-offset-ocean-800',
                  'z-10 -ml-8 sm:-ml-12 h-52 w-32 sm:h-72 sm:w-44 md:h-80 md:w-52 rotate-6 translate-y-5',
                ][i];
                const region = DESTINATIONS.find(d => d.slug === img.slug)?.region ?? '';
                return (
                  <Link
                    key={img.slug}
                    href={`/destinations/${img.slug}`}
                    className={`group relative flex-shrink-0 overflow-hidden rounded-t-[999px] rounded-b-[1.75rem] bg-white p-1.5 shadow-[0_25px_50px_-12px_rgba(3,25,40,0.65)] transition-transform duration-500 hover:-translate-y-2 ${pose}`}
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-t-[999px] rounded-b-[1.4rem]">
                      <Image src={img.url} alt={img.alt} fill priority className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="240px" />
                      <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/80 via-ocean-900/10 to-transparent" />
                      {/* side cards: keep the label clear of the overlapping centre card */}
                      <div className={`absolute inset-x-0 bottom-4 ${['pl-3 pr-10 sm:pl-4 sm:pr-14 text-left', 'px-3 text-center', 'pl-10 pr-3 sm:pl-14 sm:pr-4 text-right'][i]}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-[0.15em] text-sand-200 ${i === 1 ? '' : 'hidden sm:block'}`}>{regionLabel(region)}</p>
                        <p className="mt-0.5 font-display text-base sm:text-lg md:text-2xl font-semibold leading-tight text-white">{img.name}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        <svg className="absolute bottom-0 left-0 h-8 w-full text-[#e8f2f9] md:h-12" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0,32 C240,58 480,58 720,34 C960,10 1200,10 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </section>

      <div className="bg-[#e8f2f9] pt-10 pb-20 md:pt-14 md:pb-24">
        {/* Most visited */}
        <section className="container">
          <p className="text-xs font-bold uppercase tracking-wider text-ocean-700">{t('popular.badge')}</p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl font-semibold tracking-tight text-ocean-900">{t('popular.title')}</h2>
          <p className="mt-2 text-base md:text-lg text-slate-600">{t('popular.subtitle')}</p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {popularDestinations.map(dest => (
              <DestinationCard key={dest.slug} destination={dest} />
            ))}
          </div>
        </section>

        {/* Every destination, by region */}
        <section className="container mt-16 md:mt-20">
          <p className="text-xs font-bold uppercase tracking-wider text-ocean-700">{t('byRegion.badge')}</p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl font-semibold tracking-tight text-ocean-900">{t('byRegion.title')}</h2>
          <p className="mt-2 text-base md:text-lg text-slate-600">{t('byRegion.subtitle')}</p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {Object.entries(grouped).map(([region, destinations]) => {
              // Banner photo: the region's best-known place
              const lead = destinations.find(d => d.popular) ?? destinations[0];
              const banner = getDestinationImage(lead.slug);
              return (
                <div key={region} className={`overflow-hidden ${card}`}>
                  <div className="relative h-36 md:h-44">
                    <Image src={banner.url} alt={banner.alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 640px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/85 via-ocean-900/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                      <h3 className="font-display text-3xl font-semibold text-white">{regionLabel(region)}</h3>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
                        {destinations.length === 1
                          ? t('byRegion.count', { count: destinations.length })
                          : t('byRegion.countPlural', { count: destinations.length })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 p-5">
                    {destinations.map(dest => (
                      <Link
                        key={dest.slug}
                        href={`/destinations/${dest.slug}`}
                        className="group inline-flex items-center gap-2 rounded-full bg-ocean-50 py-1 pl-1 pr-3.5 text-sm font-medium text-ocean-800 ring-1 ring-ocean-100 transition hover:bg-ocean-800 hover:text-white hover:ring-ocean-800"
                      >
                        <span className="relative h-7 w-7 overflow-hidden rounded-full ring-2 ring-white">
                          <Image src={getDestinationImage(dest.slug).url} alt="" fill className="object-cover" sizes="28px" />
                        </span>
                        {dest.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
