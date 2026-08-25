import { useEffect } from "react";

import {
  DEFAULT_SOCIAL_IMAGE,
  SITE_NAME,
  absoluteSiteUrl,
  isIndexablePublicPath,
} from "./siteMetadata";

type StructuredData = Record<string, unknown>;

type PageMetaOptions = {
  canonicalPath?: string;
  image?: string;
  index?: boolean;
  structuredData?: StructuredData;
  type?: "website" | "article";
};

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.append(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element?.setAttribute(name, value));
}

function updateCanonical(url: string | null) {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!url) {
    existing?.remove();
    return;
  }
  const element = existing ?? document.createElement("link");
  element.rel = "canonical";
  element.href = url;
  if (!existing) document.head.append(element);
}

function updateStructuredData(data?: StructuredData) {
  const existing = document.head.querySelector<HTMLScriptElement>('script[data-page-json-ld="true"]');
  if (!data) {
    existing?.remove();
    return;
  }
  const element = existing ?? document.createElement("script");
  element.type = "application/ld+json";
  element.dataset.pageJsonLd = "true";
  element.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
  if (!existing) document.head.append(element);
}

export function usePageMeta(title: string, description: string, options: PageMetaOptions = {}) {
  useEffect(() => {
    const pathname = window.location.pathname;
    const indexable = options.index ?? isIndexablePublicPath(pathname);
    const canonicalUrl = indexable ? absoluteSiteUrl(options.canonicalPath ?? pathname) : null;
    const socialImage = options.image ?? DEFAULT_SOCIAL_IMAGE;
    const robots = indexable
      ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      : "noindex, nofollow";

    document.title = title;
    document.documentElement.lang = "az";
    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: robots });
    upsertMeta('meta[name="googlebot"]', { name: "googlebot", content: robots });
    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: "az_AZ" });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: options.type ?? "website" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: socialImage });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: socialImage });

    if (canonicalUrl) {
      upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    } else {
      document.head.querySelector('meta[property="og:url"]')?.remove();
    }
    updateCanonical(canonicalUrl);
    updateStructuredData(options.structuredData);
  }, [description, options.canonicalPath, options.image, options.index, options.structuredData, options.type, title]);
}
