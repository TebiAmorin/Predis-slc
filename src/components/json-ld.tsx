export function EventJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: "BLAST R6 Major Salt Lake City 2026",
    description:
      "Major de Rainbow Six Siege organizado por BLAST en Salt Lake City, Utah. 20 equipos compiten por el título mundial.",
    startDate: "2026-05-11",
    endDate: "2026-05-24",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
    location: {
      "@type": "Place",
      name: "Salt Lake City",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Salt Lake City",
        addressRegion: "UT",
        addressCountry: "US",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "BLAST",
      url: "https://blast.tv",
    },
    sport: "Rainbow Six Siege",
    url: "https://predicciones.tebimedia.com",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function WebsiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Predicciones R6 Major SLC 2026",
    url: "https://predicciones.tebimedia.com",
    description:
      "Plataforma de predicciones para el BLAST R6 Major Salt Lake City 2026 de Rainbow Six Siege.",
    publisher: {
      "@type": "Organization",
      name: "Tebimedia",
      url: "https://x.com/TebiiR6",
    },
    inLanguage: "es",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
