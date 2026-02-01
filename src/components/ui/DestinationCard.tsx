'use client';

import { MapPin, Waves, Mountain, Building, TrendingUp, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Destination } from '@/config/destinations';
import { getDestinationImage } from '@/config/images';

interface DestinationCardProps {
  destination: Destination;
  articleCount?: number;
}

export default function DestinationCard({ destination, articleCount = 0 }: DestinationCardProps) {
  const t = useTranslations('destinations.card');
  const tRegions = useTranslations('regions');

  const typeIcons = {
    city: Building,
    town: Building,
    island: Waves,
    'national-park': Mountain,
  };

  const regionColors = {
    istria: { gradient: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-500' },
    kvarner: { gradient: 'from-blue-500 to-cyan-600', badge: 'bg-blue-500' },
    dalmatia: { gradient: 'from-cyan-500 to-blue-600', badge: 'bg-cyan-500' },
    'split-dalmatia': { gradient: 'from-blue-600 to-indigo-600', badge: 'bg-blue-600' },
    dubrovnik: { gradient: 'from-amber-500 to-orange-600', badge: 'bg-amber-500' },
    continental: { gradient: 'from-lime-500 to-green-600', badge: 'bg-lime-500' },
    zagreb: { gradient: 'from-rose-500 to-pink-600', badge: 'bg-rose-500' },
  };

  const Icon = typeIcons[destination.type];
  const colors = regionColors[destination.region];
  const image = getDestinationImage(destination.slug);

  // Get translated region name
  const regionTranslationKey = destination.region.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const regionName = (() => {
    try {
      return tRegions(regionTranslationKey as any);
    } catch {
      return destination.region.replace('-', ' ');
    }
  })();

  return (
    <Link href={`/destinations/${destination.slug}`} className="group block">
      <article className="relative h-80 rounded-3xl overflow-hidden shadow-soft hover:shadow-ocean transition-all duration-500 hover:-translate-y-2">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={image.url}
            alt={image.alt}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
          {/* Overlay with gradient */}
          <div className={`absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity`} />
          {/* Subtle color overlay based on region */}
          <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500 mix-blend-overlay`} />
        </div>

        {/* Shine effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" />
        </div>

        {/* Content */}
        <div className="relative h-full p-6 flex flex-col justify-between">
          {/* Top Row - Icon & Badge */}
          <div className="flex items-start justify-between">
            {/* Type Icon */}
            <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl shadow-soft group-hover:bg-white/25 transition-all group-hover:scale-110 group-hover:rotate-6">
              <Icon className="w-6 h-6 text-white" />
            </div>

            {/* Popular Badge */}
            {destination.popular && (
              <div className="px-3 py-1.5 bg-sand-400 backdrop-blur-sm rounded-full text-white text-xs font-bold flex items-center gap-1.5 shadow-soft group-hover:scale-105 transition-transform">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{t('popular')}</span>
              </div>
            )}
          </div>

          {/* Bottom Content */}
          <div className="space-y-3">
            {/* Title */}
            <div>
              <h3 className="text-3xl font-bold text-white mb-2 group-hover:translate-x-1 transition-transform duration-300 drop-shadow-lg">
                {destination.name}
              </h3>

              {/* Region & Article Count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium capitalize">
                    {regionName}
                  </span>
                </div>

                {articleCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span className="text-white text-sm font-semibold">
                      {t('guides', { count: articleCount })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Hover CTA */}
            <div className="flex items-center gap-2 text-white font-semibold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <span className="text-sm">{t('explore')}</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Border glow on hover */}
        <div className="absolute inset-0 rounded-3xl border-2 border-white/0 group-hover:border-white/20 transition-colors duration-500" />
      </article>
    </Link>
  );
}
