'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Destination } from '@/config/destinations';
import { getDestinationImage } from '@/config/images';

interface DestinationCardProps {
  destination: Destination;
  /** @deprecated no longer shown — every card used to claim "20 guides" */
  articleCount?: number;
}

/**
 * Photo card in the guides' editorial style: full-bleed photo, name in the
 * display face, region underneath. No "Popular" badge or generic type icon —
 * those were identical on every card and read as template filler.
 */
export default function DestinationCard({ destination }: DestinationCardProps) {
  const t = useTranslations('destinations.card');
  const tRegions = useTranslations('regions');
  const image = getDestinationImage(destination.slug);

  const regionKey = destination.region.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const regionName = (() => {
    try {
      return tRegions(regionKey as never);
    } catch {
      return destination.region.replace('-', ' ');
    }
  })();

  return (
    <Link href={`/destinations/${destination.slug}`} className="group block">
      <article className="relative aspect-[4/3] sm:aspect-[5/4] overflow-hidden rounded-2xl bg-ocean-100 shadow-[0_1px_2px_rgba(12,74,110,0.06),0_6px_20px_-6px_rgba(12,74,110,0.18)]">
        <Image
          src={image.url}
          alt={image.alt}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/85 via-ocean-900/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-sand-200">{regionName}</p>
          <h3 className="mt-1 font-display text-3xl font-semibold leading-none text-white">{destination.name}</h3>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white/80 group-hover:text-white">
            {t('explore')}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}
