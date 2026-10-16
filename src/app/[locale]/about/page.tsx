import { Metadata } from 'next';
import { ChevronRight, Target, Sparkles, Users, Globe, CheckCircle, Heart } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export const revalidate = false; // potpuno statična stranica

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about' });
  const common = await getTranslations({ locale, namespace: 'common' });

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
              <Heart className="w-4 h-4" />
              <span className="text-sm font-semibold">{t('heroBadge')}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight text-white mb-4 md:mb-5">
              {t('heroTitle')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-ocean-50 leading-relaxed">
              {t('heroSubtitle')}
            </p>
          </div>
        </div>
        <svg className="absolute bottom-0 left-0 h-6 w-full text-white md:h-10" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0,32 C240,58 480,58 720,34 C960,10 1200,10 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </section>

      {/* Mission */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-10 md:mb-16">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ocean-100 text-ocean-700 rounded-full text-sm font-semibold mb-3 sm:mb-4">
                  <Target className="w-4 h-4" />
                  <span>{t('missionBadge')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">
                  {t('missionTitle')}
                </h2>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                  {t('missionP1')}
                </p>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed mt-3 sm:mt-4">
                  {t('missionP2')}
                </p>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed mt-3 sm:mt-4">
                  {t('missionP3')}
                </p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-8 border border-slate-100">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-seafoam-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900">{t('feature1Title')}</h4>
                      <p className="text-slate-600 text-sm">{t('feature1Text')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-seafoam-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900">{t('feature2Title')}</h4>
                      <p className="text-slate-600 text-sm">{t('feature2Text')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-seafoam-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900">{t('feature3Title')}</h4>
                      <p className="text-slate-600 text-sm">{t('feature3Text')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Cover */}
      <section className="py-12 md:py-20 bg-gradient-ocean-subtle">
        <div className="container">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-seafoam-100 text-seafoam-700 rounded-full text-sm font-semibold mb-3 sm:mb-4">
              <Sparkles className="w-4 h-4" />
              <span>{t('coverBadge')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">
              {t('coverTitle')}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-soft border border-slate-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{t('cover1Title')}</h3>
              <p className="text-sm sm:text-base text-slate-600">
                {t('cover1Text')}
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-soft border border-slate-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-seafoam-400 to-seafoam-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{t('cover2Title')}</h3>
              <p className="text-sm sm:text-base text-slate-600">
                {t('cover2Text')}
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-soft border border-slate-100 sm:col-span-2 md:col-span-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-coral-400 to-coral-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{t('cover3Title')}</h3>
              <p className="text-sm sm:text-base text-slate-600">
                {t('cover3Text')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Optimization */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sand-100 text-sand-700 rounded-full text-sm font-semibold mb-3 sm:mb-4">
              <Sparkles className="w-4 h-4" />
              <span>{t('aiBadge')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">
              {t('aiTitle')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6 sm:mb-8">
              {t('aiText')}
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 text-slate-700 rounded-full text-xs sm:text-sm font-medium">{t('aiTag1')}</span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 text-slate-700 rounded-full text-xs sm:text-sm font-medium">{t('aiTag2')}</span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 text-slate-700 rounded-full text-xs sm:text-sm font-medium">{t('aiTag3')}</span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 text-slate-700 rounded-full text-xs sm:text-sm font-medium">{t('aiTag4')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sister project — BookiApp */}
      <section className="py-12 md:py-20 bg-gradient-ocean-subtle">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ocean-100 text-ocean-700 rounded-full text-sm font-semibold mb-3 sm:mb-4">
              <Heart className="w-4 h-4" />
              <span>{t('sisterBadge')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">
              {t('sisterTitle')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-4">
              {t('sisterP1Before')}{' '}
              <a
                href="https://bookiapp.com"
                target="_blank"
                rel="noopener"
                className="font-semibold text-ocean-600 hover:text-ocean-700 underline underline-offset-2"
              >
                {t('sisterP1Link')}
              </a>{' '}
              {t('sisterP1After')}
            </p>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6">
              {t('sisterP2Before')}{' '}
              <a
                href="https://bookiapp.com/hr/blog/"
                target="_blank"
                rel="noopener"
                className="font-semibold text-ocean-600 hover:text-ocean-700 underline underline-offset-2"
              >
                {t('sisterP2Link')}
              </a>{' '}
              {t('sisterP2After')}
            </p>
            <a
              href="https://bookiapp.com"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white border border-ocean-200 hover:border-ocean-400 text-ocean-700 font-semibold rounded-xl transition-colors shadow-soft"
            >
              {t('sisterCta')}
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">{t('contactTitle')}</h2>
            <p className="text-base sm:text-lg text-slate-300 mb-6 sm:mb-8">
              {t('contactText')}
            </p>
            <a
              href="mailto:bookiscout@gmail.com"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-ocean-500 hover:bg-ocean-600 text-white font-semibold rounded-xl transition-colors"
            >
              {t('contactCta')}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
