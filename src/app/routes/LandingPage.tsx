import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../shared/auth/useAuth";
import { homeStructuredData } from "../../shared/meta/siteMetadata";
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

const suitableBusinesses = [
  { title: "Klinika və tibbi qəbul", text: "Pasiyent axınını canlı növbə və əvvəlcədən təyin olunan qəbul saatları ilə idarə edin." },
  { title: "Gözəllik və şəxsi qulluq", text: "Salon, bərbər və ustalar üçün boş saatları göstərib onlayn rezervasiya qəbul edin." },
  { title: "Xidmət və qəbul mərkəzləri", text: "Müştərilərin qapıda gözləməsini azaldın, növbənin gedişini real vaxtda göstərin." },
  { title: "Fərdi mütəxəssislər", text: "Bir otaqdan başlayın, iş qrafikinizi və müştəri qəbulunuzu vahid səhifədə paylaşın." },
] as const;

const frequentlyAskedQuestions = [
  {
    question: "Onlayn növbə sistemi necə işləyir?",
    answer: "Müştəri uyğun otağı tapır, canlı növbəyə uzaqdan qoşulur və növbədəki yerini telefondan izləyir. Vaxtı yaxınlaşanda məkana gəlir.",
  },
  {
    question: "Canlı növbə ilə planlı rezervasiyanın fərqi nədir?",
    answer: "Canlı növbədə iştirakçılar cari ardıcıllığa qoşulur. Planlı rezervasiyada isə müştəri iş qrafikindən yaranan boş tarix və saatı əvvəlcədən seçir.",
  },
  {
    question: "NövbəTime hansı bizneslər üçün uyğundur?",
    answer: "Müştəri qəbulu aparan klinikalar, salonlar, xidmət mərkəzləri, filiallı bizneslər və fərdi mütəxəssislər hər otaq üçün uyğun növbə rejimi qura bilər.",
  },
] as const;

export function LandingPage() {
  const { status } = useAuth();
  const pageRef = useRef<HTMLDivElement>(null);
  const accountTarget = status === "authenticated" ? "/app" : "/register";
  const accountLabel = status === "authenticated"
    ? "İş sahəsinə keçin"
    : status === "checking" || status === "idle"
      ? "Hesab yoxlanılır…"
      : "Hesab yarat";

  usePageMeta(
    "Onlayn növbə və rezervasiya sistemi | NövbəTime",
    "Azərbaycanda bizneslər və müştərilər üçün onlayn növbə, canlı növbə və qəbul rezervasiyası. QR ilə qoşulun, növbənizi telefondan izləyin.",
    { canonicalPath: "/", structuredData: homeStructuredData },
  );

  useEffect(() => {
    const page = pageRef.current;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!page || prefersReducedMotion) return;

    const items = Array.from(page.querySelectorAll<HTMLElement>("[data-reveal]"));
    page.classList.add("landing-page--motion-ready");

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
        <div className="shell landing-hero__inner">
          <div className="landing-hero__intro" data-reveal>
            <p className="eyebrow">Birbaşa başlayın</p>
            <h1 id="hero-title">Nə etmək istəyirsiniz?</h1>
            <p className="landing-hero__lede">
              Sizə uyğun seçimi edin — qalan addımları NövbəTime aydın şəkildə göstərəcək.
            </p>
          </div>

          <nav className="landing-hero__choices" aria-label="Sürətli başlanğıc seçimləri" data-reveal>
            <Link className="landing-choice-card landing-choice-card--create" to={accountTarget}>
              <span className="landing-choice-card__topline">
                <span>01</span>
                <span className="landing-choice-card__badge">Hesab ilə</span>
              </span>
              <div className="landing-choice-card__body">
                <span className="landing-choice-card__artwork" aria-hidden="true">
                  <svg viewBox="0 0 96 96">
                    <rect x="12" y="12" width="72" height="72" rx="18" />
                    <path d="M29 29h13v13H29zM54 29h13v13H54zM29 54h13v13H29zM55 54h5v5h-5zM63 54h5v14h-5zM54 63h5v5h-5z" />
                  </svg>
                </span>
                <div>
                  <h2>Növbə yarat</h2>
                  <p>Canlı və ya planlı növbə qurun, QR kodunuzu paylaşın və axını idarə edin.</p>
                </div>
              </div>
              <span className="landing-choice-card__footer">
                <span>Davam etmək üçün hesab tələb olunur</span>
                <ArrowIcon />
              </span>
            </Link>

            <Link className="landing-choice-card landing-choice-card--join" to="/rooms">
              <span className="landing-choice-card__topline">
                <span>02</span>
                <span className="landing-choice-card__badge">Sürətli giriş</span>
              </span>
              <div className="landing-choice-card__body">
                <span className="landing-choice-card__artwork" aria-hidden="true">
                  <svg viewBox="0 0 96 96">
                    <rect x="13" y="20" width="70" height="56" rx="16" />
                    <path d="M27 39h42M27 50h29M27 61h20" />
                    <circle cx="70" cy="61" r="5" />
                  </svg>
                </span>
                <div>
                  <h2>Növbəyə qoşul</h2>
                  <p>Otağı tapın, canlı növbəyə qeydiyyatsız qoşulun və yerinizi izləyin.</p>
                </div>
              </div>
              <span className="landing-choice-card__footer">
                <span>Planlı qəbul üçün giriş tələb olunur</span>
                <ArrowIcon />
              </span>
            </Link>
          </nav>
        </div>
        <a className="landing-scroll-cue" href="#how-it-works" aria-label="Necə işlədiyini görmək üçün aşağı keçin">
          <span aria-hidden="true" /> Necə işləyir
        </a>
      </section>

      <section className="landing-proof" aria-label="NövbəTime platformasının əsas üstünlükləri">
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

      <section className="landing-sectors shell" id="suitable-businesses" aria-labelledby="sectors-title">
        <div className="landing-section-heading" data-reveal>
          <p className="eyebrow">Kimlər üçün</p>
          <h2 id="sectors-title">Onlayn növbə və rezervasiya sistemi kimlər üçün uyğundur?</h2>
          <p>
            NövbəTime Azərbaycanda müştəri qəbulu aparan bizneslərə növbəni, boş saatları və
            gündəlik iş axınını bir platformada idarə etməyə kömək edir.
          </p>
        </div>
        <div className="landing-sectors__grid">
          {suitableBusinesses.map((business, index) => (
            <article key={business.title} data-reveal>
              <span aria-hidden="true">0{index + 1}</span>
              <h3>{business.title}</h3>
              <p>{business.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-faq" aria-labelledby="faq-title">
        <div className="shell landing-faq__grid">
          <div className="landing-section-heading" data-reveal>
            <p className="eyebrow">Aydın cavablar</p>
            <h2 id="faq-title">NövbəTime haqqında tez-tez verilən suallar</h2>
            <p>Canlı növbə və planlı qəbul modelini ehtiyacınıza uyğun seçin.</p>
          </div>
          <div className="landing-faq__list" data-reveal>
            {frequentlyAskedQuestions.map((item, index) => (
              <details key={item.question} open={index === 0}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
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
