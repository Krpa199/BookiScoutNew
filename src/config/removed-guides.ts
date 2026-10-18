/**
 * Guides deleted because the destination × theme matrix produced pages that
 * make no sense (sailing at Plitvice, nightlife in Krka National Park, Split vs
 * Split, Rovinj vs Istria — Rovinj IS in Istria). They read as auto-generated
 * doorway pages, a "scaled content" signal for Google.
 *
 * The JSON files are gone; old URLs 301 to the destination page so links and
 * any ranking go somewhere useful. The generator also skips these combinations
 * so they are never written again.
 */
export const REMOVED_GUIDES: Readonly<Record<string, string>> = Object.fromEntries(
  [
    // Sea/island themes for inland places
    'plitvice-beach', 'plitvice-sailing', 'plitvice-island-hopping', 'plitvice-ferry-connections',
    'krka-beach', 'krka-ferry-connections',
    'zagreb-beach', 'zagreb-sailing', 'zagreb-snorkeling-and-diving', 'zagreb-island-hopping', 'zagreb-ferry-connections',
    // Town-life themes for national parks
    'plitvice-nightlife', 'krka-nightlife',
    'plitvice-digital-nomads', 'krka-digital-nomads',
    'plitvice-wifi-quality', 'krka-wifi-quality',
    'plitvice-lgbt-friendly', 'krka-lgbt-friendly',
    'plitvice-coast-vs-inland', 'krka-coast-vs-inland',
    'krka-walkability',
    // A place compared with itself
    'dubrovnik-vs-dubrovnik', 'split-vs-split', 'zadar-vs-zadar', 'zagreb-vs-zagreb',
    // An Istrian town compared with Istria
    'fazana-vs-istria', 'medulin-vs-istria', 'novigrad-vs-istria', 'porec-vs-istria',
    'pula-vs-istria', 'rovinj-vs-istria', 'umag-vs-istria', 'vrsar-vs-istria',
  ].map(slug => [slug, slug.split('-')[0]]),
);

export const isRemovedGuide = (destination: string, theme: string): boolean =>
  `${destination}-${theme}` in REMOVED_GUIDES;
