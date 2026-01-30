'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Globe, ChevronDown, Compass, Map, HelpCircle } from 'lucide-react';
import { LANGUAGES, LanguageCode } from '@/config/languages';

interface HeaderProps {
  currentLang?: LanguageCode;
}

export default function Header({ currentLang = 'en' }: HeaderProps) {
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
    { name: 'Destinations', href: '/destinations', icon: Map },
    { name: 'Decision Guides', href: '/guides', icon: HelpCircle },
  ];

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
          <div className="relative w-12 h-12 bg-gradient-ocean rounded-2xl flex items-center justify-center shadow-ocean transition-all duration-300 group-hover:scale-105 group-hover:rotate-3">
            <Compass className="w-7 h-7 text-white" />
            <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
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
              <span className="text-lg">{LANGUAGES[currentLang].flag}</span>
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
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Choose Language</p>
                  </div>
                  {Object.entries(LANGUAGES).map(([code, lang]) => (
                    <Link
                      key={code}
                      href={`/guides`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-ocean-50 transition-colors group"
                      onClick={() => setLangMenuOpen(false)}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <div className="flex-1">
                        <span className="text-slate-700 font-medium group-hover:text-ocean-600">{lang.name}</span>
                      </div>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Soon</span>
                    </Link>
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
            Decision Guides
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Language</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(LANGUAGES).slice(0, 6).map(([code, lang]) => (
                  <Link
                    key={code}
                    href="/guides"
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-ocean-50 rounded-lg text-sm transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-slate-700 font-medium truncate">{lang.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <hr className="my-4 border-gray-100" />

            <Link
              href="/guides"
              className="flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-ocean text-white text-center font-semibold rounded-xl hover:shadow-ocean transition-all shadow-soft"
              onClick={() => setMobileMenuOpen(false)}
            >
              <HelpCircle className="w-5 h-5" />
              Browse Decision Guides
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
