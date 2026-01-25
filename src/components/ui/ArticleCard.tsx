import Link from 'next/link';
import { MapPin, Clock, Star } from 'lucide-react';

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
  const href = `/blog/${language}/${destination}-${theme}`;

  // Theme colors and icons
  const themeStyles: Record<string, { bg: string; text: string; label: string }> = {
    apartments: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Apartments' },
    family: { bg: 'bg-green-100', text: 'text-green-700', label: 'Family' },
    beach: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Beaches' },
    budget: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Budget' },
    luxury: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Luxury' },
    restaurants: { bg: 'bg-red-100', text: 'text-red-700', label: 'Food' },
    'things-to-do': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Activities' },
    'hidden-gems': { bg: 'bg-pink-100', text: 'text-pink-700', label: 'Hidden Gems' },
  };

  const style = themeStyles[theme] || { bg: 'bg-gray-100', text: 'text-gray-700', label: theme };

  return (
    <Link href={href} className="group block">
      <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl opacity-50">🏖️</span>
            </div>
          )}

          {/* Theme Badge */}
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
              {style.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Location */}
          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>{destinationName}, Croatia</span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-400 text-sm">
              <Clock className="w-3.5 h-3.5" />
              <span>{readTime} min read</span>
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">4.8</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
