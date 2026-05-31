// Lightweight Google Analytics (gtag) event helper.
// gtag is loaded globally in src/app/layout.tsx. These wrappers let any
// client component fire custom events without re-checking window/gtag each time.
//
// View results in GA4 under: Reports → Engagement → Events.

type GtagEventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: 'event', eventName: string, params?: GtagEventParams) => void;
  }
}

/** Fire a custom GA event. No-ops safely if gtag hasn't loaded (SSR, ad blockers). */
export function trackEvent(eventName: string, params?: GtagEventParams): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

// --- Named events used across the app (keep names stable so GA history stays consistent) ---

/** User clicked "Analyze" on the Stay Check form. The real "people who use the tool" number. */
export function trackStayCheckSubmit(location: string): void {
  trackEvent('stay_check_submit', { location });
}

/** Stay Check returned a successful analysis. */
export function trackStayCheckSuccess(location: string): void {
  trackEvent('stay_check_success', { location });
}

/** Stay Check failed (API error, connection error, etc.). */
export function trackStayCheckError(reason: string): void {
  trackEvent('stay_check_error', { reason });
}

/** User clicked a Booking.com (or other accommodation) link. Future affiliate-revenue signal. */
export function trackBookingClick(source: string, query?: string): void {
  trackEvent('booking_click', { source, query });
}
