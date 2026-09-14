import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

import { ArrowIcon } from "../../shared/ui/ArrowIcon";

if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  gsap.registerPlugin(ScrollTrigger);
}

const scenes = [
  { image: "clinic", title: "Klinika və tibbi qəbul", text: "Qəbul vaxtı aydın olsun, diqqət pasiyentdə qalsın.", alt: "Klinika qəbulunda pasiyenti qarşılayan əməkdaş" },
  { image: "salon", title: "Gözəllik və şəxsi qulluq", text: "Müştəri öz saatını seçsin, siz işinizə fokuslanın.", alt: "Əvvəlcədən planlaşdırılmış qəbulda müştəriyə xidmət edən bərbər" },
  { image: "service", title: "Xidmət və qəbul mərkəzləri", text: "QR ilə qoşulun, növbənin gedişini telefondan izləyin.", alt: "Xidmət mərkəzində telefonunu QR lövhəsinə yaxınlaşdıran müştəri" },
  { image: "specialist", title: "Fərdi mütəxəssislər", text: "Bir otaq, aydın iş qrafiki, rahat müştəri qəbulu.", alt: "Öz iş otağında müştəri ilə görüşən fərdi mütəxəssis" },
] as const;

export function LandingGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(false);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const rail = railRef.current;
    const track = trackRef.current;
    if (!section || !sticky || !rail || !track || typeof window.matchMedia !== "function") return;

    let media: ReturnType<typeof gsap.matchMedia> | null = null;
    const context = gsap.context(() => {
      media = gsap.matchMedia();
      media.add("(min-width: 64rem) and (prefers-reduced-motion: no-preference)", () => {
        section.classList.add("landing-gallery--pinned");
        pinnedRef.current = true;
        const cards = gsap.utils.toArray<HTMLElement>(".landing-gallery__card", track);
        const firstOffset = cards[0]?.offsetLeft ?? 0;
        const getDistance = () => Math.max(0, track.scrollWidth - rail.clientWidth);
        const updateActiveFromDistance = (distance: number) => {
          const maxDistance = getDistance();
          const current = Math.min(maxDistance, Math.max(0, distance));
          let nearest = 0;
          let smallestDistance = Infinity;
          cards.forEach((card, index) => {
            const position = Math.min(maxDistance, card.offsetLeft - firstOffset);
            const difference = Math.abs(position - current);
            if (difference < smallestDistance) {
              smallestDistance = difference;
              nearest = index;
            }
          });
          setActiveIndex((previous) => previous === nearest ? previous : nearest);
        };

        gsap.to(track, {
          x: () => -getDistance(),
          ease: "none",
          scrollTrigger: {
            id: "landing-gallery-horizontal",
            trigger: section,
            pin: sticky,
            start: "top top",
            end: () => `+=${getDistance()}`,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => updateActiveFromDistance(getDistance() * self.progress),
            onRefresh: (self) => updateActiveFromDistance(getDistance() * self.progress),
          },
        });
        triggerRef.current = ScrollTrigger.getById("landing-gallery-horizontal") ?? null;
        updateActiveFromDistance(0);

        return () => {
          triggerRef.current = null;
          pinnedRef.current = false;
          section.classList.remove("landing-gallery--pinned");
          gsap.set(track, { clearProps: "transform" });
        };
      });
    }, section);

    return () => {
      media?.revert();
      context.revert();
      triggerRef.current = null;
      pinnedRef.current = false;
    };
  }, []);

  const goTo = (index: number) => {
    const rail = railRef.current;
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const track = trackRef.current;
    if (!rail || !section || !sticky || !track) return;
    const targetIndex = Math.min(scenes.length - 1, Math.max(0, index));
    const cards = track.querySelectorAll<HTMLElement>(".landing-gallery__card");
    const firstOffset = cards[0]?.offsetLeft ?? 0;
    const distance = Math.min(Math.max(0, track.scrollWidth - rail.clientWidth), Math.max(0, (cards[targetIndex]?.offsetLeft ?? firstOffset) - firstOffset));
    const behavior: ScrollBehavior = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
    if (pinnedRef.current) {
      const trigger = triggerRef.current ?? ScrollTrigger.getById("landing-gallery-horizontal");
      const top = Number.parseFloat(getComputedStyle(sticky).top) || 0;
      const start = trigger?.start ?? window.scrollY + section.getBoundingClientRect().top - top;
      window.scrollTo({ top: start + distance, behavior });
    } else {
      rail.scrollTo({ left: distance, behavior });
    }
  };

  const updateActive = () => {
    const rail = railRef.current;
    const track = trackRef.current;
    if (!rail || !track) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>(".landing-gallery__card"));
    const firstOffset = cards[0]?.offsetLeft ?? 0;
    const maxScroll = Math.max(0, track.scrollWidth - rail.clientWidth);
    let nearest = 0;
    let smallestDistance = Infinity;
    cards.forEach((card, index) => {
      const position = Math.min(maxScroll, card.offsetLeft - firstOffset);
      const distance = Math.abs(position - Math.min(maxScroll, Math.max(0, rail.scrollLeft)));
      if (distance < smallestDistance) {
        smallestDistance = distance;
        nearest = index;
      }
    });
    setActiveIndex(nearest);
  };

  return (
    <section className="landing-gallery" id="suitable-businesses" aria-labelledby="sectors-title" ref={sectionRef}>
      <div className="landing-gallery__sticky" ref={stickyRef}>
        <div className="shell landing-gallery__heading">
          <div>
            <p className="eyebrow">Kimlər üçün</p>
            <h2 id="sectors-title">Hər qəbulun öz ritmi var.</h2>
            <p>Klinikadan fərdi mütəxəssisə — növbə və rezervasiya bir platformada.</p>
          </div>
          <a className="landing-gallery__skip" href="#landing-faq">Qalereyadan sonra davam et <span aria-hidden="true">↓</span></a>
        </div>

        <div
          className="landing-gallery__rail"
          id="service-gallery"
          ref={railRef}
          role="region"
          aria-label="Xidmət sahələri qalereyası"
          tabIndex={0}
          onScroll={updateActive}
          onKeyDown={(event) => {
            const target = { ArrowRight: activeIndex + 1, ArrowLeft: activeIndex - 1, Home: 0, End: scenes.length - 1 }[event.key];
            if (target !== undefined) {
              event.preventDefault();
              goTo(target);
            }
          }}
        >
          <div className="landing-gallery__track" ref={trackRef}>
            {scenes.map((scene, index) => (
              <figure className="landing-gallery__card" key={scene.image}>
                <img
                  src={`/landing/gallery-${scene.image}.webp`}
                  srcSet={`/landing/gallery-${scene.image}-768.webp 768w, /landing/gallery-${scene.image}.webp 1536w`}
                  sizes="(min-width: 64rem) 66vw, 88vw"
                  width="1536"
                  height="1024"
                  loading="lazy"
                  decoding="async"
                  alt={scene.alt}
                />
                <figcaption>
                  <span aria-hidden="true">0{index + 1}</span>
                  <div><h3>{scene.title}</h3><p>{scene.text}</p></div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="shell landing-gallery__footer">
          <p className="landing-gallery__note">İllüstrativ xidmət ssenariləri</p>
          <div className="landing-gallery__controls" aria-label="Qalereya idarəsi">
            <span className="landing-gallery__count" aria-live="off">0{activeIndex + 1} <span>/ 04</span></span>
            <button type="button" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Əvvəlki şəkil" aria-controls="service-gallery"><ArrowIcon direction="left" /></button>
            <button type="button" onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === scenes.length - 1} aria-label="Növbəti şəkil" aria-controls="service-gallery"><ArrowIcon /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
