import { THEME_DESTINATIONS } from '@/config/destinations';

export const ADVENT_DESTINATIONS = THEME_DESTINATIONS.advent ?? [];

/**
 * Advent promotion window: 1 Oct → 7 Jan. Starts early on purpose — Google
 * needs weeks to crawl and rank the guides before the late-November searches.
 * Pages are statically cached, so this is evaluated at render/deploy time.
 */
export function isAdventSeason(now: Date = new Date()): boolean {
  const month = now.getMonth() + 1;
  return month >= 10 || (month === 1 && now.getDate() <= 7);
}
