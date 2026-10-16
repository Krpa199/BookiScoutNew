import Image from 'next/image';
import { ChevronRight, ChevronLeft, Clock, BookOpen, ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import fs from 'fs';
import path from 'path';
import { DESTINATIONS } from '@/config/destinations';
import { isAdventSeason } from '@/lib/seasonal';
import type { ArticlePreview } from '../_lib/get-articles';

interface Props {
  locale: string;
  articles: ArticlePreview[];        // paginated subset to render
  totalArticles: number;             // full count across all pages
  currentPage: number;
  totalPages: number;
}

// Hand-picked guides for the hero: seasonal first, then the biggest traffic pages
function featuredGuides(locale: string): { slug: string; title: string; destinationName: string; imageUrl?: string }[] {
  const slugs = isAdventSeason()
    ? ['zagreb-advent', 'split-parking-difficulty', 'dubrovnik-first-time-visitors']
    : ['split-parking-difficulty', 'zadar-parking-difficulty', 'dubrovnik-first-time-visitors'];
  return slugs.flatMap(slug => {
    const file = path.join(process.cwd(), 'src', 'content', 'articles', locale, `${slug}.json`);
    if (!fs.existsSync(file)) return [];
    const a = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return [{ slug, title: a.title, destinationName: a.destinationName, imageUrl: a.imageUrl }];
  });
}

function buildPageHref(pageNum: number): string {
  return pageNum === 1 ? '/guides' : `/guides/page/${pageNum}`;
}

// Render a compact pager: 1, 2, 3 ... 28, 29, 30 (always include neighbours of current).
function getPageNumbers(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | 'gap')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push('gap');
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push('gap');
  items.push(total);
  return items;
}

