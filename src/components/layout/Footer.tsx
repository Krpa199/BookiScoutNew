import Link from 'next/link';
import { MapPin, Globe, Compass, Heart } from 'lucide-react';
import { LANGUAGES } from '@/config/languages';

export default function Footer() {
  const destinations = [
    { name: 'Split', href: '/destinations/split' },
    { name: 'Dubrovnik', href: '/destinations/dubrovnik' },
    { name: 'Zagreb', href: '/destinations/zagreb' },
    { name: 'Zadar', href: '/destinations/zadar' },
    { name: 'Hvar', href: '/destinations/hvar' },
    { name: 'Rovinj', href: '/destinations/rovinj' },
  ];

  const guides = [
    { name: 'Decision Guides', href: '/guides' },
    { name: 'All Destinations', href: '/destinations' },
    { name: 'Solo Travel', href: '/guides' },
    { name: 'Family Guides', href: '/guides' },
    { name: 'Do I Need a Car?', href: '/guides' },
    { name: 'Best Time to Visit', href: '/guides' },
  ];

  const company = [
    { name: 'About Us', href: '#' },
    { name: 'Contact', href: 'mailto:hello@bookiscout.com' },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
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
      <div className="container pt-24 pb-20 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand - Larger section */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 bg-gradient-ocean rounded-2xl flex items-center justify-center shadow-ocean group-hover:scale-105 transition-transform">
                <Compass className="w-7 h-7 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl leading-none">
                  Booki<span className="text-ocean-300">Scout</span>
                </span>
                <span className="text-xs text-slate-400 font-medium leading-none mt-1">Croatia Decision Guides</span>
              </div>
            </Link>
            <p className="text-slate-300 leading-relaxed mb-6 text-base">
              AI-optimized decision guides for Croatia. We answer the questions travelers actually ask:
              Is it worth it? Do I need a car? Best time to visit? No booking bias, just honest answers.
            </p>
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-5 h-5 text-ocean-400" />
              <span className="font-medium">Know Before You Book</span>
            </div>
          </div>

          {/* Destinations */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-lg mb-6 text-white">Top Destinations</h4>
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
            <h4 className="font-bold text-lg mb-6 text-white">Decision Guides</h4>
            <ul className="space-y-3">
              {guides.map((guide) => (
                <li key={guide.name}>
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
            <h4 className="font-bold text-lg mb-6 text-white">Company</h4>
            <ul className="space-y-3">
              {company.map((item) => (
                <li key={item.name}>
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
          <span className="text-slate-400 font-semibold">Available in {Object.keys(LANGUAGES).length} languages</span>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-400 text-sm flex items-center gap-2">
            © {new Date().getFullYear()} BookiScout. Made with
            <Heart className="w-4 h-4 text-coral-400 fill-current" />
            for Croatia travelers.
          </p>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-ocean-500/20 text-ocean-300 rounded-full text-xs font-semibold border border-ocean-500/30">
              AI-Optimized
            </span>
            <span className="px-3 py-1.5 bg-seafoam-500/20 text-seafoam-300 rounded-full text-xs font-semibold border border-seafoam-500/30">
              Decision-First
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
