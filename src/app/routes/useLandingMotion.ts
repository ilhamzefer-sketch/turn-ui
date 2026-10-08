import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

const GALLERY_OWNED = ".landing-gallery, .landing-gallery__sticky, .landing-gallery__track, .qless-benefits";

/** Scroll owns this motion; all content remains readable before JavaScript runs. */
export function useLandingMotion(pageRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const page = pageRef.current;
    if (!page || typeof window.matchMedia !== "function") return;

    gsap.registerPlugin(ScrollTrigger);
    let active = true;
    let refreshFrame = 0;
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add({
        motion: "(prefers-reduced-motion: no-preference)",
        desktop: "(min-width: 64rem)",
      }, (mediaContext) => {
        if (!mediaContext.conditions?.motion) return;

        const desktop = Boolean(mediaContext.conditions.desktop);
        const entranceDistance = desktop ? 22 : 6;
        const driftDistance = desktop ? 14 : 6;
        page.classList.add("landing-page--scroll-motion");

        const sections = Array.from(page.children).filter(
          (element): element is HTMLElement => element instanceof HTMLElement && element.tagName === "SECTION",
        );

        for (const section of sections) {
          // The gallery already has its own pinned horizontal ScrollTrigger.
          if (section.matches(GALLERY_OWNED)) continue;
          const hero = section.classList.contains("qless-hero");
          const candidates = Array.from(section.querySelectorAll<HTMLElement>("[data-reveal], [data-motion-heading], h1, h2"));
          if (section.hasAttribute("data-reveal")) {
            candidates.push(...Array.from(section.children).filter((element): element is HTMLElement => element instanceof HTMLElement));
          }

          // Animate one layer per content group, preserving nested layout and hover effects.
          const targets = [...new Set(candidates)].filter((target) =>
            !target.closest(GALLERY_OWNED)
            && !target.hasAttribute("data-parallax")
            && !target.hasAttribute("data-scroll-progress")
            && !target.hasAttribute("data-hero-float")
            && !candidates.some((ancestor) => ancestor !== target && ancestor.contains(target)),
          );

          for (const target of targets) {
            const bounds = target.getBoundingClientRect();
            const visibleInitially = bounds.bottom > 0 && bounds.top < window.innerHeight;
            if (hero || visibleInitially) {
              // No fade or entrance offset for content already on screen.
              gsap.fromTo(target, { y: 0 }, {
                y: -driftDistance,
                ease: "none",
                immediateRender: false,
                scrollTrigger: {
                  trigger: section,
                  start: "top top",
                  end: "bottom top",
                  scrub: 0.5,
                  invalidateOnRefresh: true,
                },
              });
            } else {
              gsap.fromTo(target, { y: entranceDistance, opacity: 0.86 }, {
                y: 0,
                opacity: 1,
                ease: "none",
                immediateRender: false,
                scrollTrigger: {
                  trigger: target,
                  start: "top 96%",
                  end: "top 67%",
                  scrub: 0.45,
                  invalidateOnRefresh: true,
                },
              });
            }
          }

          for (const card of section.querySelectorAll<HTMLElement>("[data-hero-float]")) {
            const index = Math.min(4, Math.max(1, Number(card.dataset.heroFloat) || 1));
            const direction = index % 2 === 0 ? -1 : 1;
            const baseRotation = Number(gsap.getProperty(card, "rotation")) || 0;
            gsap.fromTo(card, { y: 0, rotation: baseRotation }, {
              y: (desktop ? 28 + index * 8 : 4 + index * 2) * direction,
              rotation: baseRotation + direction * (desktop ? 4 : 1),
              ease: "none",
              immediateRender: false,
              scrollTrigger: {
                trigger: section,
                start: "top top",
                end: "bottom top",
                scrub: 0.65,
                invalidateOnRefresh: true,
              },
            });
          }

          for (const visual of section.querySelectorAll<HTMLElement>("[data-parallax]")) {
            if (visual.closest(GALLERY_OWNED) || visual.hasAttribute("data-hero-float")) continue;
            const visualDistance = visual.dataset.parallax === "layer"
              ? desktop ? 30 : 8
              : driftDistance;
            // Secondary product layers have more depth; each mobile layer stays below 12px.
            gsap.fromTo(visual, { y: 0 }, {
              y: -visualDistance,
              ease: "none",
              immediateRender: false,
              scrollTrigger: {
                trigger: section,
                start: hero ? "top top" : "top bottom",
                end: "bottom top",
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            });
          }

          for (const progress of section.querySelectorAll<HTMLElement>("[data-scroll-progress]")) {
            if (progress.closest(GALLERY_OWNED)) continue;
            // Mark decorative progress strokes only, never a text or interactive wrapper.
            gsap.fromTo(progress, { scaleX: 0, transformOrigin: "left center" }, {
              scaleX: 1,
              ease: "none",
              immediateRender: false,
              scrollTrigger: {
                trigger: section,
                start: "top 70%",
                end: "bottom 60%",
                scrub: 0.5,
                invalidateOnRefresh: true,
              },
            });
          }
        }

        return () => page.classList.remove("landing-page--scroll-motion");
      });
    }, page);

    const refresh = () => {
      window.cancelAnimationFrame(refreshFrame);
      refreshFrame = window.requestAnimationFrame(() => {
        if (active) ScrollTrigger.refresh();
      });
    };
    page.addEventListener("load", refresh, true);
    void document.fonts?.ready.then(() => { if (active) refresh(); });
    refresh();

    return () => {
      active = false;
      window.cancelAnimationFrame(refreshFrame);
      page.removeEventListener("load", refresh, true);
      media.revert();
      context.revert();
      page.classList.remove("landing-page--scroll-motion");
    };
  }, [pageRef]);
}
