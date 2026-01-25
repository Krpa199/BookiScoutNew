'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Globe, ChevronDown } from 'lucide-react';
import { LANGUAGES, LanguageCode } from '@/config/languages';

interface HeaderProps {
  currentLang?: LanguageCode;
}

export default function Header({ currentLang = 'en' }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const navigation = [
    { name: 'Destinations', href: '/destinations' },
    { name: 'Blog', href: '/blog' },
    { name: 'Beaches', href: '/blog?theme=beach' },
    { name: 'Apartments', href: '/blog?theme=apartments' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <nav className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="font-bold text-xl text-gray-900">
            Booki<span className="text-blue-600">Scout</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Language Selector & CTA */}
        <div className="hidden md:flex items-center gap-4">
          {/* Language Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>{LANGUAGES[currentLang].flag}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 max-h-80 overflow-y-auto">
                {Object.entries(LANGUAGES).map(([code, lang]) => (
                  <Link
                    key={code}
                    href={`/${code}`}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                    onClick={() => setLangMenuOpen(false)}
                  >
                    <span>{lang.flag}</span>
                    <span className="text-gray-700">{lang.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Newsletter CTA */}
          <Link
            href="/newsletter"
            className="btn-primary text-sm"
          >
            Get Travel Tips
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-600" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="container py-4 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 text-gray-600 hover:text-gray-900 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <hr className="border-gray-100" />
            <div className="flex flex-wrap gap-2">
              {Object.entries(LANGUAGES).slice(0, 6).map(([code, lang]) => (
                <Link
                  key={code}
                  href={`/${code}`}
                  className="px-3 py-2 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                  {lang.flag} {lang.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
