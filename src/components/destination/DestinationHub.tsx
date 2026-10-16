import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { MapPin, Car, Calendar, Compass, Home, HelpCircle, Navigation, Users, Waves, Utensils, Scale, Info, ClipboardList, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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

const GROUP_ICON: Record<GuideGroup, LucideIcon> = {
  gettingAround: Car,
  planning: ClipboardList,
  timing: Sun,
  travelers: Users,
  activities: Waves,
  food: Utensils,
  comparisons: Scale,
  practical: Info,
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
  guides: { theme: string; title: string; imageUrl?: string }[];
}) {
  const h = hub.headings;
  const grouped = GROUP_ORDER
    .map(group => ({ group, items: guides.filter(g => groupOf(g.theme) === group) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="space-y-10 md:space-y-16">
      {/* Jump bar */}
      <nav className="-mb-4 flex gap-2 overflow-x-auto pb-1" aria-label={h.guides}>
        {[
          ['#where-to-stay', h.whereToStay, Home],
          ['#getting-there', h.gettingThere, Navigation],
          ['#when-to-go', h.whenToGo, Calendar],
          ['#guides', h.guides, Compass],
          ['#hub-faq', h.faq, HelpCircle],
        ].map(([href, label, Icon]) => {
          const I = Icon as LucideIcon;
          return (
            <a
              key={href as string}
              href={href as string}
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ocean-800 shadow-sm ring-1 ring-ocean-900/[0.06] transition hover:bg-ocean-800 hover:text-white"
            >
              <I className="w-4 h-4" aria-hidden="true" />
              {label as string}
            </a>
          );
        })}
      </nav>

      {/* Intro + quick facts */}
      <section className="rounded-2xl bg-white shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.12)] ring-1 ring-ocean-900/[0.06] p-5 sm:p-6 md:p-8">
        <div className="space-y-4 text-[17px] md:text-lg text-slate-800 leading-relaxed mb-6 md:mb-8">
          {hub.intro.split(/\n\n+/).map((p, i) => <p key={i} className="text-[17px] md:text-lg leading-relaxed text-slate-800">{p}</p>)}
        </div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-ocean-700 mb-4">{h.quickFacts}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {hub.quickFacts.map(f => (
            <div key={f.label} className="rounded-xl bg-ocean-50/70 p-3 sm:p-4 ring-1 ring-ocean-100">
              <dt className="text-xs sm:text-sm text-slate-500 font-medium mb-0.5">{f.label}</dt>
              <dd className="text-sm sm:text-base font-semibold text-slate-900">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Where to stay */}
      <section aria-labelledby="where-to-stay">
        <h2 id="where-to-stay" className="flex items-center gap-2 font-display text-2xl sm:text-3xl md:text-[2rem] font-semibold tracking-tight text-ocean-900 mb-4 md:mb-6">
          <Home className="w-6 h-6 text-coral-500" aria-hidden="true" /> {h.whereToStay}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {hub.areas.map(area => (
            <article key={area.name} className="rounded-2xl bg-white shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.12)] ring-1 ring-ocean-900/[0.06] p-4 sm:p-5">
              <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-ocean-900 mb-2">
                <MapPin className="w-4 h-4 text-coral-500 flex-shrink-0" aria-hidden="true" /> {area.name}
              </h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3">{area.summary}</p>
              <dl className="space-y-2 text-sm">
                {([[Users, h.bestFor, area.bestFor], [Car, h.parking, area.parking], [Waves, h.beach, area.beach]] as const).map(([Icon, label, value]) => (
                  <div key={label} className="flex gap-2.5 rounded-lg bg-ocean-50/70 px-3 py-2">
                    <Icon className="mt-0.5 w-4 h-4 flex-shrink-0 text-ocean-600" aria-hidden="true" />
                    <div><dt className="inline font-semibold text-ocean-800">{label}: </dt><dd className="inline text-slate-700">{value}</dd></div>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>

      {/* Getting there */}
      <section aria-labelledby="getting-there">
        <h2 id="getting-there" className="flex items-center gap-2 font-display text-2xl sm:text-3xl md:text-[2rem] font-semibold tracking-tight text-ocean-900 mb-4 md:mb-6">
          <Navigation className="w-6 h-6 text-coral-500" aria-hidden="true" /> {h.gettingThere}
        </h2>
        <div className="rounded-2xl bg-white shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.12)] ring-1 ring-ocean-900/[0.06] divide-y divide-slate-100">
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
      <section aria-labelledby="when-to-go" className="rounded-2xl bg-white shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.12)] ring-1 ring-ocean-900/[0.06] p-5 sm:p-6 md:p-8">
        <h2 id="when-to-go" className="flex items-center gap-2 font-display text-2xl sm:text-3xl md:text-[2rem] font-semibold tracking-tight text-ocean-900 mb-3 md:mb-4">
          <Calendar className="w-6 h-6 text-coral-500" aria-hidden="true" /> {h.whenToGo}
        </h2>
        <p className="text-base md:text-lg text-slate-700 leading-relaxed">{hub.whenToGo}</p>
      </section>

      {/* Guides, grouped by what the reader is deciding */}
      {grouped.length > 0 && (
        <section id="guides" aria-labelledby="hub-guides" className="scroll-mt-20">
          <h2 id="hub-guides" className="flex items-center gap-2 font-display text-2xl sm:text-3xl md:text-[2rem] font-semibold tracking-tight text-ocean-900 mb-4 md:mb-6">
            <Compass className="w-6 h-6 text-coral-500" aria-hidden="true" /> {h.guides}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
            {grouped.map(({ group, items }) => {
              const Icon = GROUP_ICON[group];
              const [featured, ...rest] = items;
              return (
                <div key={group} className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.12)] ring-1 ring-ocean-900/[0.06]">
                  <div className="flex items-center gap-3 px-5 pt-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-coral-50 text-coral-600">
                      <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                    </span>
                    <h3 className="font-display text-xl font-semibold text-ocean-900">{h.groups[group]}</h3>
                    <span className="ml-auto rounded-full bg-ocean-50 px-2.5 py-0.5 text-xs font-bold text-ocean-700">{items.length}</span>
                  </div>

                  <Link href={`/guides/${slug}-${featured.theme}`} className="group relative mx-5 mt-4 block aspect-[16/7] overflow-hidden rounded-xl bg-ocean-100">
                    {featured.imageUrl && (
                      <Image src={featured.imageUrl} alt={featured.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" sizes="(max-width: 1024px) 100vw, 560px" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/85 via-ocean-900/20 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-4 font-display text-lg font-semibold leading-snug text-white">{featured.title}</span>
                  </Link>

                  <ul className="divide-y divide-slate-100 px-5 py-2">
                    {rest.map(g => (
                      <li key={g.theme}>
                        <Link href={`/guides/${slug}-${g.theme}`} className="group flex items-center gap-3 py-2.5">
                          <span className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-ocean-100">
                            {g.imageUrl && <Image src={g.imageUrl} alt="" fill className="object-cover" sizes="48px" />}
                          </span>
                          <span className="text-[15px] font-medium leading-snug text-slate-800 line-clamp-2 group-hover:text-ocean-700">{g.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* FAQ */}
      {hub.faq.length > 0 && (
        <section aria-labelledby="hub-faq">
          <h2 id="hub-faq" className="flex items-center gap-2 font-display text-2xl sm:text-3xl md:text-[2rem] font-semibold tracking-tight text-ocean-900 mb-4 md:mb-6">
            <HelpCircle className="w-6 h-6 text-coral-500" aria-hidden="true" /> {h.faq}
          </h2>
          <div className="rounded-2xl bg-white shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.12)] ring-1 ring-ocean-900/[0.06] px-5 sm:px-6">
            <AnimatedFaq items={hub.faq} />
          </div>
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