export default async function GuidesListing({
  locale,
  articles,
  totalArticles,
  currentPage,
  totalPages,
}: Props) {
  const t = await getTranslations('guides');
  const tCommon = await getTranslations('common');
  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const quickPlaces = DESTINATIONS.filter(d => d.popular).slice(0, 16);
  const featured = featuredGuides(locale);
  const tUi = await getTranslations('guides.detail.ui');
  const card = 'rounded-2xl bg-white shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.12)] ring-1 ring-ocean-900/[0.06]';

  return (
    <>
      {/* Hero — same deep-Adriatic language as the guides */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-700 pt-8 pb-20 md:pt-10 md:pb-28 text-white">
        <div className="pointer-events-none absolute -top-32 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-sand-300/25 blur-3xl" aria-hidden="true" />
        <div className="relative container">
          <nav className="flex items-center gap-2 text-sm text-ocean-100/60" aria-label="Breadcrumb">
            <Link href="/" className="text-ocean-100/80 hover:text-white">{tCommon('home')}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-medium text-sand-200">{t('hero.title')}</span>
          </nav>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-10 items-start">
          <div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight max-w-3xl text-white">
            {t('hero.title')}
          </h1>
          {totalArticles > 0 && (
            <p className="mt-4 text-lg text-ocean-50/80">
              {t('listing.subtitle', { count: totalArticles })} · {t('hero.statDestinations')}
            </p>
          )}

          {/* Pick a place: hubs group every guide of a town by topic */}
          <div className="mt-8 flex flex-wrap gap-2">
            {quickPlaces.map(dest => (
              <Link
                key={dest.slug}
                href={`/destinations/${dest.slug}`}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/15 transition hover:bg-white hover:text-ocean-900"
              >
                {dest.name}
              </Link>
            ))}
            <Link
              href="/destinations"
              className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-sand-200 hover:text-white"
            >
              {t('byDestination.viewAll', { count: DESTINATIONS.length })} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          </div>

          {featured.length > 0 && (
            <div className="rounded-3xl bg-white/10 p-4 md:p-5 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="px-1 text-xs font-bold uppercase tracking-wider text-sand-200">{tUi('featured')}</p>
              <ul className="mt-3 space-y-3">
                {featured.map((g, n) => (
                  <li key={g.slug}>
                    <Link href={`/guides/${g.slug}`} className="group flex items-center gap-4 rounded-2xl bg-white p-2.5 pr-4 shadow-lg shadow-ocean-900/20 transition hover:-translate-y-0.5">
                      <span className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-ocean-100">
                        {g.imageUrl && <Image src={g.imageUrl} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="96px" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-coral-600">{String(n + 1).padStart(2, '0')} · {g.destinationName}</span>
                        <span className="mt-1 block font-display text-[17px] font-semibold leading-snug text-ocean-900 line-clamp-2 group-hover:text-ocean-700">{g.title}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          </div>
        </div>

        <svg className="absolute bottom-0 left-0 h-8 w-full text-[#e8f2f9] md:h-12" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0,32 C240,58 480,58 720,34 C960,10 1200,10 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </section>

      <section className="bg-[#e8f2f9] pt-10 pb-20 md:pt-14 md:pb-24">
        <div className="container">
          {totalArticles > 0 ? (
            <>
              <div className="mb-8">
                <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-ocean-900">
                  {t('listing.title')}
                  {currentPage > 1 && (
                    <span className="ml-3 font-sans text-lg font-normal text-slate-400">{currentPage} / {totalPages}</span>
                  )}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {articles.map(article => (
                  <Link key={article.slug} href={`/guides/${article.slug}`} className={`group flex flex-col overflow-hidden ${card}`}>
                    <div className="relative aspect-[16/10] overflow-hidden bg-ocean-100">
                      {article.imageUrl ? (
                        <Image
                          src={article.imageUrl}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-ocean-700 to-ocean-900" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-coral-600">{article.destinationName}</p>
                      <h3 className="mt-1.5 font-display text-xl font-semibold leading-snug text-ocean-900 line-clamp-2 group-hover:text-ocean-700">
                        {article.title}
                      </h3>
                      <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-600 line-clamp-2">{article.metaDescription}</p>
                      <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-400">
                        <Clock className="w-4 h-4" />
                        {t('detail.minRead', { count: article.readingTime })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-1.5 sm:gap-2 mt-12 md:mt-16" aria-label="Pagination">
                  {currentPage > 1 ? (
                    <Link href={buildPageHref(currentPage - 1)} rel="prev" className={`flex items-center gap-1 px-3 py-2 text-ocean-800 font-medium hover:text-ocean-600 ${card}`}>
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">{tCommon('previous')}</span>
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-2 text-slate-300 font-medium">
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">{tCommon('previous')}</span>
                    </span>
                  )}

                  {pageNumbers.map((p, i) =>
                    p === 'gap' ? (
                      <span key={`gap-${i}`} className="px-2 text-slate-400">…</span>
                    ) : p === currentPage ? (
                      <span key={p} aria-current="page" className="min-w-[2.5rem] rounded-xl bg-ocean-800 px-3 py-2 text-center font-bold text-white">{p}</span>
                    ) : (
                      <Link key={p} href={buildPageHref(p)} className={`min-w-[2.5rem] px-3 py-2 text-center font-medium text-ocean-800 hover:text-ocean-600 ${card}`}>{p}</Link>
                    )
                  )}

                  {currentPage < totalPages ? (
                    <Link href={buildPageHref(currentPage + 1)} rel="next" className={`flex items-center gap-1 px-3 py-2 text-ocean-800 font-medium hover:text-ocean-600 ${card}`}>
                      <span className="hidden sm:inline">{tCommon('next')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-2 text-slate-300 font-medium">
                      <span className="hidden sm:inline">{tCommon('next')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 text-ocean-400 mx-auto mb-6" />
              <h2 className="font-display text-3xl font-semibold text-ocean-900 mb-4">{t('empty.title')}</h2>
              <p className="text-lg text-slate-600 max-w-md mx-auto mb-8 leading-relaxed">{t('empty.subtitle')}</p>
              <Link href="/destinations" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ocean-800 text-white font-semibold">
                {t('empty.cta')}
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
