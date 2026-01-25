import Link from 'next/link';
import { MapPin, Mail, Globe } from 'lucide-react';
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

  const topics = [
    { name: 'Best Beaches', href: '/blog?theme=beach' },
    { name: 'Family Apartments', href: '/blog?theme=family' },
    { name: 'Budget Travel', href: '/blog?theme=budget' },
    { name: 'Local Food', href: '/blog?theme=local-food' },
    { name: 'Things to Do', href: '/blog?theme=things-to-do' },
    { name: 'Day Trips', href: '/blog?theme=day-trips' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="font-bold text-xl">
                Booki<span className="text-blue-400">Scout</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Your ultimate guide to Croatia. Discover the best apartments, beaches, restaurants,
              and hidden gems across the Adriatic coast.
            </p>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <MapPin className="w-4 h-4" />
              <span>Croatia Travel Guide</span>
            </div>
          </div>

          {/* Destinations */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Top Destinations</h4>
            <ul className="space-y-3">
              {destinations.map((dest) => (
                <li key={dest.name}>
                  <Link
                    href={dest.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {dest.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Topics */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Travel Guides</h4>
            <ul className="space-y-3">
              {topics.map((topic) => (
                <li key={topic.name}>
                  <Link
                    href={topic.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {topic.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Get Travel Tips</h4>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe for the best Croatia travel tips, deals, and hidden gems.
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                className="w-full btn-primary"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Languages Bar */}
      <div className="border-t border-gray-800">
        <div className="container py-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="text-gray-500 text-sm">Available in:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(LANGUAGES).map(([code, lang]) => (
              <Link
                key={code}
                href={`/${code}`}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
              >
                {lang.flag} {lang.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} BookiScout. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-gray-500 hover:text-white text-sm transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-white text-sm transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="text-gray-500 hover:text-white text-sm transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
