import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ChevronRight, Sparkles, TrendingUp, Building, Waves, Mountain } from 'lucide-react';
import { DESTINATIONS, Destination } from '@/config/destinations';
import DestinationCard from '@/components/ui/DestinationCard';

export const metadata: Metadata = {
  title: 'All Destinations in Croatia',
  description: 'Explore 60+ destinations across Croatia - from Split and Dubrovnik to hidden gems in Istria, Dalmatia, and the islands.',
  openGraph: {
    title: 'All Destinations in Croatia | BookiScout',
    description: 'Explore 60+ destinations across Croatia - from Split and Dubrovnik to hidden gems.',
  },
};

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
const REGIONS: Record<string, { name: string; gradient: string; badge: string }> = {
  'istria': {
    name: 'Istria',
    gradient: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  },
  'kvarner': {
    name: 'Kvarner',
    gradient: 'from-blue-500 to-cyan-600',
    badge: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  'dalmatia': {
    name: 'Dalmatia',
    gradient: 'from-cyan-500 to-ocean-600',
    badge: 'bg-cyan-100 text-cyan-700 border-cyan-200'
  },
  'split-dalmatia': {
    name: 'Split-Dalmatia',
    gradient: 'from-ocean-500 to-indigo-600',
    badge: 'bg-ocean-100 text-ocean-700 border-ocean-200'
  },
  'dubrovnik': {
    name: 'Dubrovnik Region',
    gradient: 'from-sand-500 to-coral-600',
    badge: 'bg-sand-100 text-sand-700 border-sand-200'
  },
  'continental': {
    name: 'Continental Croatia',
    gradient: 'from-lime-500 to-seafoam-600',
    badge: 'bg-lime-100 text-lime-700 border-lime-200'
  },
  'zagreb': {
    name: 'Zagreb Region',
    gradient: 'from-rose-500 to-pink-600',
    badge: 'bg-rose-100 text-rose-700 border-rose-200'
  },
};

export default function DestinationsPage() {
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
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-semibold">Destinations</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full mb-6">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-semibold">{DESTINATIONS.length}+ Destinations</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Explore Croatia
            </h1>
            <p className="text-xl text-ocean-50 leading-relaxed">
              Discover stunning destinations across the Adriatic coast, ancient cities, and breathtaking national parks. Find your perfect Croatian getaway.
            </p>

            <div className="flex flex-wrap items-center gap-6 mt-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <span className="font-semibold">Cities & Towns</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Waves className="w-5 h-5" />
                </div>
                <span className="font-semibold">Islands</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Mountain className="w-5 h-5" />
                </div>
                <span className="font-semibold">National Parks</span>
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
                <span>Most Popular</span>
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-3">
                Top Destinations
              </h2>
              <p className="text-lg text-slate-600">
                Most visited places in Croatia
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
              <span>Browse by Region</span>
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-3">
              Explore by Region
            </h2>
            <p className="text-lg text-slate-600">
              Discover destinations organized by Croatian regions
            </p>
          </div>

          <div className="space-y-10">
            {Object.entries(grouped).map(([region, destinations]) => (
              <div key={region} className="bg-white rounded-3xl p-8 shadow-soft border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${REGIONS[region]?.gradient || 'from-slate-400 to-slate-600'} shadow-soft flex items-center justify-center`}>
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {REGIONS[region]?.name || region}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      {destinations.length} destination{destinations.length !== 1 ? 's' : ''}
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
                          Popular
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* By Type */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-3">
              Browse by Type
            </h2>
            <p className="text-lg text-slate-600">
              Find destinations based on what you're looking for
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Cities */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl border-2 border-slate-100 p-8 hover:border-ocean-200 hover:shadow-soft transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-2xl flex items-center justify-center mb-5 shadow-soft">
                <Building className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-5">Cities</h3>
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
              <h3 className="font-bold text-xl text-slate-900 mb-5">Coastal Towns</h3>
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
              <h3 className="font-bold text-xl text-slate-900 mb-5">Islands</h3>
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
              <h3 className="font-bold text-xl text-slate-900 mb-5">National Parks</h3>
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
