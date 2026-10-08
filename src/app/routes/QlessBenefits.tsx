import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

import { ArrowIcon } from "../../shared/ui/ArrowIcon";

const benefits = [
  {
    eyebrow: "Canlı növbə",
    title: "Gözləmək yerinə gününüzü yaşayın.",
    text: "Növbənizi uzaqdan götürün. Vaxtınızı özünüzə ayırın.",
    checks: ["Telefondan və ya QR ilə növbəyə qoşulun", "Növbədəki yerinizi və təxmini gözləməni görün", "Canlı növbəyə qeydiyyatsız başlayın"],
    image: "phone",
    alt: "Telefon üzərində illüstrativ canlı növbə görünüşü",
  },
  {
    eyebrow: "Planlı rezervasiya",
    title: "Qəbul vaxtı sizə uyğun olsun.",
    text: "Gününüzü qəbul saatına görə deyil, qəbulunuzu gününüzə görə planlayın.",
    checks: ["Otağın mövcud boş saatlarına baxın", "Uyğun vaxtı seçib rezervasiya edin", "Qəbullarınızı şəxsi hesabınızdan izləyin"],
    image: "phone",
    alt: "Telefon üzərində illüstrativ şəxsi qəbul görünüşü",
  },
  {
    eyebrow: "Biznes üçün",
    title: "Hər otaq bir baxışda.",
    text: "Qəbul axını aydın olanda diqqətiniz müştərinizdə qalır.",
    checks: ["Canlı növbə və ya planlı qəbul rejimini qurun", "Otağın iş qrafikini idarə edin", "QR kodunuzu paylaşaraq qoşulmağı asanlaşdırın"],
    image: "workspace",
    alt: "Kompüter üzərində illüstrativ otaq idarəetmə görünüşü",
  },
  {
    eyebrow: "Komanda və filiallar",
    title: "Komandanız vahid axında.",
    text: "Filiallar, otaqlar və müştəri qəbulu eyni iş sahəsində.",
    checks: ["Filialları və otaqları bir strukturda görün", "Komandanızın rol və səlahiyyətlərini təyin edin", "Əməliyyatları və hesabatları izləyin"],
    image: "workspace",
    alt: "Kompüter üzərində illüstrativ biznes iş sahəsi",
  },
] as const;

type BenefitsMode = "static" | "manual" | "pinned";

