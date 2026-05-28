import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/config';
import { getAllArticles, getTotalPages, paginateArticles } from '../../_lib/get-articles';
import GuidesListing from '../../_components/GuidesListing';

export const revalidate = false;
export const dynamicParams = false;

type Props = {
  params: Promise<{ locale: string; num: string }>;
};

// Build /guides/page/2 .. /guides/page/N for every locale.
export async function generateStaticParams() {
  const params: { locale: string; num: string }[] = [];
  for (const locale of locales) {
    const articles = getAllArticles(locale);
    const totalPages = getTotalPages(articles.length);
    // Page 1 lives at /guides (no /page/1).
    for (let n = 2; n <= totalPages; n++) {
      params.push({ locale, num: String(n) });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, num } = await params;
  const pageNum = Number.parseInt(num, 10);
  const t = await getTranslations({ locale, namespace: 'metadata' });

  const baseTitle = t('guidesTitle');
  return {
    title: `${baseTitle} — ${pageNum}`,
    description: t('guidesDescription'),
    alternates: {
      canonical: `/${locale}/guides/page/${pageNum}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function GuidesPaginatedPage({ params }: Props) {
  const { locale, num } = await params;
  const pageNum = Number.parseInt(num, 10);

  if (!Number.isInteger(pageNum) || pageNum < 2) {
    notFound();
  }

  setRequestLocale(locale);

  const all = getAllArticles(locale);
  const totalPages = getTotalPages(all.length);

  if (pageNum > totalPages) {
    notFound();
  }

  const articles = paginateArticles(all, pageNum);

  return (
    <GuidesListing
      locale={locale}
      articles={articles}
      totalArticles={all.length}
      currentPage={pageNum}
      totalPages={totalPages}
    />
  );
}
