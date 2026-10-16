import { Link } from '@/i18n/navigation';
import { MapPin, Car, Calendar, ChevronRight, Compass, Home, HelpCircle, Navigation } from 'lucide-react';
import AnimatedFaq from '@/components/ui/AnimatedFaq';

export interface DestinationHubContent {
  title: string;
  metaDescription: string;
  intro: string;
  quickFacts: { label: string; value: string }[];
  areas: { name: string; bestFor: string; parking: string; beach: string; summary: string }[];
  gettingThere: { from: string; car: string; other: string }[];
  whenToGo: string;
  faq: { question: string; answer: string }[];
  headings: {
    quickFacts: string;
    whereToStay: string;
    gettingThere: string;
    whenToGo: string;
    guides: string;
    faq: string;
    groups: Record<GuideGroup, string>;
    car: string;
    other: string;
    bestFor: string;
    parking: string;
    beach: string;
  };
  updatedAt?: string;
}

export type GuideGroup =
  | 'gettingAround' | 'planning' | 'timing' | 'travelers'
  | 'activities' | 'food' | 'comparisons' | 'practical';

const GROUP_ORDER: GuideGroup[] = [
  'gettingAround', 'planning', 'timing', 'activities', 'travelers', 'food', 'comparisons', 'practical',
];

// Which hub section each guide theme belongs to (unknown themes → practical)
const THEME_GROUP: Record<string, GuideGroup> = {
  'parking-difficulty': 'gettingAround', 'parking': 'gettingAround', 'car-vs-no-car': 'gettingAround',
  'public-transport-quality': 'gettingAround', 'ferry-connections': 'gettingAround', 'airport-access': 'gettingAround',
  'walkability': 'gettingAround', 'transport': 'gettingAround', 'ev-charging': 'gettingAround', 'road-trip': 'gettingAround',
  'where-to-stay': 'planning', 'apartments': 'planning', 'budget': 'planning', 'luxury': 'planning', 'prices': 'planning',
  'cost-guide': 'planning', 'price-2027': 'planning', 'itinerary': 'planning', 'first-time-visitors': 'planning',
  'is-it-worth-it': 'planning', 'pool': 'planning',
  'best-time-to-visit': 'timing', 'weather-by-month': 'timing', 'weather': 'timing', 'crowds-by-month': 'timing',
  'peak-season': 'timing', 'off-season': 'timing', 'shoulder-season': 'timing', 'advent': 'timing',
  'families-with-toddlers': 'travelers', 'families-with-teens': 'travelers', 'family': 'travelers', 'couples': 'travelers',
  'solo-travel': 'travelers', 'seniors': 'travelers', 'pet-friendly': 'travelers', 'with-a-dog': 'travelers',
  'stroller-friendly': 'travelers', 'wheelchair-access': 'travelers', 'lgbt-friendly': 'travelers',
  'digital-nomads': 'travelers', 'safety-for-women': 'travelers', 'remote-work-cafes': 'travelers',
  'beach': 'activities', 'things-to-do': 'activities', 'day-trips': 'activities', 'hidden-gems': 'activities',
  'island-hopping': 'activities', 'sailing': 'activities', 'hiking': 'activities', 'snorkeling-and-diving': 'activities',
  'camping-and-glamping': 'activities', 'photo-spots': 'activities', 'rainy-day': 'activities', 'nightlife': 'activities',
  'history-and-culture': 'activities', 'game-of-thrones': 'activities', 'worth-the-day-trip': 'activities',
  'restaurants': 'food', 'local-food': 'food', 'food-and-wine': 'food',
  'coast-vs-inland': 'comparisons', 'overtourism-alternatives': 'comparisons',
};

function groupOf(theme: string): GuideGroup {
  if (theme.startsWith('vs-')) return 'comparisons';
  return THEME_GROUP[theme] ?? 'practical';
}

