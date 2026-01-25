import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { MapPin, ChevronRight, Compass, Utensils, Home, Sun, Map } from 'lucide-react';
import { DESTINATIONS, THEMES, Theme } from '@/config/destinations';
import BookingWidget from '@/components/ui/BookingWidget';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Theme icons and labels
const THEME_INFO: Record<Theme, { icon: React.ReactNode; label: string }> = {
  'apartments': { icon: <Home className="w-4 h-4" />, label: 'Apartments' },
  'family': { icon: <Home className="w-4 h-4" />, label: 'Family Travel' },
  'couples': { icon: <Home className="w-4 h-4" />, label: 'Couples' },
  'budget': { icon: <Home className="w-4 h-4" />, label: 'Budget Travel' },
  'luxury': { icon: <Home className="w-4 h-4" />, label: 'Luxury' },
  'beach': { icon: <Sun className="w-4 h-4" />, label: 'Beaches' },
  'pet-friendly': { icon: <Home className="w-4 h-4" />, label: 'Pet Friendly' },
  'pool': { icon: <Home className="w-4 h-4" />, label: 'Pools' },
  'parking': { icon: <Home className="w-4 h-4" />, label: 'Parking' },
  'restaurants': { icon: <Utensils className="w-4 h-4" />, label: 'Restaurants' },
  'nightlife': { icon: <Compass className="w-4 h-4" />, label: 'Nightlife' },
  'things-to-do': { icon: <Compass className="w-4 h-4" />, label: 'Things to Do' },
  'day-trips': { icon: <Map className="w-4 h-4" />, label: 'Day Trips' },
  'weather': { icon: <Sun className="w-4 h-4" />, label: 'Weather' },
  'prices': { icon: <Home className="w-4 h-4" />, label: 'Prices' },
  'transport': { icon: <Map className="w-4 h-4" />, label: 'Transport' },
  'hidden-gems': { icon: <Compass className="w-4 h-4" />, label: 'Hidden Gems' },
  'local-food': { icon: <Utensils className="w-4 h-4" />, label: 'Local Food' },
  'best-time-to-visit': { icon: <Sun className="w-4 h-4" />, label: 'Best Time to Visit' },
  'safety': { icon: <Home className="w-4 h-4" />, label: 'Safety' },
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
  return DESTINATIONS.map(dest => ({
    slug: dest.slug,
  }));
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = DESTINATIONS.find(d => d.slug === slug);

  if (!destination) {
    return { title: 'Destination Not Found' };
  }

  return {
    title: `${destination.name} Travel Guide - Apartments, Beaches & More`,
    description: `Complete travel guide to ${destination.name}, Croatia. Find the best apartments, beaches, restaurants, and things to do.`,
    openGraph: {
      title: `${destination.name} Travel Guide | BookiScout`,
      description: `Complete travel guide to ${destination.name}, Croatia.`,
    },
  };
}

export default async function DestinationPage({ params }: PageProps) {
  const { slug } = await params;
  const destination = DESTINATIONS.find(d => d.slug === slug);

  if (!destination) {
    notFound();
  }

  const availableGuides = getAvailableGuides(slug);
  const nearbyDestinations = DESTINATIONS
    .filter(d => d.region === destination.region && d.slug !== slug)
    .slice(0, 6);

  // Region colors
  const regionColors: Record<string, string> = {
    'istria': 'from-green-500 to-emerald-500',
    'kvarner': 'from-blue-500 to-cyan-500',
    'dalmatia': 'from-cyan-500 to-blue-500',
    'split-dalmatia': 'from-blue-500 to-indigo-500',
    'dubrovnik': 'from-amber-500 to-orange-500',
    'continental': 'from-lime-500 to-green-500',
    'zagreb': 'from-red-500 to-pink-500',
  };

  return (
    <>
      {/* Hero */}
      <section className={`bg-gradient-to-br ${regionColors[destination.region] || 'from-blue-600 to-blue-700'} text-white py-16 md:py-24`}>
        <div className="container">
          <nav className="flex items-center gap-2 text-sm text-white/70 mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/destinations" className="hover:text-white">Destinations</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{destination.name}</span>
          </nav>

          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5" />
            <span className="text-white/80 capitalize">{destination.region.replace('-', ' ')} • {destination.type.replace('-', ' ')}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {destination.name}
          </h1>

          <p className="text-xl text-white/90 max-w-2xl mb-8">
            Your complete travel guide to {destination.name}, Croatia.
            Find apartments, beaches, restaurants, and local tips.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href={`/guides/en/${slug}-apartments`}
              className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Find Apartments
            </Link>
            <Link
              href={`/guides/en/${slug}-things-to-do`}
              className="px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors"
            >
              Things to Do
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Guides */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Travel Guides for {destination.name}
            </h2>

            {availableGuides.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableGuides.map(theme => (
                  <Link
                    key={theme}
                    href={`/guides/en/${slug}-${theme}`}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      {THEME_INFO[theme]?.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {THEME_INFO[theme]?.label}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Guide for {destination.name}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <p className="text-gray-600 mb-4">
                  Guides for {destination.name} are being generated.
                  Check back soon!
                </p>
                <p className="text-sm text-gray-500">
                  In the meantime, use the booking widget to find accommodation.
                </p>
              </div>
            )}

            {/* All Topics */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                All Topics
              </h2>
              <div className="flex flex-wrap gap-2">
                {THEMES.map(theme => {
                  const isAvailable = availableGuides.includes(theme);
                  return (
                    <Link
                      key={theme}
                      href={`/guides/en/${slug}-${theme}`}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        isAvailable
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-400 pointer-events-none'
                      }`}
                    >
                      {THEME_INFO[theme]?.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Nearby Destinations */}
            {nearbyDestinations.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Nearby Destinations
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {nearbyDestinations.map(dest => (
                    <Link
                      key={dest.slug}
                      href={`/destinations/${dest.slug}`}
                      className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">{dest.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside>
            <div className="sticky top-6 space-y-6">
              {/* Booking Widget */}
              <BookingWidget
                destination={destination.name}
                destinationSlug={destination.slug}
              />

              {/* Quick Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Region</span>
                    <span className="text-gray-900 capitalize">{destination.region.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type</span>
                    <span className="text-gray-900 capitalize">{destination.type.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coordinates</span>
                    <span className="text-gray-900">{destination.lat.toFixed(2)}°N, {destination.lng.toFixed(2)}°E</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guides Available</span>
                    <span className="text-gray-900">{availableGuides.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
