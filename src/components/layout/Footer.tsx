import Link from 'next/link';
import { MapPin, Mail, Globe, Compass, Heart, ExternalLink } from 'lucide-react';
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
    { name: 'Travel Guides', href: '/guides' },
    { name: 'All Destinations', href: '/destinations' },
    { name: 'Beach Guides', href: '/guides' },
    { name: 'Family Travel', href: '/guides' },
    { name: 'Local Tips', href: '/guides' },
    { name: 'Safety & Practical', href: '/guides' },
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
      <div className="container py-20 relative">
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
                <span className="text-xs text-slate-400 font-medium leading-none mt-1">Croatia Travel Guide</span>
              </div>
            </Link>
            <p className="text-slate-300 leading-relaxed mb-6 text-base">
              Your AI-powered guide to Croatia. Discover destinations, beaches, and neighborhoods
              that match your travel style. Make informed decisions with expert insights.
            </p>
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-5 h-5 text-ocean-400" />
              <span className="font-medium">Discover Croatia with Confidence</span>
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
            <h4 className="font-bold text-lg mb-6 text-white">Travel Resources</h4>
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

          {/* Newsletter */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-ocean-600/20 to-seafoam-600/20 backdrop-blur-sm border border-ocean-500/30 rounded-3xl p-6 shadow-soft">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5 text-ocean-300" />
                <span>Stay Updated</span>
              </h4>
              <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                Get AI-powered travel tips straight to your inbox.
              </p>
              <form className="space-y-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-slate-800/70 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/30 transition-all"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-gradient-ocean hover:shadow-ocean text-white font-semibold rounded-xl transition-all shadow-soft"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Join 10,000+ travelers. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-12" />

        {/* Languages Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-ocean-400" />
            <span className="text-slate-400 font-semibold">Available in {Object.keys(LANGUAGES).length} languages:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(LANGUAGES).map(([code, lang]) => (
              <button
                key={code}
                className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-ocean-500/50 rounded-xl text-sm text-slate-300 hover:text-ocean-300 transition-all cursor-not-allowed opacity-60"
                title="Multi-language support coming soon"
              >
                <span className="mr-2">{lang.flag}</span>
                {lang.name}
              </button>
            ))}
          </div>
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
              AI-Powered
            </span>
            <span className="px-3 py-1.5 bg-seafoam-500/20 text-seafoam-300 rounded-full text-xs font-semibold border border-seafoam-500/30">
              Always Updated
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
