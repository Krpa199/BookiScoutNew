import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { LANGUAGES, LanguageCode } from '@/config/languages';
import { DESTINATIONS } from '@/config/destinations';
import ArticleSchema from '@/components/article/ArticleSchema';
import BookingWidget from '@/components/ui/BookingWidget';
import { MapPin, Clock, Calendar, Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ArticleData {
  title: string;
  metaDescription: string;
  slug: string;
  content: string;
  faq: { question: string; answer: string }[];
  quickAnswer: string;
  tableData?: { name: string; price: string; rating: string; distance: string }[];
  destination: string;
  destinationName: string;
  region: string;
  theme: string;
  language: string;
  generatedAt: string;
  lat: number;
  lng: number;
}

interface PageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

// Load article from JSON file
function getArticle(lang: string, slug: string): ArticleData | null {
  const filePath = path.join(process.cwd(), 'src', 'content', 'articles', lang, `${slug}.json`);

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error loading article: ${filePath}`, error);
  }

  return null;
}

// Generate static params for all articles
export async function generateStaticParams() {
  const params: { lang: string; slug: string }[] = [];
  const articlesDir = path.join(process.cwd(), 'src', 'content', 'articles');

  try {
    const languages = fs.readdirSync(articlesDir);

    for (const lang of languages) {
      const langDir = path.join(articlesDir, lang);
      if (fs.statSync(langDir).isDirectory()) {
        const files = fs.readdirSync(langDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            params.push({
              lang,
              slug: file.replace('.json', ''),
            });
          }
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist yet, return empty
  }

  return params;
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const article = getArticle(lang, slug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  const language = LANGUAGES[lang as LanguageCode];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookiscout.com';
  const url = `${baseUrl}/guides/${lang}/${slug}`;

  return {
    title: article.title,
    description: article.metaDescription,
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      url,
      type: 'article',
      locale: language?.locale || 'en-US',
      siteName: 'BookiScout',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.metaDescription,
    },
    alternates: {
      canonical: url,
      languages: Object.keys(LANGUAGES).reduce((acc, l) => {
        acc[LANGUAGES[l as LanguageCode].locale] = `${baseUrl}/guides/${l}/${slug}`;
        return acc;
      }, {} as Record<string, string>),
    },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { lang, slug } = await params;

  // Validate language
  if (!LANGUAGES[lang as LanguageCode]) {
    notFound();
  }

  // Load article
  const article = getArticle(lang, slug);

  if (!article) {
    notFound();
  }

  const destination = DESTINATIONS.find(d => d.slug === article.destination);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookiscout.com';
  const url = `${baseUrl}/guides/${lang}/${slug}`;

  // Format theme for display
  const formatTheme = (theme: string) => {
    return theme
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Calculate reading time (rough estimate)
  const wordCount = article.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <>
      {/* Schema.org structured data */}
      <ArticleSchema
        title={article.title}
        description={article.metaDescription}
        url={url}
        datePublished={article.generatedAt}
        dateModified={article.generatedAt}
        destination={article.destinationName}
        faq={article.faq}
      />

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="container py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/guides" className="hover:text-blue-600">Guides</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/destinations/${article.destination}`} className="hover:text-blue-600">
              {article.destinationName}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">{formatTheme(article.theme)}</span>
          </nav>
        </div>
      </div>

      {/* Article Header */}
      <header className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-12 md:py-20">
        <div className="container">
          <div className="max-w-4xl">
            {/* Theme Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm mb-4">
              <MapPin className="w-4 h-4" />
              {article.destinationName} • {formatTheme(article.theme)}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              {article.title}
            </h1>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-blue-100 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {readingTime} min read
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Updated {new Date(article.generatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                4.8/5 rating
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Article Content */}
          <div className="lg:col-span-2">
            {/* Quick Answer Box */}
            {article.quickAnswer && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl mb-8">
                <h2 className="font-bold text-blue-900 mb-2">Quick Answer</h2>
                <p className="text-blue-800">{article.quickAnswer}</p>
              </div>
            )}

            {/* Data Table */}
            {article.tableData && article.tableData.length > 0 && (
              <div className="mb-8 overflow-x-auto">
                <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rating</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Distance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {article.tableData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{row.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.price}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.rating}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.distance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Main Content */}
            <article className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600">
              <div dangerouslySetInnerHTML={{ __html: formatContent(article.content) }} />
            </article>

            {/* FAQ Section */}
            {article.faq && article.faq.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {article.faq.map((item, index) => (
                    <details
                      key={index}
                      className="group bg-white border border-gray-200 rounded-xl overflow-hidden"
                    >
                      <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50">
                        <span className="font-medium text-gray-900">{item.question}</span>
                        <ChevronRight className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-90" />
                      </summary>
                      <div className="px-6 pb-4 text-gray-700">
                        {item.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Booking Widget */}
              <BookingWidget
                destination={article.destinationName}
                destinationSlug={article.destination}
              />

              {/* Language Switcher */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Read in other languages</h3>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(LANGUAGES).map(([code, { name, flag }]) => (
                    <Link
                      key={code}
                      href={`/guides/${code}/${slug}`}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-gray-100 ${
                        code === lang ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                      }`}
                    >
                      <span>{flag}</span>
                      <span className="truncate">{code.toUpperCase()}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Related Guides */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">More about {article.destinationName}</h3>
                <div className="space-y-2">
                  {['apartments', 'beaches', 'restaurants', 'things-to-do'].map(theme => (
                    <Link
                      key={theme}
                      href={`/guides/${lang}/${article.destination}-${theme}`}
                      className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                    >
                      {formatTheme(theme)} in {article.destinationName}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

// Helper function to convert markdown to basic HTML
function formatContent(content: string): string {
  return content
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (match) => {
      if (match.startsWith('<')) return match;
      return `<p>${match}</p>`;
    });
}
