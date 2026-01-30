interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  author?: string;
  image?: string;
  destination?: string;
  faq?: { question: string; answer: string }[];
  howToSteps?: { name: string; text: string }[];
  topList?: { name: string; description: string; position: number }[];
}

export default function ArticleSchema({
  title,
  description,
  url,
  datePublished,
  dateModified,
  author = 'BookiScout Team',
  image,
  destination,
  faq,
  howToSteps,
  topList,
}: ArticleSchemaProps) {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    url: url,
    datePublished: datePublished,
    dateModified: dateModified,
    author: {
      '@type': 'Organization',
      name: author,
      url: 'https://bookiscout.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'BookiScout',
      url: 'https://bookiscout.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://bookiscout.com/logo.png',
      },
    },
    image: image || 'https://bookiscout.com/og-image.jpg',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  const placeSchema = destination
    ? {
        '@context': 'https://schema.org',
        '@type': 'TouristDestination',
        name: destination,
        description: `Travel guide for ${destination}, Croatia`,
        url: url,
        touristType: ['Adventure Travelers', 'Beach Lovers', 'Family Travelers'],
        includesAttraction: {
          '@type': 'TouristAttraction',
          name: `Things to do in ${destination}`,
        },
      }
    : null;

  const faqSchema = faq?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }
    : null;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://bookiscout.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Guides',
        item: 'https://bookiscout.com/guides',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: destination || title,
        item: url,
      },
    ],
  };

  // HowTo schema - AI engines love step-by-step guides
  const howToSchema = howToSteps?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: title,
        description: description,
        step: howToSteps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.name,
          text: step.text,
        })),
      }
    : null;

  // ItemList schema - AI engines love ranked lists
  const itemListSchema = topList?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: title,
        description: description,
        itemListElement: topList.map((item) => ({
          '@type': 'ListItem',
          position: item.position,
          name: item.name,
          description: item.description,
        })),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {placeSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }}
        />
      )}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
    </>
  );
}
