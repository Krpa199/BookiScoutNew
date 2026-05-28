import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAllArticles, getTotalPages, paginateArticles } from './_lib/get-articles';
import GuidesListing from './_components/GuidesListing';

export const revalidate = false;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const articles = getAllArticles(locale);
  const totalPages = getTotalPages(articles.length);

  return {
    title: t('guidesTitle'),
    description: t('guidesDescription'),
    alternates: {
      canonical: `/${locale}/guides`,
    },
    other: totalPages > 1 ? { 'link-next': `/${locale}/guides/page/2` } : undefined,
  };
}

export default async function GuidesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const all = getAllArticles(locale);
  const totalPages = getTotalPages(all.length);
  const articles = paginateArticles(all, 1);

  return (
    <GuidesListing
      locale={locale}
      articles={articles}
      totalArticles={all.length}
      currentPage={1}
      totalPages={totalPages}
    />
  );
}
