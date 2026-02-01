'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, Globe, ChevronDown, Map, HelpCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: t('destinations'), href: '/destinations', icon: Map },
    { name: t('decisionGuides'), href: '/guides', icon: HelpCircle },
  ];

  const handleLanguageChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
    setLangMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-soft'
          : 'bg-white/80 backdrop-blur-lg border-b border-gray-50'
      }`}
    >
      <nav className="container flex items-center justify-between h-20">
        {/* Logo - Ocean themed */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 transition-all duration-300 group-hover:scale-105">
            <Image
              src="/icon.png"
              alt="BookiScout"
              width={48}
              height={48}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl text-slate-900 leading-none">
              Booki<span className="text-gradient-ocean">Scout</span>
            </span>
            <span className="text-xs text-slate-500 font-medium leading-none mt-0.5">Croatia Decision Guides</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:text-ocean-600 font-medium transition-all rounded-xl hover:bg-ocean-50/50 group"
              >
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Side - Language & CTA */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Language Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-all"
            >
              <Globe className="w-4 h-4" />
              <span className="text-lg">{localeFlags[locale]}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {langMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-large border border-gray-100 py-2 max-h-96 overflow-y-auto z-50 animate-scale-in">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('chooseLanguage')}</p>
                  </div>
                  {locales.map((code) => (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-ocean-50 transition-colors group text-left ${
                        code === locale ? 'bg-ocean-50' : ''
                      }`}
                    >
                      <span className="text-2xl">{localeFlags[code]}</span>
                      <div className="flex-1">
                        <span className={`font-medium ${code === locale ? 'text-ocean-600' : 'text-slate-700 group-hover:text-ocean-600'}`}>
                          {localeNames[code]}
                        </span>
                      </div>
                      {code === locale && (
                        <span className="text-xs text-ocean-600 bg-ocean-100 px-2 py-1 rounded-full">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* CTA Button */}
          <Link
            href="/guides"
            className="btn-primary text-sm shadow-soft hover:shadow-medium"
          >
            <HelpCircle className="w-4 h-4" />
            {t('decisionGuides')}
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-slate-600" />
          ) : (
            <Menu className="w-6 h-6 text-slate-600" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg animate-slide-down">
          <div className="container py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 py-3 px-4 text-slate-700 hover:text-ocean-600 font-medium rounded-xl hover:bg-ocean-50 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <hr className="my-4 border-gray-100" />

            {/* Language selector mobile */}
            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('language')}</p>
              <div className="grid grid-cols-2 gap-2">
                {locales.slice(0, 6).map((code) => (
                  <button
                    key={code}
                    onClick={() => handleLanguageChange(code)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      code === locale
                        ? 'bg-ocean-100 text-ocean-700'
                        : 'bg-slate-50 hover:bg-ocean-50 text-slate-700'
                    }`}
                  >
                    <span className="text-lg">{localeFlags[code]}</span>
                    <span className="font-medium truncate">{localeNames[code]}</span>
                  </button>
                ))}
              </div>
              {locales.length > 6 && (
                <button
                  onClick={() => setLangMenuOpen(true)}
                  className="w-full mt-2 py-2 text-sm text-ocean-600 hover:text-ocean-700 font-medium"
                >
                  + {locales.length - 6} more languages
                </button>
              )}
            </div>

            <hr className="my-4 border-gray-100" />

            <Link
              href="/guides"
              className="flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-ocean text-white text-center font-semibold rounded-xl hover:shadow-ocean transition-all shadow-soft"
              onClick={() => setMobileMenuOpen(false)}
            >
              <HelpCircle className="w-5 h-5" />
              {t('browseGuides')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
