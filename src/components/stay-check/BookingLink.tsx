'use client';

import { ExternalLink } from 'lucide-react';
import { trackBookingClick } from '@/lib/analytics';

// Client component so a Booking.com link can fire a GA click event from within
// the server-rendered StayCheckAreaReport. Keeps the rest of that report on the server.
export default function BookingLink({
  query,
  source,
  label = 'Search on Booking.com',
  className = 'inline-flex items-center gap-1 text-xs text-ocean-600 hover:text-ocean-700 font-medium',
}: {
  query: string;
  source: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(query)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackBookingClick(source, query)}
      className={className}
    >
      {label} <ExternalLink className="w-3 h-3" />
    </a>
  );
}
