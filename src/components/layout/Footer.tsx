'use client';

import Image from 'next/image';
import { MapPin, Globe, Heart } from 'lucide-react';
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
      <div className="container pt-16 md:pt-24 pb-20 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
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
            <p className="text-slate-300 leading-relaxed mb-6 text-base">
              {t('description')}
            </p>
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-5 h-5 text-ocean-400" />
              <span className="font-medium">{t('cta')}</span>
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
        <div className="flex items-center gap-3 mb-8">
          <Globe className="w-5 h-5 text-ocean-400" />
          <span className="text-slate-400 font-semibold">{t('availableIn', { count: locales.length })}</span>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-400 text-sm flex items-center gap-2">
            {t('copyright', { year: new Date().getFullYear() })}
            <Heart className="w-4 h-4 text-coral-400 fill-current" />
            {t('forTravelers')}
          </p>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-ocean-500/20 text-ocean-300 rounded-full text-xs font-semibold border border-ocean-500/30">
              {t('aiOptimized')}
            </span>
            <span className="px-3 py-1.5 bg-seafoam-500/20 text-seafoam-300 rounded-full text-xs font-semibold border border-seafoam-500/30">
              {t('decisionFirst')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
