import { Metadata } from 'next';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { ChevronRight, MapPin, Clock, Star } from 'lucide-react';
import { DESTINATIONS } from '@/config/destinations';
import { LANGUAGES } from '@/config/languages';

export const metadata: Metadata = {
  title: 'Travel Guides for Croatia',
  description: 'Expert travel guides for all Croatian destinations. Find tips on apartments, beaches, restaurants, and things to do.',
  openGraph: {
    title: 'Travel Guides for Croatia | BookiScout',
    description: 'Expert travel guides for all Croatian destinations.',
  },
};

interface ArticlePreview {
  title: string;
  metaDescription: string;
  destination: string;
  destinationName: string;
  theme: string;
  slug: string;
  generatedAt: string;
}

// Get all available articles
function getAllArticles(): ArticlePreview[] {
  const articles: ArticlePreview[] = [];
  const articlesDir = path.join(process.cwd(), 'src', 'content', 'articles', 'en');

  try {
    if (fs.existsSync(articlesDir)) {
      const files = fs.readdirSync(articlesDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
          const data = JSON.parse(content);
          articles.push({
            title: data.title,
            metaDescription: data.metaDescription,
            destination: data.destination,
            destinationName: data.destinationName,
            theme: data.theme,
            slug: file.replace('.json', ''),
            generatedAt: data.generatedAt,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error reading articles:', error);
  }

  // Sort by date, newest first
  return articles.sort((a, b) =>
    new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );
}

// Theme styles
const themeStyles: Record<string, { bg: string; text: string; label: string }> = {
  apartments: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Apartments' },
  family: { bg: 'bg-green-100', text: 'text-green-700', label: 'Family' },
  beach: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Beaches' },
  budget: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Budget' },
  luxury: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Luxury' },
  restaurants: { bg: 'bg-red-100', text: 'text-red-700', label: 'Food' },
  'things-to-do': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Activities' },
  'hidden-gems': { bg: 'bg-pink-100', text: 'text-pink-700', label: 'Hidden Gems' },
  couples: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Couples' },
  nightlife: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Nightlife' },
  'day-trips': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Day Trips' },
  weather: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'Weather' },
  'local-food': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Local Food' },
};

export default function GuidesPage() {
  const articles = getAllArticles();
  const totalGuides = articles.length * Object.keys(LANGUAGES).length;

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-16">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm text-blue-200 mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Guides</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Travel Guides
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            {articles.length > 0
              ? `${totalGuides}+ expert guides for Croatian destinations in ${Object.keys(LANGUAGES).length} languages.`
              : 'Expert guides for Croatian destinations coming soon.'}
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16">
        <div className="container">
          {articles.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Latest Guides
                </h2>
                <span className="text-gray-500">
                  {articles.length} guides in English
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => {
                  const style = themeStyles[article.theme] || { bg: 'bg-gray-100', text: 'text-gray-700', label: article.theme };

                  return (
                    <Link
                      key={article.slug}
                      href={`/guides/en/${article.slug}`}
                      className="group block"
                    >
                      <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full">
                        {/* Image placeholder */}
                        <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-6xl opacity-50">🏖️</span>
                          </div>

                          {/* Theme Badge */}
                          <div className="absolute top-4 left-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                              {style.label}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          {/* Location */}
                          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-2">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{article.destinationName}, Croatia</span>
                          </div>

                          {/* Title */}
                          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {article.title}
                          </h3>

                          {/* Description */}
                          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                            {article.metaDescription}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                              <Clock className="w-3.5 h-3.5" />
                              <span>5 min read</span>
                            </div>
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-medium">4.8</span>
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Guides Coming Soon
              </h2>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                We're working on creating comprehensive travel guides for all Croatian destinations. Check back soon!
              </p>
              <Link
                href="/destinations"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Browse Destinations
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Browse by Destination */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Browse by Destination
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {DESTINATIONS.filter(d => d.popular).map(dest => (
              <Link
                key={dest.slug}
                href={`/destinations/${dest.slug}`}
                className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {dest.name}
                </span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href="/destinations"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View all destinations →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
