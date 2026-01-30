import Link from 'next/link';
import { MapPin, Clock, Star, ArrowRight, Sparkles } from 'lucide-react';

interface ArticleCardProps {
  title: string;
  description: string;
  destination: string;
  destinationName: string;
  theme: string;
  language: string;
  image?: string;
  readTime?: number;
}

export default function ArticleCard({
  title,
  description,
  destination,
  destinationName,
  theme,
  language,
  image,
  readTime = 5,
}: ArticleCardProps) {
  const href = `/guides/${language}/${destination}-${theme}`;

  // Theme colors and icons - Ocean themed
  const themeStyles: Record<string, { bg: string; text: string; gradient: string; label: string }> = {
    apartments: {
      bg: 'bg-ocean-100',
      text: 'text-ocean-700',
      gradient: 'from-ocean-400 to-ocean-600',
      label: 'Apartments'
    },
    family: {
      bg: 'bg-seafoam-100',
      text: 'text-seafoam-700',
      gradient: 'from-seafoam-400 to-seafoam-600',
      label: 'Family'
    },
    beach: {
      bg: 'bg-cyan-100',
      text: 'text-cyan-700',
      gradient: 'from-cyan-400 to-cyan-600',
      label: 'Beaches'
    },
    budget: {
      bg: 'bg-sand-100',
      text: 'text-sand-700',
      gradient: 'from-sand-400 to-sand-600',
      label: 'Budget'
    },
    luxury: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      gradient: 'from-purple-400 to-purple-600',
      label: 'Luxury'
    },
    restaurants: {
      bg: 'bg-coral-100',
      text: 'text-coral-700',
      gradient: 'from-coral-400 to-coral-600',
      label: 'Food'
    },
    'things-to-do': {
      bg: 'bg-indigo-100',
      text: 'text-indigo-700',
      gradient: 'from-indigo-400 to-indigo-600',
      label: 'Activities'
    },
    'hidden-gems': {
      bg: 'bg-pink-100',
      text: 'text-pink-700',
      gradient: 'from-pink-400 to-pink-600',
      label: 'Hidden Gems'
    },
    couples: {
      bg: 'bg-rose-100',
      text: 'text-rose-700',
      gradient: 'from-rose-400 to-rose-600',
      label: 'Couples'
    },
    nightlife: {
      bg: 'bg-violet-100',
      text: 'text-violet-700',
      gradient: 'from-violet-400 to-violet-600',
      label: 'Nightlife'
    },
    'day-trips': {
      bg: 'bg-teal-100',
      text: 'text-teal-700',
      gradient: 'from-teal-400 to-teal-600',
      label: 'Day Trips'
    },
    weather: {
      bg: 'bg-sky-100',
      text: 'text-sky-700',
      gradient: 'from-sky-400 to-sky-600',
      label: 'Weather'
    },
    'local-food': {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      gradient: 'from-orange-400 to-orange-600',
      label: 'Local Food'
    },
  };

  const style = themeStyles[theme] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    gradient: 'from-slate-400 to-slate-600',
    label: theme
  };

  return (
    <Link href={href} className="group block">
      <article className="bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-ocean transition-all duration-500 border border-slate-100 hover:border-ocean-200 h-full flex flex-col hover:-translate-y-1">
        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient}`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-white/30" />
              </div>
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id={`pattern-${theme}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <circle cx="10" cy="10" r="1.5" fill="white" />
                      <circle cx="30" cy="30" r="1" fill="white" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#pattern-${theme})`} />
                </svg>
              </div>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Theme Badge */}
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${style.bg} ${style.text} shadow-soft backdrop-blur-sm`}>
              {style.label}
            </span>
          </div>

          {/* AI Badge */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-xl text-xs font-bold text-slate-700 shadow-soft flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-ocean-500" />
              AI-Powered
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Location */}
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-3">
            <div className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center">
              <MapPin className="w-3 h-3" />
            </div>
            <span className="font-medium">{destinationName}, Croatia</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-xl text-slate-900 mb-3 line-clamp-2 group-hover:text-ocean-600 transition-colors leading-snug">
            {title}
          </h3>

          {/* Description */}
          <p className="text-slate-600 text-sm line-clamp-2 mb-5 leading-relaxed flex-1">
            {description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{readTime} min read</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sand-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold text-slate-700">4.8</span>
              </div>
              <div className="flex items-center gap-1 text-ocean-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm">Read</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom border accent on hover */}
        <div className={`h-1 bg-gradient-to-r ${style.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
      </article>
    </Link>
  );
}
