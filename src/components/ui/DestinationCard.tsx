import Link from 'next/link';
import { MapPin, Sun, Waves, Mountain, Building } from 'lucide-react';
import { Destination } from '@/config/destinations';

interface DestinationCardProps {
  destination: Destination;
  articleCount?: number;
}

export default function DestinationCard({ destination, articleCount = 0 }: DestinationCardProps) {
  const typeIcons = {
    city: Building,
    town: Building,
    island: Waves,
    'national-park': Mountain,
  };

  const regionColors = {
    istria: 'from-green-400 to-emerald-500',
    kvarner: 'from-blue-400 to-cyan-500',
    dalmatia: 'from-cyan-400 to-blue-500',
    'split-dalmatia': 'from-blue-500 to-indigo-500',
    dubrovnik: 'from-amber-400 to-orange-500',
    continental: 'from-lime-400 to-green-500',
    zagreb: 'from-red-400 to-pink-500',
  };

  const Icon = typeIcons[destination.type];
  const gradient = regionColors[destination.region];

  return (
    <Link href={`/destinations/${destination.slug}`} className="group block">
      <article className="relative h-64 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

        {/* Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative h-full p-6 flex flex-col justify-between">
          {/* Top */}
          <div className="flex items-start justify-between">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Icon className="w-6 h-6 text-white" />
            </div>
            {destination.popular && (
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium flex items-center gap-1">
                <Sun className="w-3 h-3" />
                Popular
              </span>
            )}
          </div>

          {/* Bottom */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-2 group-hover:translate-x-1 transition-transform">
              {destination.name}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-white/80 text-sm">
                <MapPin className="w-4 h-4" />
                <span className="capitalize">{destination.region.replace('-', ' ')}</span>
              </div>
              {articleCount > 0 && (
                <span className="text-white/80 text-sm">
                  {articleCount} guides
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </article>
    </Link>
  );
}