export default function DestinationHub({
  hub,
  slug,
  guides,
}: {
  hub: DestinationHubContent;
  slug: string;
  guides: { theme: string; title: string }[];
}) {
  const h = hub.headings;
  const grouped = GROUP_ORDER
    .map(group => ({ group, items: guides.filter(g => groupOf(g.theme) === group) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="space-y-10 md:space-y-16">
      {/* Intro + quick facts */}
      <section className="bg-white rounded-2xl md:rounded-3xl border-2 border-slate-100 p-5 sm:p-6 md:p-8 shadow-soft">
        <div className="space-y-4 text-base md:text-lg text-slate-700 leading-relaxed mb-6 md:mb-8">
          {hub.intro.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">{h.quickFacts}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {hub.quickFacts.map(f => (
            <div key={f.label} className="bg-gradient-to-br from-ocean-50 to-seafoam-50 rounded-xl p-3 sm:p-4 border border-ocean-100">
              <dt className="text-xs sm:text-sm text-slate-500 font-medium mb-0.5">{f.label}</dt>
              <dd className="text-sm sm:text-base font-semibold text-slate-900">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Where to stay */}
      <section aria-labelledby="where-to-stay">
        <h2 id="where-to-stay" className="flex items-center gap-2 text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-4 md:mb-6">
          <Home className="w-6 h-6 text-ocean-500" aria-hidden="true" /> {h.whereToStay}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {hub.areas.map(area => (
            <article key={area.name} className="bg-white rounded-2xl border-2 border-slate-100 p-4 sm:p-5">
              <h3 className="flex items-center gap-2 font-bold text-slate-900 text-base sm:text-lg mb-2">
                <MapPin className="w-4 h-4 text-coral-500 flex-shrink-0" aria-hidden="true" /> {area.name}
              </h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3">{area.summary}</p>
              <dl className="text-xs sm:text-sm space-y-1">
                <div><dt className="inline font-semibold text-slate-600">{h.bestFor}: </dt><dd className="inline text-slate-700">{area.bestFor}</dd></div>
                <div><dt className="inline font-semibold text-slate-600">{h.parking}: </dt><dd className="inline text-slate-700">{area.parking}</dd></div>
                <div><dt className="inline font-semibold text-slate-600">{h.beach}: </dt><dd className="inline text-slate-700">{area.beach}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      {/* Getting there */}
      <section aria-labelledby="getting-there">
        <h2 id="getting-there" className="flex items-center gap-2 text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-4 md:mb-6">
          <Navigation className="w-6 h-6 text-ocean-500" aria-hidden="true" /> {h.gettingThere}
        </h2>
        <div className="bg-white rounded-2xl border-2 border-slate-100 divide-y divide-slate-100">
          {hub.gettingThere.map(g => (
            <div key={g.from} className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-[11rem_1fr_1fr] gap-2 md:gap-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 break-words">{g.from}</h3>
              <p className="text-sm text-slate-700"><Car className="inline w-4 h-4 mr-1 text-slate-400" aria-hidden="true" /><span className="sr-only">{h.car}: </span>{g.car}</p>
              <p className="text-sm text-slate-700"><span className="font-semibold text-slate-600">{h.other}: </span>{g.other}</p>
            </div>
          ))}
        </div>
      </section>

      {/* When to go */}
      <section aria-labelledby="when-to-go" className="bg-gradient-to-br from-sand-50 to-white rounded-2xl md:rounded-3xl border-2 border-sand-100 p-5 sm:p-6 md:p-8">
        <h2 id="when-to-go" className="flex items-center gap-2 text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-3 md:mb-4">
          <Calendar className="w-6 h-6 text-sand-600" aria-hidden="true" /> {h.whenToGo}
        </h2>
        <p className="text-base md:text-lg text-slate-700 leading-relaxed">{hub.whenToGo}</p>
      </section>

      {/* Guides, grouped by what the reader is deciding */}
      {grouped.length > 0 && (
        <section id="guides" aria-labelledby="hub-guides" className="scroll-mt-20">
          <h2 id="hub-guides" className="flex items-center gap-2 text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-4 md:mb-6">
            <Compass className="w-6 h-6 text-ocean-500" aria-hidden="true" /> {h.guides}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {grouped.map(({ group, items }) => (
              <div key={group} className="bg-white rounded-2xl border-2 border-slate-100 p-4 sm:p-5">
                <h3 className="font-bold text-slate-900 mb-3">{h.groups[group]}</h3>
                <ul className="space-y-2">
                  {items.map(g => (
                    <li key={g.theme}>
                      <Link
                        href={`/guides/${slug}-${g.theme}`}
                        className="group flex items-start gap-2 text-sm sm:text-base text-slate-700 hover:text-ocean-600"
                      >
                        <ChevronRight className="w-4 h-4 mt-1 text-ocean-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                        <span className="group-hover:underline underline-offset-2">{g.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {hub.faq.length > 0 && (
        <section aria-labelledby="hub-faq">
          <h2 id="hub-faq" className="flex items-center gap-2 text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-4 md:mb-6">
            <HelpCircle className="w-6 h-6 text-ocean-500" aria-hidden="true" /> {h.faq}
          </h2>
          <AnimatedFaq items={hub.faq} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: hub.faq.map(f => ({
                  '@type': 'Question',
                  name: f.question,
                  acceptedAnswer: { '@type': 'Answer', text: f.answer },
                })),
              }),
            }}
          />
        </section>
      )}
    </div>
  );
}
