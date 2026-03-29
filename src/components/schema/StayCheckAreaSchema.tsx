/**
 * JSON-LD Schema for Stay Check Area Pages
 * Review + TouristDestination + FAQPage for rich search results
 */

import type { StayCheckDestinationData } from '@/components/stay-check/StayCheckAreaReport';

interface Props {
  data: StayCheckDestinationData;
}

export default function StayCheckAreaSchema({ data }: Props) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const a: any = data.analysis;
  const year = new Date().getFullYear();

  // Review schema
  const reviewSchema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'TouristDestination',
      name: `${data.destinationName}, Croatia`,
      description: a.shortSummary || `Area review of ${data.destinationName}`,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: data.lat,
        longitude: data.lng,
      },
      touristType: ['Families', 'Couples', 'Solo Travelers', 'Groups', 'Digital Nomads'],
    },
    image: `https://bookiscout.com/stay-check/${data.destination}/opengraph-image`,
    inLanguage: ['en', 'de', 'hr', 'it', 'fr', 'es', 'pl', 'cz', 'hu', 'sk', 'nl', 'sl', 'ru'],
    reviewBody: a.shortSummary || '',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: data.scores.overallScore,
      bestRating: 100,
      worstRating: 0,
    },
    author: {
      '@type': 'Organization',
      name: 'BookiScout',
      url: 'https://bookiscout.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'BookiScout',
      url: 'https://bookiscout.com',
    },
    datePublished: data.generatedAt,
  };

  // Generate FAQ from analysis data
  const faqEntries: { question: string; answer: string }[] = [];

  if (a.seasonalAdvice) {
    faqEntries.push({
      question: `When is the best time to visit ${data.destinationName}?`,
      answer: a.seasonalAdvice,
    });
  }

  if (a.budgetEstimate && a.budgetEstimate.dailyHigh > 0) {
    faqEntries.push({
      question: `How much does it cost per day in ${data.destinationName}?`,
      answer: `Budget approximately €${a.budgetEstimate.dailyLow}–${a.budgetEstimate.dailyHigh} per person per day. ${a.budgetEstimate.tips?.[0] || ''}`,
    });
  }

  if (a.beachReport?.beaches?.length > 0) {
    const beachNames = a.beachReport.beaches.map((b: any) => b.name).join(', ');
    faqEntries.push({
      question: `What are the best beaches near ${data.destinationName}?`,
      answer: `The nearby beaches include ${beachNames}. ${a.beachReport.bestForKids ? `Best for kids: ${a.beachReport.bestForKids}.` : ''} ${a.beachReport.bestForRelaxing ? `Best for relaxing: ${a.beachReport.bestForRelaxing}.` : ''}`,
    });
  }

  if (a.walkabilityDescription) {
    faqEntries.push({
      question: `Is ${data.destinationName} walkable?`,
      answer: a.walkabilityDescription,
    });
  }

  if (a.noiseAssessment) {
    faqEntries.push({
      question: `Is ${data.destinationName} noisy at night?`,
      answer: a.noiseAssessment,
    });
  }

  const guestTypeScores = data.scores.guestTypeScores;
  if (guestTypeScores.family) {
    faqEntries.push({
      question: `Is ${data.destinationName} good for families?`,
      answer: `${data.destinationName} scores ${guestTypeScores.family.score}/100 for families. ${guestTypeScores.family.comment}`,
    });
  }

  const faqSchema = faqEntries.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntries.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  // BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'BookiScout',
        item: 'https://bookiscout.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Stay Check',
        item: 'https://bookiscout.com/stay-check',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${data.destinationName} Area Review`,
        item: `https://bookiscout.com/stay-check/${data.destination}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
