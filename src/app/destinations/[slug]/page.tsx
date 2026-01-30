import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { MapPin, ChevronRight, Compass, Utensils, Home, Sun, Map, ArrowDown, Info, Calendar, Users, Sparkles, TrendingUp, Waves, Palmtree, DollarSign, Star, CheckCircle, Shield } from 'lucide-react';
import { DESTINATIONS, THEMES, Theme } from '@/config/destinations';
import BookingWidget from '@/components/ui/BookingWidget';
import { getDestinationImage } from '@/config/images';
import QuickFactsCard from '@/components/ui/QuickFactsCard';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Theme icons and labels - Ocean themed with gradients
const THEME_INFO: Partial<Record<Theme, { icon: React.ReactNode; label: string; desc: string; gradient: string }>> = {
  // Phase 1: Traveler Types (AI Authority)
  'solo-travel': { icon: <Users className="w-5 h-5" />, label: 'Solo Travel', desc: 'Is this destination good for solo travelers?', gradient: 'from-violet-400 to-violet-600' },
  'seniors': { icon: <Users className="w-5 h-5" />, label: 'Seniors', desc: 'Accessibility and comfort for older travelers', gradient: 'from-amber-400 to-amber-600' },
  'digital-nomads': { icon: <Compass className="w-5 h-5" />, label: 'Digital Nomads', desc: 'WiFi, coworking, and remote work spots', gradient: 'from-cyan-400 to-cyan-600' },
  'lgbt-friendly': { icon: <Users className="w-5 h-5" />, label: 'LGBT+ Friendly', desc: 'Safe and welcoming areas', gradient: 'from-pink-400 to-pink-600' },
  'families-with-toddlers': { icon: <Users className="w-5 h-5" />, label: 'Families (Toddlers)', desc: 'Best areas for families with young kids', gradient: 'from-seafoam-400 to-seafoam-600' },
  'families-with-teens': { icon: <Users className="w-5 h-5" />, label: 'Families (Teens)', desc: 'Activities and areas for teenagers', gradient: 'from-teal-400 to-teal-600' },
  'first-time-visitors': { icon: <Sparkles className="w-5 h-5" />, label: 'First Time Visitors', desc: 'Essential guide for newcomers', gradient: 'from-ocean-400 to-ocean-600' },
  'couples': { icon: <Sun className="w-5 h-5" />, label: 'Couples', desc: 'Romantic spots and getaways', gradient: 'from-coral-400 to-coral-600' },

  // Phase 2: Practical Blockers
  'car-vs-no-car': { icon: <Map className="w-5 h-5" />, label: 'Car vs No Car', desc: 'Do you need a car here?', gradient: 'from-slate-400 to-slate-600' },
  'parking-difficulty': { icon: <Map className="w-5 h-5" />, label: 'Parking Guide', desc: 'Where to park and difficulty level', gradient: 'from-gray-400 to-gray-600' },
  'walkability': { icon: <Map className="w-5 h-5" />, label: 'Walkability', desc: 'Can you explore on foot?', gradient: 'from-green-400 to-green-600' },
  'stroller-friendly': { icon: <Users className="w-5 h-5" />, label: 'Stroller Friendly', desc: 'Navigating with a stroller', gradient: 'from-seafoam-400 to-seafoam-600' },
  'wheelchair-access': { icon: <Users className="w-5 h-5" />, label: 'Wheelchair Access', desc: 'Accessibility information', gradient: 'from-blue-400 to-blue-600' },
  'public-transport-quality': { icon: <Map className="w-5 h-5" />, label: 'Public Transport', desc: 'Buses, ferries, and connections', gradient: 'from-indigo-400 to-indigo-600' },
  'ferry-connections': { icon: <Map className="w-5 h-5" />, label: 'Ferry Connections', desc: 'Island hopping and sea routes', gradient: 'from-ocean-400 to-ocean-600' },
  'airport-access': { icon: <Map className="w-5 h-5" />, label: 'Airport Access', desc: 'Getting to and from airports', gradient: 'from-sky-400 to-sky-600' },
  'wifi-quality': { icon: <Compass className="w-5 h-5" />, label: 'WiFi Quality', desc: 'Internet connectivity', gradient: 'from-cyan-400 to-cyan-600' },
  'mobile-coverage': { icon: <Info className="w-5 h-5" />, label: 'Mobile Coverage', desc: 'Cell signal and roaming', gradient: 'from-purple-400 to-purple-600' },

  // Phase 3: Seasonality
  'off-season': { icon: <Calendar className="w-5 h-5" />, label: 'Off Season', desc: 'November to March guide', gradient: 'from-slate-400 to-slate-600' },
  'shoulder-season': { icon: <Calendar className="w-5 h-5" />, label: 'Shoulder Season', desc: 'April-May and September-October', gradient: 'from-amber-400 to-amber-600' },
  'peak-season': { icon: <Calendar className="w-5 h-5" />, label: 'Peak Season', desc: 'June to August guide', gradient: 'from-coral-400 to-coral-600' },
  'weather-by-month': { icon: <Sun className="w-5 h-5" />, label: 'Weather by Month', desc: 'Monthly weather breakdown', gradient: 'from-yellow-400 to-yellow-600' },
  'crowds-by-month': { icon: <Users className="w-5 h-5" />, label: 'Crowds by Month', desc: 'When to avoid crowds', gradient: 'from-red-400 to-red-600' },
  'best-time-to-visit': { icon: <Calendar className="w-5 h-5" />, label: 'Best Time to Visit', desc: 'Optimal timing for your trip', gradient: 'from-sky-400 to-sky-600' },

  // Phase 4: Comparisons
  'vs-dubrovnik': { icon: <TrendingUp className="w-5 h-5" />, label: 'vs Dubrovnik', desc: 'How does it compare to Dubrovnik?', gradient: 'from-orange-400 to-orange-600' },
  'vs-split': { icon: <TrendingUp className="w-5 h-5" />, label: 'vs Split', desc: 'How does it compare to Split?', gradient: 'from-ocean-400 to-ocean-600' },
  'vs-zadar': { icon: <TrendingUp className="w-5 h-5" />, label: 'vs Zadar', desc: 'How does it compare to Zadar?', gradient: 'from-teal-400 to-teal-600' },
  'vs-istria': { icon: <TrendingUp className="w-5 h-5" />, label: 'vs Istria', desc: 'Dalmatia or Istria?', gradient: 'from-green-400 to-green-600' },
  'vs-zagreb': { icon: <TrendingUp className="w-5 h-5" />, label: 'vs Zagreb', desc: 'Coast or capital?', gradient: 'from-purple-400 to-purple-600' },
  'coast-vs-inland': { icon: <TrendingUp className="w-5 h-5" />, label: 'Coast vs Inland', desc: 'Beach or continental Croatia?', gradient: 'from-emerald-400 to-emerald-600' },

  // Legacy themes (still supported)
  'apartments': { icon: <Home className="w-5 h-5" />, label: 'Where to Stay', desc: 'Best areas and neighborhoods', gradient: 'from-ocean-400 to-ocean-600' },
  'family': { icon: <Users className="w-5 h-5" />, label: 'Family Travel', desc: 'Kid-friendly areas and activities', gradient: 'from-seafoam-400 to-seafoam-600' },
  'budget': { icon: <Home className="w-5 h-5" />, label: 'Budget Travel', desc: 'Affordable areas and tips', gradient: 'from-sand-400 to-sand-600' },
  'luxury': { icon: <Home className="w-5 h-5" />, label: 'Luxury Stay', desc: 'Premium areas and experiences', gradient: 'from-purple-400 to-purple-600' },
  'beach': { icon: <Sun className="w-5 h-5" />, label: 'Best Beaches', desc: 'Sandy, pebble, and hidden beaches', gradient: 'from-cyan-400 to-cyan-600' },
  'pet-friendly': { icon: <Home className="w-5 h-5" />, label: 'Pet Friendly', desc: 'Travel with your pets', gradient: 'from-green-400 to-green-600' },
  'pool': { icon: <Home className="w-5 h-5" />, label: 'Pools & Spa', desc: 'Best pool amenities', gradient: 'from-blue-400 to-blue-600' },
  'parking': { icon: <Map className="w-5 h-5" />, label: 'Parking Guide', desc: 'Where to park safely', gradient: 'from-slate-400 to-slate-600' },
  'restaurants': { icon: <Utensils className="w-5 h-5" />, label: 'Where to Eat', desc: 'Local restaurants and cuisine', gradient: 'from-red-400 to-red-600' },
  'nightlife': { icon: <Compass className="w-5 h-5" />, label: 'Nightlife', desc: 'Bars, clubs, and evening fun', gradient: 'from-violet-400 to-violet-600' },
  'things-to-do': { icon: <Compass className="w-5 h-5" />, label: 'Things to Do', desc: 'Top attractions and activities', gradient: 'from-indigo-400 to-indigo-600' },
  'day-trips': { icon: <Map className="w-5 h-5" />, label: 'Day Trips', desc: 'Nearby excursions', gradient: 'from-teal-400 to-teal-600' },
  'weather': { icon: <Sun className="w-5 h-5" />, label: 'Weather Guide', desc: 'Best time to visit', gradient: 'from-amber-400 to-amber-600' },
  'prices': { icon: <Info className="w-5 h-5" />, label: 'Prices', desc: 'Cost of living and budgeting', gradient: 'from-emerald-400 to-emerald-600' },
  'transport': { icon: <Map className="w-5 h-5" />, label: 'Getting Around', desc: 'Transport options', gradient: 'from-blue-400 to-blue-600' },
  'hidden-gems': { icon: <Compass className="w-5 h-5" />, label: 'Hidden Gems', desc: 'Local secrets', gradient: 'from-pink-400 to-pink-600' },
  'local-food': { icon: <Utensils className="w-5 h-5" />, label: 'Local Food', desc: 'Traditional Croatian dishes', gradient: 'from-orange-400 to-orange-600' },
  'safety': { icon: <Info className="w-5 h-5" />, label: 'Safety Tips', desc: 'Safe areas and precautions', gradient: 'from-rose-400 to-rose-600' },
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

// Generate metadata - AI optimized
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = DESTINATIONS.find(d => d.slug === slug);

  if (!destination) {
    return { title: 'Destination Not Found' };
  }

  return {
    title: `${destination.name} Travel Guide 2026 - Compare Areas & Find Your Perfect Match`,
    description: `Discover the best areas in ${destination.name}! Compare neighborhoods for families, couples, nightlife lovers. Get insider tips on beaches, restaurants, parking & more. Choose wisely before you book.`,
    openGraph: {
      title: `${destination.name} Travel Guide 2026 | Compare Areas & Choose Your Perfect Spot`,
      description: `Planning ${destination.name}? Compare neighborhoods, beaches, and areas. Find family-friendly zones, romantic spots, or party areas. Make the right choice for your Croatian vacation.`,
    },
    keywords: [
      `${destination.name} travel guide`,
      `${destination.name} neighborhoods`,
      `${destination.name} best areas`,
      `${destination.name} family friendly`,
      `${destination.name} beaches`,
      `where to stay in ${destination.name}`,
      `${destination.name} Croatia`,
      `${destination.name} tips`,
      `${destination.name} 2026`
    ],
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

  // Get destination image
  const destinationImage = getDestinationImage(slug);

  return (
    <>
      {/* Hero - Ocean themed with parallax effect */}
      <section className="relative text-white min-h-[75vh] md:min-h-[85vh] flex items-end overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={destinationImage.url}
            alt={destinationImage.alt}
            className="w-full h-full object-cover"
          />
          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-ocean-900/30 via-transparent to-seafoam-900/20" />
        </div>

        {/* Animated floating elements */}
        <div className="absolute top-20 right-10 w-24 h-24 bg-ocean-400/10 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-32 left-20 w-32 h-32 bg-seafoam-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

        {/* Breadcrumbs - Top */}
        <div className="absolute top-4 left-0 right-0 z-20">
          <div className="container">
            <nav className="flex items-center gap-2 text-xs md:text-sm text-white/80 bg-black/20 backdrop-blur-sm px-3 py-2 rounded-full w-fit">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/destinations" className="hover:text-white">Destinations</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">{destination.name}</span>
            </nav>
          </div>
        </div>

        {/* Content - Bottom */}
        <div className="container pb-24 md:pb-28 relative z-10 w-full">
          <div className="max-w-4xl animate-slide-up">
            <div className="flex items-center gap-2.5 mb-4 md:mb-6">
              <div className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-base md:text-lg text-white capitalize font-semibold [text-shadow:_0_2px_8px_rgba(0,0,0,0.8)]">
                {destination.region.replace('-', ' ')} • {destination.type.replace('-', ' ')}
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-5 md:mb-7 leading-tight tracking-tight text-white [text-shadow:_0_2px_10px_rgba(0,0,0,0.9),_0_4px_20px_rgba(0,0,0,0.7),_0_0_40px_rgba(0,0,0,0.5)]">
              {destination.name}
            </h1>

            <p className="text-xl md:text-2xl text-white max-w-3xl mb-8 md:mb-10 leading-relaxed [text-shadow:_0_2px_8px_rgba(0,0,0,0.7)]">
              Which area in {destination.name} matches your travel style? Compare neighborhoods, beaches, and local insights before you book.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="#guides"
                className="w-full sm:w-auto px-8 py-4 bg-white text-ocean-600 font-bold rounded-2xl hover:bg-ocean-50 transition-all shadow-large hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Sparkles className="w-5 h-5 flex-shrink-0" />
                <span>Explore Guides</span>
              </Link>
              <Link
                href="#guides"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/20 hover:border-white/50 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <ArrowDown className="w-5 h-5 flex-shrink-0" />
                <span>Compare Areas</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Gradient Overlay - Ensures text visibility on all backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 pointer-events-none" />
      </section>

      {/* Main Content */}
      <div className="bg-gradient-ocean-subtle">
        <div className="container pt-12 pb-16 md:pt-16 md:pb-24">
          {/* Quick Facts - AI Optimization */}
          <div className="mb-16 mt-8 md:mt-0">
            <QuickFactsCard
              title={`${destination.name} at a Glance`}
              facts={[
                {
                  icon: <MapPin className="w-5 h-5" />,
                  label: "Region",
                  value: destination.region.replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                  color: "ocean"
                },
                {
                  icon: destination.type === 'island' ? <Waves className="w-5 h-5" /> : <Palmtree className="w-5 h-5" />,
                  label: "Type",
                  value: destination.type.replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                  color: "seafoam"
                },
                {
                  icon: <Sun className="w-5 h-5" />,
                  label: "Best Season",
                  value: "May - September",
                  color: "sand"
                },
                {
                  icon: <Users className="w-5 h-5" />,
                  label: "Ideal For",
                  value: destination.popular ? "All Travelers" : "Explorers",
                  color: "coral"
                },
                {
                  icon: <DollarSign className="w-5 h-5" />,
                  label: "Price Level",
                  value: destination.popular ? "Medium-High" : "Medium",
                  color: "ocean"
                },
                {
                  icon: <Star className="w-5 h-5" />,
                  label: "Popularity",
                  value: destination.popular ? "Top Destination" : "Hidden Gem",
                  color: "seafoam"
                },
              ]}
            />
          </div>

          {/* Why Choose This Destination - AI loves clear benefits */}
          <div className="bg-gradient-to-br from-ocean-50 to-seafoam-50 rounded-3xl border-2 border-ocean-100 p-8 md:p-10 mb-16 shadow-soft">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-ocean rounded-2xl flex items-center justify-center shadow-ocean">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Why Visit {destination.name}?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 bg-white/80 p-5 rounded-2xl border border-seafoam-100">
                <CheckCircle className="w-5 h-5 text-seafoam-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Authentic Experience</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Discover genuine Croatian culture and hospitality
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/80 p-5 rounded-2xl border border-seafoam-100">
                <CheckCircle className="w-5 h-5 text-seafoam-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Crystal Clear Waters</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Swim in some of the clearest seas in the Mediterranean
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/80 p-5 rounded-2xl border border-seafoam-100">
                <CheckCircle className="w-5 h-5 text-seafoam-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Rich History</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Explore centuries of Mediterranean history and architecture
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/80 p-5 rounded-2xl border border-seafoam-100">
                <CheckCircle className="w-5 h-5 text-seafoam-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Great Value</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Quality experience at more affordable prices than Western Europe
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Travel Guides */}
          <div id="guides" className="scroll-mt-20">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-ocean-100 text-ocean-700 rounded-full text-sm font-semibold mb-6">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Guides</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5">
                Travel Guides for {destination.name}
              </h2>
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Compare neighborhoods, find family-friendly areas, discover hidden beaches, and make the right decision for your trip.
              </p>
            </div>

            {availableGuides.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {availableGuides.map(theme => (
                  <Link
                    key={theme}
                    href={`/guides/en/${slug}-${theme}`}
                    className="group bg-white rounded-3xl border-2 border-slate-100 hover:border-ocean-300 hover:shadow-ocean transition-all p-6 hover:-translate-y-1"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${THEME_INFO[theme]?.gradient} rounded-2xl flex items-center justify-center text-white shadow-soft group-hover:scale-110 transition-transform flex-shrink-0`}>
                        {THEME_INFO[theme]?.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 mb-2 text-lg group-hover:text-ocean-600 transition-colors">
                          {THEME_INFO[theme]?.label}
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {THEME_INFO[theme]?.desc}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-ocean-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {/* Coming Soon Cards - Prioritized by AI Decision Value */}
                {[
                  { theme: 'families-with-toddlers', label: 'Families with Toddlers', desc: 'Best areas for families with young children' },
                  { theme: 'first-time-visitors', label: 'First Time Visitors', desc: 'Essential guide for newcomers to this destination' },
                  { theme: 'car-vs-no-car', label: 'Do You Need a Car?', desc: 'Whether to rent a car or use public transport' },
                  { theme: 'best-time-to-visit', label: 'Best Time to Visit', desc: 'Optimal months based on weather and crowds' },
                  { theme: 'walkability', label: 'Walkability Guide', desc: 'Can you explore this destination on foot?' },
                  { theme: 'solo-travel', label: 'Solo Travel', desc: 'Is this destination good for solo travelers?' },
                ].map((guide) => (
                  <div
                    key={guide.theme}
                    className="bg-white/70 rounded-3xl border-2 border-slate-200 p-6 relative overflow-hidden"
                  >
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-ocean-100 text-ocean-700 text-xs font-bold rounded-full">
                        <TrendingUp className="w-3 h-3" />
                        Coming Soon
                      </span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                        {THEME_INFO[guide.theme as Theme]?.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-700 mb-2 text-lg">
                          {guide.label}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {guide.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Nearby Destinations */}
            {nearbyDestinations.length > 0 && (
              <div className="mt-20">
                <div className="text-center mb-12">
                  <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                    Explore Nearby
                  </h3>
                  <p className="text-lg text-slate-600">
                    More destinations in {destination.region.replace('-', ' ')}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {nearbyDestinations.map(dest => (
                    <Link
                      key={dest.slug}
                      href={`/destinations/${dest.slug}`}
                      className="group flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border-2 border-slate-100 hover:border-ocean-300 hover:shadow-soft transition-all hover:-translate-y-1"
                    >
                      <div className="w-12 h-12 bg-gradient-ocean-subtle rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MapPin className="w-6 h-6 text-ocean-600" />
                      </div>
                      <span className="text-sm md:text-base font-bold text-slate-900 group-hover:text-ocean-600 transition-colors text-center">
                        {dest.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Widget */}
            <div className="mt-20 p-8 md:p-10 bg-white rounded-3xl border-2 border-slate-100 shadow-soft">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-ocean rounded-2xl flex items-center justify-center shadow-ocean">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                    Ready to Book?
                  </h3>
                  <p className="text-slate-600 text-lg">
                    If you've already decided which area suits you, check availability below.
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
