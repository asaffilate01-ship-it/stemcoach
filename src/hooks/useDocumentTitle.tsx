import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE = "https://stemcoach.app";

/**
 * Sets a unique document title per route and keeps the canonical URL,
 * og:url and og:title in sync so shared/crawled deep links are correct.
 */
export function useDocumentTitle(title: string, description?: string) {
  const location = useLocation();

  useEffect(() => {
    const prev = document.title;
    const base = (title || "").replace(/\s*[|—-]\s*STEMCoach\s*$/i, "").trim();
    const fullTitle = base ? `${base} | STEMCoach` : "STEMCoach — Virtual Tuition Centre";
    document.title = fullTitle;

    const setMeta = (selector: string, attr: string, value: string) => {
      const el = document.querySelector<HTMLMetaElement>(selector);
      if (el) el.setAttribute(attr, value);
    };

    const canonicalHref = `${SITE}${location.pathname === "/" ? "/" : location.pathname}`;
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    const prevCanonical = link.href;
    link.href = canonicalHref;

    setMeta('meta[property="og:url"]', "content", canonicalHref);
    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:title"]', "content", fullTitle);

    if (description) {
      setMeta('meta[name="description"]', "content", description);
      setMeta('meta[property="og:description"]', "content", description);
      setMeta('meta[name="twitter:description"]', "content", description);
    }

    return () => {
      document.title = prev;
      if (link) link.href = prevCanonical;
    };
  }, [title, description, location.pathname]);
}