export function QlessBenefits() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const [mode, setMode] = useState<BenefitsMode>("static");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add({
      motion: "(prefers-reduced-motion: no-preference)",
      desktop: "(min-width: 64rem) and (min-height: 40rem)",
    }, (mediaContext) => {
      setMode(!mediaContext.conditions?.motion ? "static" : mediaContext.conditions.desktop ? "pinned" : "manual");
      return () => setMode("static");
    });
    return () => media.revert();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (mode !== "pinned" || !section || !sticky) return;

    // Font metrics and the committed single-slide layout must settle before pinning.
    let cancelled = false;
    let frame = 0;
    let context: gsap.Context | undefined;
    const initialize = () => {
      if (cancelled) return;
      section.classList.add("qless-benefits--pinned");
      context = gsap.context(() => {
      const slides = Array.from(sticky.querySelectorAll<HTMLElement>(".qless-benefits__slide"));
      gsap.set(slides, { autoAlpha: 0 });
      gsap.set(slides[0], { autoAlpha: 1 });
      const timeline = gsap.timeline({
        scrollTrigger: {
          id: "qless-benefits-scroll",
          trigger: section,
          pin: sticky,
          start: "top top",
          end: () => `+=${window.innerHeight * (benefits.length - 1)}`,
          scrub: 0.85,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onRefresh: ({ progress }) => {
            setActiveIndex(Math.min(benefits.length - 1, Math.floor(progress * (benefits.length - 1) + 0.24)));
            section.style.setProperty("--benefits-progress", String(progress));
          },
        },
      });
      for (let index = 1; index < slides.length; index += 1) {
        const previous = slides[index - 1];
        const next = slides[index];
        const start = index - 0.48;
        gsap.set(next.querySelector(".qless-benefits__copy"), { y: 46, autoAlpha: 0 });
        gsap.set(next.querySelector(".qless-benefits__visual"), { x: 75, y: 30, scale: 0.9, rotation: 5, autoAlpha: 0 });
        timeline
          .set(next, { autoAlpha: 1 }, start)
          .to(previous.querySelector(".qless-benefits__copy"), { y: -34, autoAlpha: 0, duration: 0.2, ease: "power2.in" }, start)
          .to(previous.querySelector(".qless-benefits__visual"), { x: -55, y: -20, scale: 0.92, rotation: -4, autoAlpha: 0, duration: 0.48, ease: "power2.inOut" }, start)
          .to(next.querySelector(".qless-benefits__copy"), { y: 0, autoAlpha: 1, duration: 0.26, ease: "power2.out" }, start + 0.22)
          .to(next.querySelector(".qless-benefits__visual"), { x: 0, y: 0, scale: 1, rotation: 0, autoAlpha: 1, duration: 0.48, ease: "power2.out" }, start)
          .set(previous, { autoAlpha: 0 }, index);
      }
      const updateScene = () => {
        const progress = timeline.progress();
        setActiveIndex(Math.min(benefits.length - 1, Math.floor(progress * (benefits.length - 1) + 0.24)));
        section.style.setProperty("--benefits-progress", String(progress));
      };
      timeline.eventCallback("onUpdate", updateScene);
      updateScene();
      triggerRef.current = timeline.scrollTrigger ?? null;
      }, section);
      ScrollTrigger.refresh();
    };
    void (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (!cancelled) frame = window.requestAnimationFrame(initialize);
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      context?.revert();
      triggerRef.current = null;
      section.classList.remove("qless-benefits--pinned");
      section.style.removeProperty("--benefits-progress");
    };
  }, [mode]);

  const goTo = (index: number) => {
    const next = Math.min(benefits.length - 1, Math.max(0, index));
    const trigger = triggerRef.current;
    if (mode === "pinned" && trigger) {
      window.scrollTo({
        top: trigger.start + (trigger.end - trigger.start) * next / (benefits.length - 1),
        behavior: "smooth",
      });
      return;
    }
    setActiveIndex(next);
  };

  return (
    <section className="qless-benefits" id="product-benefits" aria-label="NövbəTime ilə daha rahat qəbul" ref={sectionRef} data-mode={mode}>
      <div className="qless-benefits__sticky shell" ref={stickyRef}>
        <div className="qless-benefits__slides" role={mode === "static" ? undefined : "region"} aria-label="Platformanın imkanları" tabIndex={mode === "static" ? undefined : 0}
          onKeyDown={(event) => {
            if (mode === "static" || event.target !== event.currentTarget) return;
            const next = { ArrowRight: activeIndex + 1, ArrowLeft: activeIndex - 1, Home: 0, End: benefits.length - 1 }[event.key];
            if (next === undefined) return;
            event.preventDefault();
            goTo(next);
          }}>
          {benefits.map((benefit, index) => (
            <article className="qless-benefits__slide" key={benefit.eyebrow} hidden={mode === "manual" && activeIndex !== index} aria-hidden={mode !== "static" && activeIndex !== index} data-active={activeIndex === index}>
              <div className="qless-benefits__copy">
                <p className="eyebrow">{benefit.eyebrow}</p>
                <h2>{benefit.title}</h2>
                <p>{benefit.text}</p>
                <ul className="qless-benefits__checks">{benefit.checks.map((check) => <li key={check}><span aria-hidden="true">✓</span>{check}</li>)}</ul>
              </div>
              <figure className="qless-benefits__visual">
                <img src={`/landing/qless/${benefit.image}.webp`} width="1000" height={benefit.image === "workspace" ? 750 : 1000} loading="lazy" decoding="async" alt={benefit.alt} />
                <figcaption>İllüstrativ məhsul görünüşü</figcaption>
              </figure>
            </article>
          ))}
        </div>
        {mode !== "static" ? <div className="qless-benefits__footer">
          <div className="qless-benefits__chapters" aria-label="İmkan seçimi">
            {benefits.map((benefit, index) => <button type="button" key={benefit.eyebrow} aria-current={activeIndex === index ? "step" : undefined} onClick={() => goTo(index)}><span>0{index + 1}</span>{benefit.eyebrow}</button>)}
          </div>
          <div className="qless-benefits__progress" aria-hidden="true"><span style={mode === "manual" ? { transform: `scaleX(${(activeIndex + 1) / benefits.length})` } : undefined} /></div>
          {mode === "pinned" ? <p className="qless-benefits__hint">İmkanları görmək üçün sürüşdürün <span aria-hidden="true">↓</span></p> : null}
          <span className="qless-benefits__count" aria-live={mode === "manual" ? "polite" : "off"}>0{activeIndex + 1} <span>/ 04</span></span>
          <div className="qless-benefits__controls" aria-label="İmkanlar arasında keçid">
            <button type="button" aria-label="Əvvəlki imkan" disabled={activeIndex === 0} onClick={() => goTo(activeIndex - 1)}><ArrowIcon direction="left" /></button>
            <button type="button" aria-label="Növbəti imkan" disabled={activeIndex === benefits.length - 1} onClick={() => goTo(activeIndex + 1)}><ArrowIcon /></button>
          </div>
        </div> : null}
      </div>
    </section>
  );
}
