import { Metadata } from 'next';
import { ChevronRight, FileText } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'terms' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'terms' });
  const common = await getTranslations({ locale, namespace: 'common' });

  const useMayItems = t.raw('useMayItems') as string[];
  const useMayNotItems = t.raw('useMayNotItems') as string[];
  const warrantyItems = t.raw('warrantyItems') as string[];
  const conductItems = t.raw('conductItems') as string[];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-700 text-white pt-8 pb-20 md:pt-10 md:pb-24">
        <div className="pointer-events-none absolute -top-32 right-[-10%] h-[26rem] w-[26rem] rounded-full bg-sand-300/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 left-[-10%] h-64 w-64 rounded-full bg-seafoam-400/15 blur-3xl" aria-hidden="true" />

        <div className="container relative">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-ocean-100 mb-6 md:mb-8">
            <Link href="/" className="text-ocean-100/80 hover:text-white transition-colors">{common('home')}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-sand-200">{t('breadcrumb')}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 ring-1 ring-white/15 text-sand-200 rounded-full mb-4 md:mb-6">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-semibold">{t('heroBadge')}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight text-white mb-4 md:mb-5">
              {t('heroTitle')}
            </h1>
            <p className="text-sm sm:text-base text-ocean-100">
              {t('lastUpdatedLabel')} {t('lastUpdatedDate')}
            </p>
          </div>
        </div>
        <svg className="absolute bottom-0 left-0 h-6 w-full text-white md:h-10" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0,32 C240,58 480,58 720,34 C960,10 1200,10 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </section>

      {/* Content */}
      <section className="py-10 sm:py-12 md:py-16 bg-white">
        <div className="container">
          <div className="max-w-3xl mx-auto prose prose-slate prose-sm sm:prose-base md:prose-lg">

            <h2>{t('agreementTitle')}</h2>
            <p>{t('agreementText')}</p>

            <h2>{t('descriptionTitle')}</h2>
            <p>{t('descriptionText')}</p>

            <h2>{t('useTitle')}</h2>
            <p>{t('useText')}</p>
            <p>{t('useMayText')}</p>
            <ul>
              {useMayItems.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            <p>{t('useMayNotText')}</p>
            <ul>
              {useMayNotItems.map((item, i) => <li key={i}>{item}</li>)}
            </ul>

            <h2>{t('aiTitle')}</h2>
            <p>{t('aiText')}</p>

            <h2>{t('accuracyTitle')}</h2>
            <p>{t('accuracyP1')}</p>
            <p>{t('accuracyP2')}</p>

            <h2>{t('linksTitle')}</h2>
            <p>{t('linksText')}</p>

            <h2>{t('warrantyTitle')}</h2>
            <p>{t('warrantyText')}</p>
            <ul>
              {warrantyItems.map((item, i) => <li key={i}>{item}</li>)}
            </ul>

            <h2>{t('liabilityTitle')}</h2>
            <p>{t('liabilityP1')}</p>
            <p>{t('liabilityP2')}</p>

            <h2>{t('conductTitle')}</h2>
            <p>{t('conductText')}</p>
            <ul>
              {conductItems.map((item, i) => <li key={i}>{item}</li>)}
            </ul>

            <h2>{t('indemnTitle')}</h2>
            <p>{t('indemnText')}</p>

            <h2>{t('changesTitle')}</h2>
            <p>{t('changesText')}</p>

            <h2>{t('governingTitle')}</h2>
            <p>{t('governingText')}</p>

            <h2>{t('contactTitle')}</h2>
            <p>{t('contactText')}</p>
            <p>
              <strong>{t('emailLabel')}</strong> <a href="mailto:bookiscout@gmail.com">bookiscout@gmail.com</a>
            </p>

          </div>
        </div>
      </section>
    </>
  );
}
