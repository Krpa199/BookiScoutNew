'use client';

import Image from 'next/image';
import { MapPin, Globe, Heart, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { locales } from '@/i18n/config';

export default function Footer() {
  const t = useTranslations('footer');

  const destinations = [
    { name: 'Split', href: '/destinations/split' },
    { name: 'Dubrovnik', href: '/destinations/dubrovnik' },
    { name: 'Zagreb', href: '/destinations/zagreb' },
    { name: 'Zadar', href: '/destinations/zadar' },
    { name: 'Hvar', href: '/destinations/hvar' },
    { name: 'Rovinj', href: '/destinations/rovinj' },
  ];

  const guides = [
    { name: t('decisionGuides'), href: '/guides' },
    { name: t('allDestinations'), href: '/destinations' },
    { name: t('soloTravel'), href: '/guides' },
    { name: t('familyGuides'), href: '/guides' },
    { name: t('doINeedCar'), href: '/guides' },
    { name: t('bestTime'), href: '/guides' },
  ];

  const company = [
    { name: t('aboutUs'), href: '/about' },
    { name: t('contact'), href: '/contact' },
    { name: t('privacy'), href: '/privacy' },
    { name: t('terms'), href: '/terms' },
  ];

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Background decoration - Ocean themed */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ocean-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-seafoam-500 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-coral-500 rounded-full blur-3xl" />
      </div>

      {/* Main Footer */}
      <div className="container pt-12 sm:pt-16 md:pt-24 pb-8 sm:pb-12 md:pb-20 relative">

        {/* Mobile: Brand centered at top */}
        <div className="md:hidden text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3 group">
            <div className="w-14 h-14 group-hover:scale-105 transition-transform">
              <Image
                src="/icon.png"
                alt="BookiScout"
                width={56}
                height={56}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-2xl leading-none">
                Booki<span className="text-ocean-300">Scout</span>
              </span>
              <span className="text-xs text-slate-400 font-medium mt-1">{t('tagline')}</span>
            </div>
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed mt-4 max-w-xs mx-auto">
            {t('description')}
          </p>
        </div>

        {/* Mobile: Links in 2-column grid */}
        <div className="md:hidden grid grid-cols-2 gap-6 mb-8">
          {/* Destinations */}
          <div>
            <h4 className="font-bold text-sm mb-3 text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-ocean-400" />
              {t('topDestinations')}
            </h4>
            <ul className="space-y-2">
              {destinations.slice(0, 4).map((dest) => (
                <li key={dest.name}>
                  <Link
                    href={dest.href}
                    className="text-slate-400 hover:text-ocean-300 transition-colors text-sm flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    {dest.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/destinations"
                  className="text-ocean-400 hover:text-ocean-300 transition-colors text-sm font-medium"
                >
                  {t('allDestinations')} →
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm mb-3 text-white">{t('company')}</h4>
            <ul className="space-y-2">
              {company.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-ocean-300 transition-colors text-sm flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mobile: Guides as horizontal scroll */}
        <div className="md:hidden mb-8">
          <h4 className="font-bold text-sm mb-3 text-white">{t('decisionGuides')}</h4>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {guides.slice(0, 4).map((guide, index) => (
              <Link
                key={index}
                href={guide.href}
                className="flex-shrink-0 px-3 py-1.5 bg-slate-800/50 text-slate-300 rounded-full text-xs font-medium border border-slate-700 hover:border-ocean-500 hover:text-ocean-300 transition-colors"
              >
                {guide.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-12 gap-10 md:gap-12 mb-10 md:mb-16">
          {/* Brand - Larger section */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 group-hover:scale-105 transition-transform">
                <Image
                  src="/icon.png"
                  alt="BookiScout"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl leading-none">
                  Booki<span className="text-ocean-300">Scout</span>
                </span>
                <span className="text-xs text-slate-400 font-medium leading-none mt-1">{t('tagline')}</span>
              </div>
            </Link>
            <p className="text-base text-slate-300 leading-relaxed mb-6">
              {t('description')}
            </p>
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-5 h-5 text-ocean-400" />
              <span className="text-base font-medium">{t('cta')}</span>
            </div>
          </div>

          {/* Destinations */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-lg mb-6 text-white">{t('topDestinations')}</h4>
            <ul className="space-y-3">
              {destinations.map((dest) => (
                <li key={dest.name}>
                  <Link
                    href={dest.href}
                    className="text-slate-400 hover:text-ocean-300 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-ocean-400 transition-colors" />
                    <span>{dest.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Guides */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-lg mb-6 text-white">{t('decisionGuides')}</h4>
            <ul className="space-y-3">
              {guides.map((guide, index) => (
                <li key={index}>
                  <Link
                    href={guide.href}
                    className="text-slate-400 hover:text-ocean-300 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-ocean-400 transition-colors" />
                    <span>{guide.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-lg mb-6 text-white">{t('company')}</h4>
            <ul className="space-y-3">
              {company.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-ocean-300 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-ocean-400 transition-colors" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Languages info */}
        <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
          <Globe className="w-4 h-4 text-ocean-400" />
          <span className="text-sm text-slate-400 font-medium">{t('availableIn', { count: locales.length })}</span>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-6" />

        {/* Bottom Bar */}
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          {/* Badges - shown first on mobile */}
          <div className="flex items-center gap-2 order-1 md:order-2">
            <span className="px-2.5 py-1 bg-ocean-500/20 text-ocean-300 rounded-full text-[10px] font-semibold border border-ocean-500/30">
              {t('aiOptimized')}
            </span>
            <span className="px-2.5 py-1 bg-seafoam-500/20 text-seafoam-300 rounded-full text-[10px] font-semibold border border-seafoam-500/30">
              {t('decisionFirst')}
            </span>
          </div>

          {/* Copyright */}
          <p className="text-slate-500 text-xs flex items-center gap-1.5 order-2 md:order-1">
            {t('copyright', { year: new Date().getFullYear() })}
            <Heart className="w-3 h-3 text-coral-400 fill-current" />
            {t('forTravelers')}
          </p>
        </div>
      </div>
    </footer>
  );
}
