import { useEffect, useRef } from "react";

import { RoomSearchForm } from "../../features/discovery/RoomSearchForm";
import { useAuth } from "../../shared/auth/useAuth";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { ArrowIcon } from "../../shared/ui/ArrowIcon";
import { ButtonLink } from "../../shared/ui/Button";

const customerSteps = [
  { number: "01", title: "Otağı tapın", text: "Biznesi, filialı və ya mütəxəssisi axtarın." },
  { number: "02", title: "Axını seçin", text: "Canlı növbəyə qoşulun və ya boş saatı rezervasiya edin." },
  { number: "03", title: "Vaxtınız çatanda gəlin", text: "Vəziyyəti telefondan izləyin və gözləməni azaldın." },
] as const;

const businessCapabilities = [
  "Filial və otaqları bir strukturda qurun",
  "Otaq sahiblərini və iş qrafikini idarə edin",
  "Canlı əməliyyatları və nəticələri izləyin",
] as const;

export function LandingPage() {
  const { status } = useAuth();
  const pageRef = useRef<HTMLDivElement>(null);
  const hasAccountSession = status === "authenticated" || status === "checking" || status === "idle";
  const accountTarget = hasAccountSession ? "/app" : "/register";
  const accountLabel = status === "authenticated"
    ? "İş sahəsinə keçin"
    : hasAccountSession
      ? "Hesab açılır…"
      : "Pulsuz hesab yaradın";

  usePageMeta(
    "E-Növbə — Vaxtınızı növbədə yox, həyatınızda keçirin",
    "Canlı növbəyə uzaqdan qoşulun və ya uyğun saatı əvvəlcədən rezervasiya edin.",
  );

  useEffect(() => {
    const page = pageRef.current;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!page || prefersReducedMotion) return;

    const items = Array.from(page.querySelectorAll<HTMLElement>("[data-reveal]"));
    page.classList.add("landing-page--motion-ready");

    if (CSS.supports?.("animation-timeline: view()")) {
      page.classList.add("landing-page--scroll-motion");
      return () => {
        page.classList.remove("landing-page--motion-ready", "landing-page--scroll-motion");
      };
    }

    if (!("IntersectionObserver" in window)) {
      page.classList.remove("landing-page--motion-ready");
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      }
    }, { rootMargin: "-8% 0px -10%", threshold: 0.12 });

    items.forEach((item) => observer.observe(item));
    return () => {
      observer.disconnect();
      page.classList.remove("landing-page--motion-ready");
    };
  }, []);

  return (
    <div className="landing-page" ref={pageRef}>
      <section className="landing-hero" aria-labelledby="hero-title">
        <div className="shell landing-hero__grid">
          <div className="landing-hero__copy" data-reveal>
            <p className="eyebrow">Vaxtınızı geri qazanın</p>
            <h1 id="hero-title">Növbəni deyil, gününüzü planlayın.</h1>
            <p className="landing-hero__lede">
              Canlı növbəyə uzaqdan qoşulun və ya uyğun saatı əvvəlcədən rezervasiya edin.
              Harada olduğunuzu yox, növbənizin harada olduğunu izləyin.
            </p>
            <RoomSearchForm compact />
            <div className="landing-hero__trust" aria-label="Platformanın əsas imkanları">
              <span><i aria-hidden="true" /> Qeydiyyatsız canlı növbə</span>
              <span><i aria-hidden="true" /> Telefonla vahid hesab</span>
            </div>
          </div>

          <div className="landing-hero__media" data-reveal>
            <img
              src="/landing/hero-queue-studio.jpg"
              width="1672"
              height="941"
              alt="Müasir qəbul məkanında telefondan idarə olunan rəqəmsal növbə"
              fetchPriority="high"
            />
            <div className="live-status-card" aria-label="Canlı növbə nümunəsi">
              <div className="live-status-card__header">
                <span className="live-status-card__pulse" aria-hidden="true" />
                <span>Canlı növbə</span>
                <strong>A-15</strong>
              </div>
              <div className="live-status-card__progress" aria-hidden="true"><span /></div>
              <div className="live-status-card__footer">
                <span>Sizdən əvvəl</span>
                <strong>1 nəfər · təxminən 18 dəq.</strong>
              </div>
            </div>
            <p className="landing-hero__caption"><span>01</span> Gözləmə artıq görünür</p>
          </div>
        </div>
        <a className="landing-scroll-cue" href="#how-it-works" aria-label="Necə işlədiyini görmək üçün aşağı keçin">
          <span aria-hidden="true" /> Necə işləyir
        </a>
      </section>

      <section className="landing-proof" aria-label="E-Növbənin əsas üstünlükləri">
        <div className="shell landing-proof__grid" data-reveal>
          <p><strong>2 növbə modeli</strong><span>Canlı və planlı axın</span></p>
          <p><strong>1 telefon nömrəsi</strong><span>Bütün rollar üçün vahid hesab</span></p>
          <p><strong>Real vaxt</strong><span>Növbə və boş saat məlumatı</span></p>
          <p><strong>QR ilə giriş</strong><span>Parol tələb etmədən sürətli qoşulma</span></p>
        </div>
      </section>

      <section className="landing-journey shell" id="how-it-works" aria-labelledby="journey-title">
        <div className="landing-section-heading" data-reveal>
          <p className="eyebrow">Müştəri üçün</p>
          <h2 id="journey-title">Qapıda gözləmək əvəzinə, vaxtınız çatanda gəlin.</h2>
          <p>İstər QR kodla, istər uzaqdan — üç sadə addımda növbənizi götürün.</p>
        </div>

        <div className="landing-journey__layout">
          <figure className="landing-image-card landing-image-card--qr" data-reveal>
            <img
              src="/landing/qr-live-queue.jpg"
              width="1536"
              height="1024"
              loading="lazy"
              decoding="async"
              alt="Telefonla girişdəki QR işarəsinə yaxınlaşaraq canlı növbəyə qoşulma"
            />
            <figcaption>QR kodu oxudun. Ad və nömrənizi yazın. Növbənizi izləyin.</figcaption>
          </figure>

          <ol className="landing-steps" aria-label="Növbə götürməyin addımları">
            {customerSteps.map((step) => (
              <li key={step.number} data-reveal>
                <span>{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.text}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing-modes" aria-labelledby="modes-title">
        <div className="shell">
          <div className="landing-section-heading landing-section-heading--center" data-reveal>
            <p className="eyebrow">Bir sistem, iki axın</p>
            <h2 id="modes-title">Günün ritminə uyğun seçim edin.</h2>
          </div>

          <div className="landing-modes__grid">
            <article className="landing-mode-card landing-mode-card--live" data-reveal>
              <div className="landing-mode-card__topline"><span>01</span><i aria-hidden="true" /></div>
              <h3>Canlı növbə</h3>
              <p>İnsanlar ardıcıllıqla qoşulur, otaq sahibi növbəni real vaxtda irəli aparır.</p>
              <div className="landing-mode-card__queue" aria-hidden="true">
                <span>A-14</span><span className="is-current">A-15 · Siz</span><span>A-16</span>
              </div>
            </article>

            <article className="landing-mode-card landing-mode-card--planned" data-reveal>
              <div className="landing-mode-card__topline"><span>02</span><i aria-hidden="true" /></div>
              <h3>Planlı rezervasiya</h3>
              <p>Real iş qrafikindən yaranan boş vaxtlardan birini seçin və gününüzü əvvəlcədən planlayın.</p>
              <div className="landing-mode-card__slots" aria-label="Nümunə boş saatlar">
                <span>09:30</span><span className="is-selected">10:00</span><span>10:30</span><span>11:00</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-business" id="for-business" aria-labelledby="business-title">
        <div className="shell landing-business__grid">
          <div className="landing-business__copy" data-reveal>
            <p className="eyebrow eyebrow--light">Biznes və mütəxəssislər üçün</p>
            <h2 id="business-title">Filialdan otağa qədər bütün axını bir yerdə idarə edin.</h2>
            <p>
              İşçiləri, otaqları, iş saatlarını və növbə nəticələrini eyni sistemdə görün.
              Hər otaq öz rejimi ilə işləsin, biznes isə ümumi mənzərəni itirməsin.
            </p>
            <ul>
              {businessCapabilities.map((capability) => <li key={capability}>{capability}</li>)}
            </ul>
            <ButtonLink to={accountTarget} variant="secondary">
              {accountLabel}<ArrowIcon />
            </ButtonLink>
          </div>

          <div className="landing-business__media" data-reveal>
            <img
              src="/landing/multi-room-operations.jpg"
              width="1536"
              height="1024"
              loading="lazy"
              decoding="async"
              alt="Bir neçə növbə otağı olan məkanda gündəlik iş axınının idarə edilməsi"
            />
            <div className="business-insight-card">
              <span>Bugünkü əməliyyat</span>
              <strong>3 otaq aktivdir</strong>
              <div aria-hidden="true"><i /><i /><i /><i /><i /></div>
              <small>Günün gedişi bir baxışda</small>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-closing shell" aria-labelledby="closing-title" data-reveal>
        <div>
          <p className="eyebrow">Başlamaq üçün</p>
          <h2 id="closing-title">Bir telefon nömrəsi.<br />Bütün növbələriniz.</h2>
        </div>
        <div className="landing-closing__action">
          <p>Müştəri, fərdi mütəxəssis və biznes rolları eyni hesabda işləyir.</p>
          <ButtonLink to={accountTarget}>{accountLabel}<ArrowIcon /></ButtonLink>
        </div>
      </section>
    </div>
  );
}
