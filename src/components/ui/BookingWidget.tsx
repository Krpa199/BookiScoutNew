'use client';

import { Search, Calendar, Users } from 'lucide-react';

interface BookingWidgetProps {
  destination: string;
  destinationSlug?: string;
  className?: string;
}

// =============================================================================
// BOOKING.COM AFFILIATE CONFIGURATION
// =============================================================================
//
// To get your affiliate ID:
// 1. Sign up at https://www.booking.com/affiliate-program/
// 2. Get your affiliate ID (aid) from the dashboard
// 3. Replace 'YOUR_AFFILIATE_ID' below with your actual ID
//
const BOOKING_AFFILIATE_ID = 'YOUR_AFFILIATE_ID';

export default function BookingWidget({
  destination,
  destinationSlug,
  className = ''
}: BookingWidgetProps) {

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const checkin = formData.get('checkin') as string;
    const checkout = formData.get('checkout') as string;
    const guests = formData.get('guests') as string;

    // Build Booking.com search URL with affiliate tracking
    const searchParams = new URLSearchParams({
      aid: BOOKING_AFFILIATE_ID,
      ss: `${destination}, Croatia`,
      lang: 'en',
      checkin: checkin || '',
      checkout: checkout || '',
      group_adults: guests || '2',
      no_rooms: '1',
    });

    const bookingUrl = `https://www.booking.com/searchresults.html?${searchParams.toString()}`;

    // Open in new tab
    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
  };

  // Get tomorrow and day after for default dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 3);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  return (
    <div className={`bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Search className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Find Accommodation</h3>
          <p className="text-blue-100 text-sm">in {destination}, Croatia</p>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-3">
        {/* Destination (pre-filled, readonly) */}
        <div className="relative">
          <input
            type="text"
            value={`${destination}, Croatia`}
            readOnly
            className="w-full pl-4 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 cursor-not-allowed"
          />
        </div>

        {/* Dates Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              type="date"
              name="checkin"
              defaultValue={formatDate(tomorrow)}
              min={formatDate(tomorrow)}
              className="w-full pl-10 pr-3 py-3 rounded-xl bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              name="checkout"
              defaultValue={formatDate(dayAfter)}
              min={formatDate(tomorrow)}
              className="w-full pl-10 pr-3 py-3 rounded-xl bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        {/* Guests */}
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            name="guests"
            defaultValue="2"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none cursor-pointer"
          >
            <option value="1">1 Guest</option>
            <option value="2">2 Guests</option>
            <option value="3">3 Guests</option>
            <option value="4">4 Guests</option>
            <option value="5">5 Guests</option>
            <option value="6">6+ Guests</option>
          </select>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Search className="w-5 h-5" />
          Search on Booking.com
        </button>
      </form>

      {/* Powered by */}
      <p className="text-center text-blue-200 text-xs mt-4">
        Powered by Booking.com
      </p>
    </div>
  );
}
