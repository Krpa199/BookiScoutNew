/**
 * Feature Flags Configuration
 *
 * Controls monetization and AI optimization features.
 * These can be toggled via environment variables for A/B testing and kill switches.
 */

export const features = {
  /**
   * Global toggle for Booking.com affiliate widget
   * If false, no widgets will be shown anywhere
   */
  bookingWidgetEnabled:
    process.env.NEXT_PUBLIC_BOOKING_WIDGET_ENABLED === 'true',

  /**
   * Show Booking widget on /guides/ pages (AI decision content)
   *
   * IMPORTANT: Keep this false by default to maintain AI citability.
   * Only enable if metrics show no negative impact on AI discovery.
   */
  bookingWidgetOnGuides:
    process.env.NEXT_PUBLIC_BOOKING_WIDGET_ON_GUIDES === 'true',

  /**
   * Show Booking widget on /articles/ pages (transaction content)
   *
   * This is the primary monetization layer. Safe to keep enabled.
   */
  bookingWidgetOnArticles:
    process.env.NEXT_PUBLIC_BOOKING_WIDGET_ON_ARTICLES === 'true',

  /**
   * Enable internal links from guides to articles
   *
   * Allows soft linking from decision content to transaction content.
   */
  guidesInternalLinksEnabled:
    process.env.NEXT_PUBLIC_GUIDES_INTERNAL_LINKS_ENABLED === 'true',
} as const;

/**
 * Helper function to determine if Booking widget should render
 */
export function shouldShowBookingWidget(
  contentType: 'guide' | 'article'
): boolean {
  if (!features.bookingWidgetEnabled) {
    return false;
  }

  if (contentType === 'guide') {
    return features.bookingWidgetOnGuides;
  }

  if (contentType === 'article') {
    return features.bookingWidgetOnArticles;
  }

  return false;
}

/**
 * Metrics tracking helpers
 *
 * TODO: Implement tracking for kill switch logic
 */
export const metrics = {
  /**
   * Track clicks on Booking widget
   */
  trackBookingWidgetClick: (contentType: 'guide' | 'article', slug: string) => {
    if (typeof window !== 'undefined') {
      // Send to analytics
      console.log('[Metrics] Booking widget click:', { contentType, slug });
      // TODO: Implement actual analytics (GA4, Plausible, etc.)
    }
  },

  /**
   * Track AI referrals (ChatGPT, Perplexity, etc.)
   */
  trackAIReferral: (source: string, slug: string) => {
    if (typeof window !== 'undefined') {
      console.log('[Metrics] AI referral:', { source, slug });
      // TODO: Implement actual tracking
    }
  },
};
