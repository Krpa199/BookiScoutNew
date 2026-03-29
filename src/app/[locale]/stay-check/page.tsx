import { setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { MapPin, TrendingUp } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import StayCheckClient from '@/components/stay-check/StayCheckClient';
import StayCheckSchema from '@/components/schema/StayCheckSchema';
import { DESTINATIONS } from '@/config/destinations';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    en: 'Stay Check - See What Photos Don\'t Show You | BookiScout',
    de: 'Stay Check - Sehen Sie, was Fotos nicht zeigen | BookiScout',
    hr: 'Stay Check - Pogledajte što slike ne pokazuju | BookiScout',
    it: 'Stay Check - Scopri cosa le foto non mostrano | BookiScout',
    fr: 'Stay Check - Découvrez ce que les photos ne montrent pas | BookiScout',
    es: 'Stay Check - Descubre lo que las fotos no muestran | BookiScout',
  };

  const descriptions: Record<string, string> = {
    en: 'Paste your accommodation link and discover the real neighborhood. We analyze thousands of guest reviews from nearby restaurants, beaches, and cafes to give you the full picture before you book.',
    de: 'Fügen Sie Ihren Unterkunftslink ein und entdecken Sie die wahre Nachbarschaft. Wir analysieren Tausende von Gästebewertungen.',
    hr: 'Zalijepite link smještaja i otkrijte pravu okolinu. Analiziramo tisuće recenzija gostiju obližnjih restorana, plaža i kafića.',
    it: 'Incolla il link del tuo alloggio e scopri il vero quartiere. Analizziamo migliaia di recensioni degli ospiti.',
    fr: 'Collez votre lien d\'hébergement et découvrez le vrai quartier. Nous analysons des milliers d\'avis de clients.',
    es: 'Pega el enlace de tu alojamiento y descubre el vecindario real. Analizamos miles de reseñas de huéspedes.',
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    openGraph: {
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: '/stay-check',
    },
  };
}

export default async function StayCheckPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Get pre-analyzed destinations
  const stayCheckDir = path.join(process.cwd(), 'src', 'content', 'stay-check', 'en');
  const preAnalyzed: { slug: string; name: string; score: number }[] = [];
  if (fs.existsSync(stayCheckDir)) {
    const files = fs.readdirSync(stayCheckDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(stayCheckDir, file), 'utf-8');
        const data = JSON.parse(raw);
        const dest = DESTINATIONS.find(d => d.slug === data.destination);
        if (dest) {
          preAnalyzed.push({ slug: dest.slug, name: dest.name, score: data.scores?.overallScore || 0 });
        }
      } catch { /* skip broken files */ }
    }
  }
  preAnalyzed.sort((a, b) => b.score - a.score);

  return (
    <>
      <StayCheckSchema />
      <StayCheckClient locale={locale} />

      {/* Pre-analyzed destinations */}
      {preAnalyzed.length > 0 && (
        <section className="bg-gradient-to-b from-white to-slate-50 py-12 md:py-16">
          <div className="container">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-ocean-100 text-ocean-700 rounded-full text-sm font-semibold mb-4">
                <TrendingUp className="w-4 h-4" />
                <span>Pre-Analyzed Destinations</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                Browse Area Reviews
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                No link needed. Explore our in-depth area reports for popular Croatian destinations, with real scores and reviews.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
              {preAnalyzed.map(dest => {
                const scoreColor = dest.score >= 70 ? 'text-seafoam-600' : dest.score >= 40 ? 'text-sand-600' : 'text-coral-600';
                return (
                  <Link
                    key={dest.slug}
                    href={`/stay-check/${dest.slug}`}
                    className="group bg-white rounded-2xl border border-slate-100 hover:border-ocean-200 hover:shadow-soft transition-all p-4 text-center"
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <MapPin className="w-4 h-4 text-ocean-400" />
                      <span className="font-bold text-slate-800 group-hover:text-ocean-600 transition-colors text-sm">
                        {dest.name}
                      </span>
                    </div>
                    <div className={`text-2xl font-bold ${scoreColor}`}>
                      {dest.score}<span className="text-xs text-slate-400">/100</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
