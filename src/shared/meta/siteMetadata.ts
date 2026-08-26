export const SITE_NAME = "NövbəTime";
export const SITE_URL = "https://novbetime.az";
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/landing/hero-queue-studio.jpg`;

export function absoluteSiteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function isIndexablePublicPath(pathname: string) {
  return pathname === "/" || pathname === "/rooms" || /^\/rooms\/\d+$/.test(pathname);
}

export const homeStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/web-app-manifest-512x512.png`,
        width: 512,
        height: 512,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      inLanguage: "az",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#application`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "az",
      description: "Azərbaycanda bizneslər və müştərilər üçün canlı növbə və onlayn rezervasiya platforması.",
      publisher: { "@id": `${SITE_URL}/#organization` },
      featureList: [
        "Canlı növbəyə uzaqdan qoşulma",
        "Onlayn qəbul və rezervasiya",
        "QR kodla növbəyə qoşulma",
        "Filial, otaq və iş qrafiki idarəetməsi",
      ],
    },
  ],
} as const;
