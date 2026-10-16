import { Metadata } from 'next';
import { ChevronRight, Mail, MessageSquare, Clock, MapPin } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export const revalidate = false; // potpuno statična stranica

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'contact' });
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
              <MessageSquare className="w-4 h-4" />
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

      {/* Contact Info */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">

              {/* Main Contact */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">{t('sendTitle')}</h2>
                <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8">
                  {t('sendText')}
                </p>

                <a
                  href="mailto:bookiscout@gmail.com"
                  className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-br from-ocean-50 to-seafoam-50 rounded-xl sm:rounded-2xl border-2 border-ocean-100 hover:border-ocean-300 transition-colors group"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                    <Mail className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">{t('emailLabel')}</p>
                    <p className="text-base sm:text-xl font-bold text-ocean-600 truncate">bookiscout@gmail.com</p>
                  </div>
                </a>
              </div>

              {/* Additional Info */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">{t('helpTitle')}</h2>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-seafoam-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-seafoam-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-slate-900">{t('help1Title')}</h3>
                      <p className="text-xs sm:text-sm text-slate-600">{t('help1Text')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-ocean-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-ocean-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-slate-900">{t('help2Title')}</h3>
                      <p className="text-xs sm:text-sm text-slate-600">{t('help2Text')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-coral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-coral-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-slate-900">{t('help3Title')}</h3>
                      <p className="text-xs sm:text-sm text-slate-600">{t('help3Text')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className="mt-10 sm:mt-12 md:mt-16 p-5 sm:p-6 md:p-8 bg-gradient-to-br from-slate-50 to-white rounded-2xl md:rounded-3xl border border-slate-100">
              <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 text-center md:text-left">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-sand-400 to-coral-500 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2">{t('responseTitle')}</h3>
                  <p className="text-sm sm:text-base text-slate-600">
                    {t('responseText')}
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="mt-4 sm:mt-6 md:mt-8 p-5 sm:p-6 md:p-8 bg-gradient-to-br from-slate-50 to-white rounded-2xl md:rounded-3xl border border-slate-100">
              <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 text-center md:text-left">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-ocean-400 to-seafoam-500 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2">{t('locationTitle')}</h3>
                  <p className="text-sm sm:text-base text-slate-600">
                    {t('locationText')}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
