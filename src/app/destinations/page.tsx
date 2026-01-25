import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';
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

// Region display names and colors
const REGIONS: Record<string, { name: string; color: string }> = {
  'istria': { name: 'Istria', color: 'from-green-500 to-emerald-500' },
  'kvarner': { name: 'Kvarner', color: 'from-blue-500 to-cyan-500' },
  'dalmatia': { name: 'Dalmatia', color: 'from-cyan-500 to-blue-500' },
  'split-dalmatia': { name: 'Split-Dalmatia', color: 'from-blue-500 to-indigo-500' },
  'dubrovnik': { name: 'Dubrovnik Region', color: 'from-amber-500 to-orange-500' },
  'continental': { name: 'Continental Croatia', color: 'from-lime-500 to-green-500' },
  'zagreb': { name: 'Zagreb Region', color: 'from-red-500 to-pink-500' },
};

export default function DestinationsPage() {
  const grouped = groupByRegion(DESTINATIONS);
  const popularDestinations = DESTINATIONS.filter(d => d.popular);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-16">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm text-blue-200 mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Destinations</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Explore Croatia
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Discover {DESTINATIONS.length}+ destinations across the stunning Adriatic coast,
            ancient cities, and breathtaking national parks.
          </p>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Popular Destinations
          </h2>
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
      <section className="py-16 bg-gray-50">
        <div className="container">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Browse by Region
          </h2>
          <div className="space-y-12">
            {Object.entries(grouped).map(([region, destinations]) => (
              <div key={region}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${REGIONS[region]?.color || 'from-gray-500 to-gray-600'}`} />
                  <h3 className="text-xl font-semibold text-gray-900">
                    {REGIONS[region]?.name || region}
                  </h3>
                  <span className="text-sm text-gray-500">
                    ({destinations.length} destinations)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {destinations.map(dest => (
                    <Link
                      key={dest.slug}
                      href={`/destinations/${dest.slug}`}
                      className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {dest.name}
                      </span>
                      {dest.popular && (
                        <span className="ml-auto text-xs text-yellow-600">★</span>
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
      <section className="py-16">
        <div className="container">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Browse by Type
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Cities */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Cities</h3>
              <div className="space-y-2">
                {DESTINATIONS.filter(d => d.type === 'city').slice(0, 8).map(dest => (
                  <Link
                    key={dest.slug}
                    href={`/destinations/${dest.slug}`}
                    className="block text-gray-600 hover:text-blue-600 text-sm"
                  >
                    {dest.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Towns */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Coastal Towns</h3>
              <div className="space-y-2">
                {DESTINATIONS.filter(d => d.type === 'town').slice(0, 8).map(dest => (
                  <Link
                    key={dest.slug}
                    href={`/destinations/${dest.slug}`}
                    className="block text-gray-600 hover:text-blue-600 text-sm"
                  >
                    {dest.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Islands */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Islands</h3>
              <div className="space-y-2">
                {DESTINATIONS.filter(d => d.type === 'island').map(dest => (
                  <Link
                    key={dest.slug}
                    href={`/destinations/${dest.slug}`}
                    className="block text-gray-600 hover:text-blue-600 text-sm"
                  >
                    {dest.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* National Parks */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">National Parks</h3>
              <div className="space-y-2">
                {DESTINATIONS.filter(d => d.type === 'national-park').map(dest => (
                  <Link
                    key={dest.slug}
                    href={`/destinations/${dest.slug}`}
                    className="block text-gray-600 hover:text-blue-600 text-sm"
                  >
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
