import {
  CheckCircle, XCircle, AlertTriangle, MapPin,
  Star, Footprints, Volume2, Shield, Wallet,
  Users, Baby, Heart, User, Laptop,
  UtensilsCrossed, Waves, ParkingCircle, ShoppingBag,
  Music, Landmark, Pill, Coffee, Sparkles,
  Calendar, TrendingUp, ExternalLink, Accessibility, Search
} from 'lucide-react';
import { ScoreBar, ScoreBadge, ScoreColor } from './shared';

// Inline type to avoid importing from scripts/ (which has Node.js deps)
export interface StayCheckDestinationData {
  destination: string;
  destinationName: string;
  region: string;
  lat: number;
  lng: number;
  generatedAt: string;
  areaData: Record<string, { name: string; rating: number; reviewCount: number; distance: number; type: string; googleMapsUrl: string }[]>;
  scores: {
    overallScore: number;
    categories: { category: string; score: number; label: string; details: string }[];
    guestTypeScores: Record<string, { score: number; comment: string }>;
  };
  reviewAnalysis: {
    totalReviewsAnalyzed: number;
    patterns: { pattern: string; sentiment: 'positive' | 'negative' | 'neutral'; confidence: number; mentionCount: number; totalReviews: number; exampleQuotes: string[]; category: string }[];
    seasonalInsights: { month: string; reviewCount: number; avgRating: number; commonThemes: string[] }[];
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analysis: any;
  bookingLinks: { booking: string; airbnb: string; apartmanija: string };
}

interface StayCheckAreaReportProps {
  data: StayCheckDestinationData;
}

const GUEST_TYPE_CONFIG: Record<string, { label: string; icon: typeof Users; description: string }> = {
  family: { label: 'Families', icon: Baby, description: 'Traveling with children' },
  couple: { label: 'Couples', icon: Heart, description: 'Romantic getaway' },
  group: { label: 'Groups', icon: Users, description: 'Friends trip' },
  solo: { label: 'Solo', icon: User, description: 'Independent travel' },
  'digital-nomad': { label: 'Digital Nomads', icon: Laptop, description: 'Work & travel' },
};

const CATEGORY_ICONS: Record<string, typeof UtensilsCrossed> = {
  restaurants: UtensilsCrossed,
  cafes: Coffee,
  beach: Waves,
  parking: ParkingCircle,
  supermarkets: ShoppingBag,
  nightlife: Music,
  attractions: Landmark,
  pharmacies: Pill,
  quiet: Volume2,
  walkability: Footprints,
  budget: Wallet,
};

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function StayCheckAreaReport({ data }: StayCheckAreaReportProps) {
  const { scores, reviewAnalysis, bookingLinks, areaData } = data;
  const a: any = data.analysis;
  const analysis = {
    shortSummary: a.shortSummary as string || '',
    pros: (a.pros || []) as string[],
    cons: (a.cons || []) as string[],
    risks: (a.risks || []) as string[],
    realityCheck: a.realityCheck as string || '',
    finalAdvice: a.finalAdvice as string || '',
    alternativeAreas: (a.alternativeAreas || []) as { name: string; pros: string[]; cons: string[]; bookingSearchQuery: string }[],
    seasonalAdvice: a.seasonalAdvice as string || '',
    budgetEstimate: (a.budgetEstimate || { dailyLow: 0, dailyHigh: 0, tips: [] }) as { dailyLow: number; dailyHigh: number; tips: string[] },
    walkabilityDescription: a.walkabilityDescription as string || '',
    noiseAssessment: a.noiseAssessment as string || '',
    familySafetyNotes: (a.familySafetyNotes || []) as string[],
    beachReport: a.beachReport as { beaches: { name: string; distance: string; type: string; waterEntry: string; kidsSafe: boolean; disabilityAccess: string; facilities: string; crowding: string; bestQuote: string }[]; bestForKids: string; bestForRelaxing: string } | null,
    accessibilityReport: a.accessibilityReport as { wheelchairFriendly: string; beachAccess: string; terrain: string; notes: string[] } | null,
    townCenterInfo: a.townCenterInfo as string || '',
    scoreExplanation: a.scoreExplanation as string || '',
    bestRestaurant: a.bestRestaurant as { name: string; distance: string; whyBest: string; priceRange: string } | null,
    worstRestaurant: a.worstRestaurant as { name: string; distance: string; whyWorst: string } | null,
    topFinds: (a.topFinds || []) as string[],
    petFriendly: a.petFriendly as string || '',
    priceComparison: a.priceComparison as { thisArea: string; guestVerdict: string; specificPrices: string[]; note: string } | null,
  };

  const generatedDate = new Date(data.generatedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build a lookup: normalized name → googleMapsUrl from areaData
  const placeLinks = new Map<string, string>();
  for (const places of Object.values(areaData)) {
    if (!Array.isArray(places)) continue;
    for (const p of places) {
      if (p?.name && p?.googleMapsUrl) {
        placeLinks.set(p.name.toLowerCase().trim(), p.googleMapsUrl);
      }
    }
  }

  function findPlaceLink(name: string | undefined): string | null {
    if (!name) return null;
    const key = name.toLowerCase().trim();
    if (placeLinks.has(key)) return placeLinks.get(key)!;
    for (const [k, url] of placeLinks) {
      if (k.includes(key) || key.includes(k)) return url;
    }
    return null;
  }

  function PlaceName({ name, className = '' }: { name: string; className?: string }) {
    const url = findPlaceLink(name);
    if (url) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className={`${className} hover:underline inline-flex items-center gap-1`}>
          {name}<ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
        </a>
      );
    }
    return <span className={className}>{name}</span>;
  }

