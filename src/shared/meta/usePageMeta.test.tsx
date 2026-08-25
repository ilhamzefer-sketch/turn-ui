import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { usePageMeta } from "./usePageMeta";

function MetaProbe({ index, structuredData }: { index?: boolean; structuredData?: Record<string, unknown> }) {
  usePageMeta("Onlayn növbə | NövbəTime", "Canlı növbə və rezervasiya.", {
    canonicalPath: "/rooms",
    index,
    structuredData,
  });
  return null;
}

describe("usePageMeta", () => {
  beforeEach(() => {
    document.head.innerHTML = "<title>NövbəTime</title>";
    window.history.replaceState({}, "", "/rooms");
  });

  it("publishes indexable metadata and structured data for public pages", async () => {
    render(<MetaProbe structuredData={{ "@context": "https://schema.org", "@type": "WebSite" }} />);

    await waitFor(() => {
      expect(document.title).toBe("Onlayn növbə | NövbəTime");
      expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute("href", "https://novbetime.az/rooms");
      expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", expect.stringContaining("index, follow"));
      expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute("content", "https://novbetime.az/rooms");
      expect(document.querySelector('script[data-page-json-ld="true"]')?.textContent).toContain('"@type":"WebSite"');
    });
  });

  it("removes canonical data and blocks indexing for private pages", async () => {
    render(<MetaProbe index={false} />);

    await waitFor(() => {
      expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
      expect(document.querySelector('link[rel="canonical"]')).not.toBeInTheDocument();
      expect(document.querySelector('meta[property="og:url"]')).not.toBeInTheDocument();
    });
  });
});
