import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { setRequestLocale } from 'next-intl/server';
import { DESTINATIONS } from '@/config/destinations';
import StayCheckAreaReport, { type StayCheckDestinationData } from '@/components/stay-check/StayCheckAreaReport';
import StayCheckAreaSchema from '@/components/schema/StayCheckAreaSchema';
import { Link } from '@/i18n/navigation';

export const revalidate = false;
export const dynamicParams = false;

type Props = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

// ============================================================================
// STATIC GENERATION
// ============================================================================

function getStayCheckDir(locale: string = 'en'): string {
  return path.join(process.cwd(), 'src', 'content', 'stay-check', locale);
}

function getStayCheckData(slug: string, locale: string): StayCheckDestinationData | null {
  // Try locale-specific first, then fall back to English
  for (const lang of [locale, 'en']) {
    const filePath = path.join(getStayCheckDir(lang), `${slug}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw) as StayCheckDestinationData;
      } catch {
        continue;
      }
    }
  }
  return null;
}

export async function generateStaticParams() {
  const params: { slug: string }[] = [];
  const dir = getStayCheckDir('en');

  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        params.push({ slug: file.replace('.json', '') });
      }
    }
  }

  return params;
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = getStayCheckData(slug, locale);
  const dest = DESTINATIONS.find(d => d.slug === slug);

  if (!data || !dest) {
    return { title: 'Area Review Not Found' };
  }

  const year = new Date().getFullYear();

  const titles: Record<string, string> = {
    en: `${dest.name} Area Review ${year}: Beaches, Restaurants & Real Scores | BookiScout`,
    hr: `${dest.name} Pregled Područja ${year}: Plaže, Restorani i Ocjene | BookiScout`,
    de: `${dest.name} Gebietsüberblick ${year}: Strände, Restaurants & Bewertungen | BookiScout`,
    it: `Recensione Area ${dest.name} ${year}: Spiagge, Ristoranti e Punteggi | BookiScout`,
    fr: `Avis sur ${dest.name} ${year}: Plages, Restaurants & Notes | BookiScout`,
    es: `Reseña de ${dest.name} ${year}: Playas, Restaurantes y Puntuaciones | BookiScout`,
  };

  const descriptions: Record<string, string> = {
    en: `Honest area review of ${dest.name}, Croatia based on ${data.reviewAnalysis.totalReviewsAnalyzed} real guest reviews. Beach quality, restaurant scores, parking, walkability, noise levels, and scores for families, couples & solo travelers.`,
    hr: `Iskreni pregled područja ${dest.name}, Hrvatska na temelju ${data.reviewAnalysis.totalReviewsAnalyzed} stvarnih recenzija gostiju. Kvaliteta plaža, restorani, parking, šetljivost i ocjene za obitelji, parove i solo putnike.`,
    de: `Ehrliche Gebietsüberblick von ${dest.name}, Kroatien basierend auf ${data.reviewAnalysis.totalReviewsAnalyzed} echten Gästebewertungen. Strandqualität, Restaurantbewertungen, Parken und Bewertungen für Familien, Paare & Alleinreisende.`,
    it: `Recensione onesta dell'area di ${dest.name}, Croazia basata su ${data.reviewAnalysis.totalReviewsAnalyzed} recensioni reali. Qualità spiagge, ristoranti, parcheggio e punteggi per famiglie, coppie e viaggiatori singoli.`,
    fr: `Avis honnête sur ${dest.name}, Croatie basé sur ${data.reviewAnalysis.totalReviewsAnalyzed} vrais avis. Qualité plages, restaurants, parking et notes pour familles, couples et voyageurs solo.`,
    es: `Reseña honesta de ${dest.name}, Croacia basada en ${data.reviewAnalysis.totalReviewsAnalyzed} reseñas reales. Calidad playas, restaurantes, aparcamiento y puntuaciones para familias, parejas y viajeros solos.`,
  };

  const title = titles[locale] || titles.en;
  const description = descriptions[locale] || descriptions.en;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `/stay-check/${slug}`,
    },
  };
}

// ============================================================================
// PAGE
// ============================================================================