  return (
    <article className="w-full max-w-4xl mx-auto space-y-6">

      {/* HERO - Score & Summary */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
        <div className="bg-gradient-to-r from-ocean-500 to-seafoam-500 p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-ocean-100 text-sm font-medium mb-1">
                Area Review &middot; {data.region.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}, Croatia
              </p>
              <h2 className="text-2xl md:text-3xl font-bold">{data.destinationName} Area Report</h2>
              <p className="text-ocean-50 text-sm mt-1">
                Based on {reviewAnalysis.totalReviewsAnalyzed} real guest reviews from nearby places
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className={`text-5xl font-bold ${
                  scores.overallScore >= 70 ? 'text-white' : scores.overallScore >= 40 ? 'text-sand-200' : 'text-coral-200'
                }`}>
                  {scores.overallScore}
                </div>
                <div className="text-sm text-ocean-100">/ 100</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <p className="text-lg text-slate-700 leading-relaxed">{analysis.shortSummary}</p>
          {analysis.scoreExplanation && (
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">{analysis.scoreExplanation}</p>
          )}
        </div>
      </section>

      {/* GUEST TYPE SCORES - Key differentiator for SEO */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-ocean-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-ocean-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Who is {data.destinationName} best for?</h2>
            <p className="text-xs text-slate-500">Score based on area amenities for each traveler type</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(scores.guestTypeScores).map(([type, { score, comment }]) => {
            const config = GUEST_TYPE_CONFIG[type];
            if (!config) return null;
            const Icon = config.icon;
            const colorName = ScoreColor(score);
            return (
              <div key={type} className={`p-4 rounded-2xl border bg-gradient-to-br from-${colorName}-50/50 to-white border-${colorName}-100`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 text-${colorName}-600`} />
                    <span className="font-bold text-slate-800">{config.label}</span>
                  </div>
                  <ScoreBadge score={score} />
                </div>
                <ScoreBar score={score} size="sm" />
                <p className="text-xs text-slate-600 mt-2">{comment}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* PROS / CONS / RISKS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-seafoam-100 shadow-soft p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-seafoam-500" />
            <h2 className="font-bold text-slate-900">Advantages</h2>
          </div>
          <ul className="space-y-2.5">
            {analysis.pros.map((pro, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-seafoam-500 mt-0.5 flex-shrink-0">+</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-3xl border border-coral-100 shadow-soft p-6">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-coral-500" />
            <h2 className="font-bold text-slate-900">Disadvantages</h2>
          </div>
          <ul className="space-y-2.5">
            {analysis.cons.map((con, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-coral-500 mt-0.5 flex-shrink-0">-</span>
                {con}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-3xl border border-sand-100 shadow-soft p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-sand-500" />
            <h2 className="font-bold text-slate-900">Risks</h2>
          </div>
          <ul className="space-y-2.5">
            {analysis.risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-sand-500 mt-0.5 flex-shrink-0">!</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* REALITY CHECK */}
      <section className="bg-gradient-to-br from-ocean-50 to-seafoam-50 rounded-3xl border border-ocean-100 p-6 md:p-8">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-ocean-600" />
          <h2 className="font-bold text-slate-900">Reality Check</h2>
        </div>
        <p className="text-slate-700 leading-relaxed">{analysis.realityCheck}</p>
        {analysis.townCenterInfo && (
          <p className="text-sm text-slate-600 mt-3">{analysis.townCenterInfo}</p>
        )}
      </section>

      {/* BEACH REPORT */}
      {analysis.beachReport && analysis.beachReport.beaches && analysis.beachReport.beaches.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-ocean-100 rounded-xl flex items-center justify-center">
              <Waves className="w-5 h-5 text-ocean-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Beach Report</h2>
              <p className="text-xs text-slate-500">{analysis.beachReport.beaches.length} beaches analyzed</p>
            </div>
          </div>

          {(analysis.beachReport.bestForKids || analysis.beachReport.bestForRelaxing) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {analysis.beachReport.bestForKids && (
                <div className="p-3 bg-seafoam-50 rounded-xl border border-seafoam-100">
                  <p className="text-xs font-bold text-seafoam-700 mb-1">Best for kids</p>
                  <p className="text-sm text-slate-700">{analysis.beachReport.bestForKids}</p>
                </div>
              )}
              {analysis.beachReport.bestForRelaxing && (
                <div className="p-3 bg-ocean-50 rounded-xl border border-ocean-100">
                  <p className="text-xs font-bold text-ocean-700 mb-1">Best for relaxing</p>
                  <p className="text-sm text-slate-700">{analysis.beachReport.bestForRelaxing}</p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            {analysis.beachReport.beaches.map((beach, i) => (
              <div key={i} className="p-4 rounded-2xl bg-gradient-to-br from-ocean-50/50 to-white border border-ocean-100/50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800"><PlaceName name={beach.name} className="font-bold text-slate-800" /></h3>
                  <span className="text-xs bg-ocean-100 text-ocean-700 px-2 py-1 rounded-full">{beach.distance}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs">
                  <div className="bg-white rounded-lg p-2 border border-slate-100">
                    <span className="text-slate-400 block">Type</span>
                    <span className="font-medium text-slate-700">{beach.type}</span>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-100">
                    <span className="text-slate-400 block">Water entry</span>
                    <span className="font-medium text-slate-700">{beach.waterEntry}</span>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-100">
                    <span className="text-slate-400 block">Kids safe</span>
                    <span className={`font-medium ${beach.kidsSafe ? 'text-seafoam-600' : 'text-coral-600'}`}>
                      {beach.kidsSafe ? 'Yes' : 'Caution'}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-100">
                    <span className="text-slate-400 block">Crowding</span>
                    <span className="font-medium text-slate-700">{beach.crowding}</span>
                  </div>
                </div>
                {beach.facilities && (
                  <p className="text-xs text-slate-500 mb-2">Facilities: {beach.facilities}</p>
                )}
                {beach.disabilityAccess && beach.disabilityAccess !== 'unknown' && (
                  <p className="text-xs text-slate-500 mb-2">Accessibility: {beach.disabilityAccess}</p>
                )}
                {beach.bestQuote && (
                  <p className="text-xs text-slate-500 italic">&ldquo;{beach.bestQuote}&rdquo;</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BEST & WORST RESTAURANTS */}
      {(analysis.bestRestaurant || analysis.worstRestaurant) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.bestRestaurant && (
            <div className="bg-white rounded-3xl border border-seafoam-100 shadow-soft p-6">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-seafoam-500 fill-seafoam-500" />
                <h2 className="font-bold text-slate-900">Best Restaurant Nearby</h2>
              </div>
              <h3 className="font-bold text-slate-800 mb-1"><PlaceName name={analysis.bestRestaurant.name} className="font-bold text-slate-800" /></h3>
              <p className="text-xs text-slate-500 mb-2">{analysis.bestRestaurant.distance} &middot; {analysis.bestRestaurant.priceRange}</p>
              <p className="text-sm text-slate-700">{analysis.bestRestaurant.whyBest}</p>
            </div>
          )}
          {analysis.worstRestaurant && (
            <div className="bg-white rounded-3xl border border-coral-100 shadow-soft p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-coral-500" />
                <h2 className="font-bold text-slate-900">Restaurant to Avoid</h2>
              </div>
              <h3 className="font-bold text-slate-800 mb-1"><PlaceName name={analysis.worstRestaurant.name} className="font-bold text-slate-800" /></h3>
              <p className="text-xs text-slate-500 mb-2">{analysis.worstRestaurant.distance}</p>
              <p className="text-sm text-slate-700">{analysis.worstRestaurant.whyWorst}</p>
            </div>
          )}
        </section>
      )}

      {/* TOP FINDS */}
      {analysis.topFinds.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-sand-500" />
            <h2 className="font-bold text-slate-900">Hidden Gems & Top Finds</h2>
          </div>
          <ul className="space-y-2.5">
            {analysis.topFinds.map((find, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-sand-500 mt-0.5 flex-shrink-0">&#9733;</span>
                {find}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* AREA CATEGORY SCORES */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-ocean-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-ocean-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Area Scores</h2>
            <p className="text-xs text-slate-500">Based on availability, quality, and proximity of amenities</p>
          </div>
        </div>
        <div className="space-y-3">
          {scores.categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.category] || MapPin;
            return (
              <div key={cat.category} className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="w-24 text-sm font-medium text-slate-700 flex-shrink-0">{cat.label}</div>
                <div className="flex-1">
                  <ScoreBar score={cat.score} size="sm" />
                </div>
                <ScoreBadge score={cat.score} />
              </div>
            );
          })}
        </div>
      </section>

      {/* WALKABILITY */}
      {analysis.walkabilityDescription && (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <Footprints className="w-5 h-5 text-ocean-600" />
            <h2 className="font-bold text-slate-900">Walkability</h2>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{analysis.walkabilityDescription}</p>
        </section>
      )}

      {/* NOISE & BUDGET */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysis.noiseAssessment && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-5 h-5 text-ocean-600" />
              <h2 className="font-bold text-slate-900">Noise Levels</h2>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.noiseAssessment}</p>
          </div>
        )}
        {analysis.budgetEstimate && analysis.budgetEstimate.dailyHigh > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-5 h-5 text-seafoam-600" />
              <h2 className="font-bold text-slate-900">Daily Budget</h2>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl font-bold text-slate-900">
                &euro;{analysis.budgetEstimate.dailyLow}&ndash;{analysis.budgetEstimate.dailyHigh}
              </span>
              <span className="text-sm text-slate-500">per person / day</span>
            </div>
            {analysis.budgetEstimate.tips.length > 0 && (
              <ul className="space-y-1.5">
                {analysis.budgetEstimate.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <span className="text-seafoam-500 mt-0.5 flex-shrink-0">&#8226;</span>
                    {tip}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* PRICE REPORT */}
      {analysis.priceComparison && (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-ocean-600" />
            <h2 className="font-bold text-slate-900">Price Report</h2>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-slate-700">{analysis.priceComparison.thisArea}</p>
            <p className="text-sm font-medium text-slate-800">{analysis.priceComparison.guestVerdict}</p>
            {analysis.priceComparison.specificPrices.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-600 mb-2">Real prices from reviews:</p>
                <ul className="space-y-1">
                  {analysis.priceComparison.specificPrices.map((price, i) => (
                    <li key={i} className="text-xs text-slate-600">&bull; {price}</li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.priceComparison.note && (
              <p className="text-xs text-slate-400">{analysis.priceComparison.note}</p>
            )}
          </div>
        </section>
      )}

      {/* REVIEW PATTERNS */}
      {reviewAnalysis.patterns.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-ocean-600" />
            <h2 className="font-bold text-slate-900">What Guests Are Saying</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {reviewAnalysis.patterns.slice(0, 8).map((pattern, i) => {
              const sentimentColor = pattern.sentiment === 'positive'
                ? 'border-seafoam-100 bg-seafoam-50/50'
                : pattern.sentiment === 'negative'
                  ? 'border-coral-100 bg-coral-50/50'
                  : 'border-slate-100 bg-slate-50/50';
              const icon = pattern.sentiment === 'positive' ? '&#9650;' : pattern.sentiment === 'negative' ? '&#9660;' : '&#9654;';
              const iconColor = pattern.sentiment === 'positive' ? 'text-seafoam-500' : pattern.sentiment === 'negative' ? 'text-coral-500' : 'text-slate-400';
              return (
                <div key={i} className={`p-3 rounded-xl border ${sentimentColor}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-800">{pattern.pattern}</span>
                    <span className={`text-xs ${iconColor}`} dangerouslySetInnerHTML={{ __html: icon }} />
                  </div>
                  <p className="text-xs text-slate-500 mb-1.5">
                    {pattern.mentionCount} of {pattern.totalReviews} reviews
                  </p>
                  {pattern.exampleQuotes[0] && (
                    <p className="text-xs text-slate-500 italic">&ldquo;{pattern.exampleQuotes[0].substring(0, 120)}{pattern.exampleQuotes[0].length > 120 ? '...' : ''}&rdquo;</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SEASONAL ADVICE */}
      {analysis.seasonalAdvice && (
        <section className="bg-gradient-to-br from-sand-50 to-white rounded-3xl border border-sand-100 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-sand-600" />
            <h2 className="font-bold text-slate-900">When to Visit</h2>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{analysis.seasonalAdvice}</p>
        </section>
      )}

      {/* ACCESSIBILITY */}
      {analysis.accessibilityReport && (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
          <div className="flex items-center gap-2 mb-3">
            <Accessibility className="w-5 h-5 text-ocean-600" />
            <h2 className="font-bold text-slate-900">Accessibility</h2>
          </div>
          <div className="space-y-2 text-sm text-slate-700">
            <p><strong>Wheelchair:</strong> {analysis.accessibilityReport.wheelchairFriendly}</p>
            <p><strong>Beach access:</strong> {analysis.accessibilityReport.beachAccess}</p>
            <p><strong>Terrain:</strong> {analysis.accessibilityReport.terrain}</p>
            {analysis.accessibilityReport.notes.length > 0 && (
              <ul className="mt-2 space-y-1">
                {analysis.accessibilityReport.notes.map((note, i) => (
                  <li key={i} className="text-xs text-slate-600">&bull; {note}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* FAMILY SAFETY */}
      {analysis.familySafetyNotes.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-seafoam-600" />
            <h2 className="font-bold text-slate-900">Family & Safety Notes</h2>
          </div>
          <ul className="space-y-2">
            {analysis.familySafetyNotes.map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-seafoam-500 mt-0.5 flex-shrink-0">&#10003;</span>
                {note}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* PET FRIENDLY */}
      {analysis.petFriendly && (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">&#128054;</span>
            <h2 className="font-bold text-slate-900">Pet Friendly</h2>
          </div>
          <p className="text-sm text-slate-700">{analysis.petFriendly}</p>
        </section>
      )}

      {/* FINAL VERDICT */}
      <section className="bg-gradient-to-br from-ocean-500 via-ocean-400 to-seafoam-400 rounded-3xl p-6 md:p-8 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5" />
          <h2 className="font-bold text-lg">Final Verdict</h2>
        </div>
        <p className="leading-relaxed text-ocean-50">{analysis.finalAdvice}</p>
      </section>

      {/* ALTERNATIVE AREAS */}
      {analysis.alternativeAreas.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6 md:p-8">
          <h2 className="font-bold text-slate-900 mb-4">Also Consider These Nearby Areas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.alternativeAreas.map((alt, i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 mb-2">{alt.name}</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-xs font-bold text-seafoam-600 mb-1">Pros</p>
                    <ul className="space-y-0.5">
                      {alt.pros.map((p, j) => (
                        <li key={j} className="text-xs text-slate-600">+ {p}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-coral-600 mb-1">Cons</p>
                    <ul className="space-y-0.5">
                      {alt.cons.map((c, j) => (
                        <li key={j} className="text-xs text-slate-600">- {c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <a
                  href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(alt.bookingSearchQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-ocean-600 hover:text-ocean-700 font-medium"
                >
                  Search on Booking.com <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA - Try interactive tool */}
      <section className="bg-gradient-to-br from-coral-50 to-sand-50 rounded-3xl border border-coral-100 p-6 md:p-8 text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-coral-400 to-coral-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft">
          <Search className="w-7 h-7 text-white" />
        </div>
        <h2 className="font-bold text-slate-900 text-lg mb-2">Have a Specific Accommodation?</h2>
        <p className="text-sm text-slate-600 mb-4 max-w-lg mx-auto">
          Paste your Booking.com or Airbnb link to get a personalized report tailored to your travel style and priorities.
        </p>
        <a
          href="/stay-check"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-coral-500 to-coral-600 text-white font-bold rounded-xl hover:from-coral-600 hover:to-coral-700 transition-all shadow-soft"
        >
          <Search className="w-4 h-4" />
          Try Stay Check
        </a>
      </section>

      {/* VISIBLE FAQ — matches StayCheckAreaSchema dynamic FAQ */}
      {(() => {
        const faqs: { q: string; a: string }[] = [];
        if (analysis.seasonalAdvice) faqs.push({ q: `When is the best time to visit ${data.destinationName}?`, a: analysis.seasonalAdvice });
        if (analysis.budgetEstimate && analysis.budgetEstimate.dailyHigh > 0) faqs.push({ q: `How much does it cost per day in ${data.destinationName}?`, a: `Budget approximately €${analysis.budgetEstimate.dailyLow}–${analysis.budgetEstimate.dailyHigh} per person per day. ${analysis.budgetEstimate.tips?.[0] || ''}` });
        if (analysis.beachReport && analysis.beachReport.beaches && analysis.beachReport.beaches.length > 0) {
          const br = analysis.beachReport;
          const names = br.beaches.map(b => b.name).join(', ');
          faqs.push({ q: `What are the best beaches near ${data.destinationName}?`, a: `Nearby beaches: ${names}. ${br.bestForKids ? `Best for kids: ${br.bestForKids}.` : ''} ${br.bestForRelaxing ? `Best for relaxing: ${br.bestForRelaxing}.` : ''}` });
        }
        if (analysis.walkabilityDescription) faqs.push({ q: `Is ${data.destinationName} walkable?`, a: analysis.walkabilityDescription });
        if (analysis.noiseAssessment) faqs.push({ q: `Is ${data.destinationName} noisy at night?`, a: analysis.noiseAssessment });
        const familyScore = scores.guestTypeScores?.family;
        if (familyScore) faqs.push({ q: `Is ${data.destinationName} good for families?`, a: `${data.destinationName} scores ${familyScore.score}/100 for families. ${familyScore.comment}` });

        if (faqs.length === 0) return null;
        return (
          <section className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6 md:p-8">
            <h2 className="font-bold text-slate-900 text-lg mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <details key={i} className="group border border-slate-100 rounded-xl">
                  <summary className="flex items-center justify-between p-4 cursor-pointer list-none text-sm font-semibold text-slate-800 hover:text-ocean-600 transition-colors">
                    {faq.q}
                    <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed">{faq.a}</div>
                </details>
              ))}
            </div>
          </section>
        );
      })()}

      {/* DATA FRESHNESS DISCLAIMER */}
      <div className="text-center text-xs text-slate-400 py-4">
        <p>
          Data collected {generatedDate} from {reviewAnalysis.totalReviewsAnalyzed} Google reviews of nearby places.
          Conditions may have changed. <a href="/stay-check" className="underline hover:text-slate-500">Get a live analysis</a>.
        </p>
      </div>
    </article>
  );
}
