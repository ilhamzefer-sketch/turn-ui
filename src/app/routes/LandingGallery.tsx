import { useEffect, useRef, useState } from "react";

import { ArrowIcon } from "../../shared/ui/ArrowIcon";

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
  const pinnedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const rail = railRef.current;
    if (!section || !sticky || !rail || !window.matchMedia || !("ResizeObserver" in window)) return;

    const desktop = window.matchMedia("(min-width: 64rem) and (min-height: 50rem) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    let resizeFrame = 0;
    let travel = 0;
    let top = 0;

    const update = () => {
      frame = 0;
      if (pinnedRef.current) {
        const distance = Math.min(travel, Math.max(0, top - section.getBoundingClientRect().top));
        rail.scrollLeft = distance;
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const measure = () => {
      const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const canPin = desktop.matches && window.innerWidth >= rootSize * 64 && window.innerHeight >= rootSize * 50;
      pinnedRef.current = canPin;
      section.classList.toggle("landing-gallery--pinned", canPin);
      travel = rail.scrollWidth - rail.clientWidth;
      top = Number.parseFloat(getComputedStyle(sticky).top) || 0;
      section.style.height = canPin ? `${sticky.offsetHeight + travel}px` : "";
      schedule();
    };

    const observer = new ResizeObserver(() => {
      if (!resizeFrame) {
        resizeFrame = window.requestAnimationFrame(() => {
          resizeFrame = 0;
          measure();
        });
      }
    });
    observer.observe(sticky);
    observer.observe(rail);
    desktop.addEventListener("change", measure);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    measure();

    return () => {
      observer.disconnect();
      desktop.removeEventListener("change", measure);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(resizeFrame);
      section.classList.remove("landing-gallery--pinned");
      section.style.height = "";
      pinnedRef.current = false;
    };
  }, []);

  const goTo = (index: number) => {
    const rail = railRef.current;
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!rail || !section || !sticky) return;
    const targetIndex = Math.min(scenes.length - 1, Math.max(0, index));
    const cards = rail.querySelectorAll<HTMLElement>(".landing-gallery__card");
    const distance = Math.min(rail.scrollWidth - rail.clientWidth, cards[targetIndex].offsetLeft - cards[0].offsetLeft);
    const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
    if (pinnedRef.current) {
      const top = Number.parseFloat(getComputedStyle(sticky).top) || 0;
      window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top - top + distance, behavior });
    } else {
      rail.scrollTo({ left: distance, behavior });
    }
  };

  const updateActive = () => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = Array.from(rail.querySelectorAll<HTMLElement>(".landing-gallery__card"));
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    let nearest = 0;
    let smallestDistance = Infinity;
    cards.forEach((card, index) => {
      const position = Math.min(maxScroll, card.offsetLeft - cards[0].offsetLeft);
      const distance = Math.abs(position - rail.scrollLeft);
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