export default async function StayCheckAreaPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const data = getStayCheckData(slug, locale);
  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ocean-500 via-ocean-400 to-seafoam-400 text-white">
        <div className="absolute inset-0 opacity-15">
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="area-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="white" opacity="0.3" />
                <circle cx="60" cy="60" r="1.5" fill="white" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#area-pattern)" />
          </svg>
        </div>

        <div className="container relative py-10 md:py-14">
          <div className="max-w-3xl mx-auto text-center">
            <nav className="text-sm text-ocean-100 mb-4">
              <a href={`/${locale === 'en' ? '' : locale + '/'}destinations/${slug}`} className="hover:text-white">
                {data.destinationName}
              </a>
              {' '}&rarr;{' '}
              <span>Area Review</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 leading-tight">
              {data.destinationName}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-sand-200 to-white">
                Area Review
              </span>
            </h1>
            <p className="text-lg text-ocean-50 max-w-2xl mx-auto leading-relaxed">
              What {data.reviewAnalysis.totalReviewsAnalyzed} real guest reviews say about the beaches, restaurants, parking, and neighborhood.
            </p>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 text-slate-50">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-8 sm:h-auto" preserveAspectRatio="none">
            <path d="M0,64 C240,100 480,100 720,64 C960,28 1200,28 1440,64 L1440,120 L0,120 Z" fill="currentColor" />
          </svg>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 md:py-12">
        <div className="container">
          <StayCheckAreaReport data={data} />
          <StayCheckAreaSchema data={data} />
        </div>
      </section>

      {/* Cross-linking: Related Guides */}
      <section className="py-8 md:py-12 bg-slate-50">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
            Explore {data.destinationName} Guides
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {(() => {
              const guideThemes = [
                { theme: 'apartments', label: 'Apartments' },
                { theme: 'beach', label: 'Beaches' },
                { theme: 'family', label: 'Family Guide' },
                { theme: 'budget', label: 'Budget Tips' },
                { theme: 'local-food', label: 'Local Food' },
                { theme: 'hidden-gems', label: 'Hidden Gems' },
                { theme: 'couples', label: 'For Couples' },
                { theme: 'day-trips', label: 'Day Trips' },
              ];

              // Check which guides exist for this destination
              const guidesDir = path.join(process.cwd(), 'src', 'content', 'articles', 'en');
              const availableGuides = guideThemes.filter(g => {
                try {
                  return fs.existsSync(path.join(guidesDir, `${slug}-${g.theme}.json`));
                } catch { return false; }
              });

              return availableGuides.slice(0, 8).map(g => (
                <Link
                  key={g.theme}
                  href={`/guides/${slug}-${g.theme}`}
                  className="bg-white rounded-xl border border-slate-100 hover:border-ocean-200 hover:shadow-soft transition-all p-3 text-center text-sm font-medium text-slate-700 hover:text-ocean-600"
                >
                  {g.label}
                </Link>
              ));
            })()}
            <Link
              href={`/destinations/${slug}`}
              className="bg-ocean-50 rounded-xl border border-ocean-100 hover:bg-ocean-100 transition-all p-3 text-center text-sm font-bold text-ocean-700"
            >
              All {data.destinationName} &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Cross-linking: Other Area Reviews */}
      {(() => {
        const stayCheckDir = getStayCheckDir('en');
        const otherReviews: { slug: string; name: string; score: number }[] = [];
        if (fs.existsSync(stayCheckDir)) {
          for (const file of fs.readdirSync(stayCheckDir).filter(f => f.endsWith('.json'))) {
            const otherSlug = file.replace('.json', '');
            if (otherSlug === slug) continue;
            try {
              const raw = fs.readFileSync(path.join(stayCheckDir, file), 'utf-8');
              const d = JSON.parse(raw);
              const dest = DESTINATIONS.find(dd => dd.slug === otherSlug);
              if (dest) otherReviews.push({ slug: otherSlug, name: dest.name, score: d.scores?.overallScore || 0 });
            } catch { /* skip */ }
          }
        }
        otherReviews.sort((a, b) => b.score - a.score);
        if (otherReviews.length === 0) return null;

        return (
          <section className="py-8 md:py-12">
            <div className="container max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
                Other Area Reviews
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {otherReviews.slice(0, 8).map(r => {
                  const color = r.score >= 70 ? 'text-emerald-600' : r.score >= 40 ? 'text-amber-600' : 'text-red-500';
                  return (
                    <Link
                      key={r.slug}
                      href={`/stay-check/${r.slug}`}
                      className="bg-white rounded-xl border border-slate-100 hover:border-ocean-200 hover:shadow-soft transition-all p-4 text-center"
                    >
                      <span className="text-sm font-bold text-slate-800 block mb-1">{r.name}</span>
                      <span className={`text-xl font-bold ${color}`}>{r.score}<span className="text-xs text-slate-400">/100</span></span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })()}
    </div>
  );
}
