import { Destination } from '@/config/destinations';

interface DestinationSchemaProps {
  destination: Destination;
  description: string;
  regionName: string;
  url: string;
  imageUrl?: string;
}

export default function DestinationSchema({
  destination,
  description,
  regionName,
  url,
  imageUrl,
}: DestinationSchemaProps) {
  // Determine tourist type based on destination type
  const getTouristType = () => {
    switch (destination.type) {
      case 'city':
        return ['Business', 'Cultural', 'Leisure'];
      case 'town':
        return ['Beach', 'Cultural', 'Leisure'];
      case 'island':
        return ['Beach', 'Adventure', 'Leisure'];
      case 'national-park':
        return ['Adventure', 'Eco', 'Leisure'];
      default:
        return ['Leisure'];
    }
  };

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: destination.name,
    description: description,
    url: url,
    touristType: getTouristType(),
    geo: {
      '@type': 'GeoCoordinates',
      latitude: destination.lat,
      longitude: destination.lng,
    },
    containedInPlace: {
      '@type': 'AdministrativeArea',
      name: regionName,
      containedInPlace: {
        '@type': 'Country',
        name: 'Croatia',
        alternateName: 'Hrvatska',
        identifier: 'HR',
      },
    },
    ...(imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: imageUrl,
        caption: `${destination.name}, Croatia`,
      },
    }),
    // Additional helpful properties for AI
    isAccessibleForFree: true,
    publicAccess: true,
    // Indicate this is a travel guide
    additionalType: 'https://schema.org/Place',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
