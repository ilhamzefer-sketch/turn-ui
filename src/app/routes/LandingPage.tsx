import { useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../shared/auth/useAuth";
import { homeStructuredData } from "../../shared/meta/siteMetadata";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { ArrowIcon } from "../../shared/ui/ArrowIcon";
import { ButtonLink } from "../../shared/ui/Button";
import { LandingGallery } from "./LandingGallery";
import { QlessRoleShowcase } from "./QlessRoleShowcase";
import { QlessBenefits } from "./QlessBenefits";
import { useLandingMotion } from "./useLandingMotion";

const steps = [
  { title: "Otağı tapın", text: "Biznesi, filialı və ya mütəxəssisi axtarın." },
  {
    title: "Növbə və ya saat seçin",
    text: "Canlı növbəyə qoşulun və ya boş qəbul saatını rezervasiya edin.",
  },
  {
    title: "Vaxtınız çatanda gəlin",
    text: "Növbənizin gedişini telefondan izləyin, gününüzə davam edin.",
  },
];
const questions = [
  {
    question: "Onlayn növbə sistemi necə işləyir?",
    answer:
      "Uyğun otağı tapın, canlı növbəyə uzaqdan qoşulun və növbədəki yerinizi telefondan izləyin. Vaxtınız yaxınlaşanda məkana gəlin.",
  },
  {
    question: "Canlı növbə ilə planlı rezervasiyanın fərqi nədir?",
    answer:
      "Canlı növbədə cari ardıcıllığa qoşulursunuz. Planlı rezervasiyada isə otağın iş qrafikindən yaranan boş tarix və saatı əvvəlcədən seçirsiniz.",
  },
  {
    question: "Hesab yaratmadan qoşula bilərəm?",
    answer:
      "Canlı növbəyə qeydiyyatsız qoşulmaq mümkündür. Planlı qəbul və növbə yaratmaq üçün hesabınıza daxil olun.",
  },
];
const scenarios = [
  {
    image: "clinic.webp",
    label: "Klinika və tibbi qəbul",
    title: "Diqqətiniz pasiyentdə qalsın.",
    text: "Canlı növbə və planlı qəbul ilə pasiyent axınını təşkil edin.",
  },
  {
    image: "salon.webp",
    label: "Gözəllik və şəxsi qulluq",
    title: "Hər müştərinin öz saatı olsun.",
    text: "Qəbul saatlarını göstərin və günün iş qrafikini planlayın.",
  },
  {
    image: "service.webp",
    label: "Xidmət mərkəzləri",
    title: "Qapıdan əvvəl növbə götürülsün.",
    text: "QR kodla qoşulma və telefonla növbənin gedişini izləmə.",
  },
  {
    image: "specialist.webp",
    label: "Fərdi mütəxəssislər",
    title: "İşinizi öz ritminizdə qurun.",
    text: "Bir otaq, aydın qrafik və rahat müştəri qəbulu.",
  },
];

export function LandingPage() {
  const { status } = useAuth();
  const pageRef = useRef<HTMLDivElement>(null);
  const accountTarget = status === "authenticated" ? "/app" : "/register";
  const accountLabel =
    status === "authenticated" ? "İş sahəsinə keçin" : "Hesab yarat";
  usePageMeta(
    "Onlayn növbə və rezervasiya sistemi | NövbəTime",
    "Azərbaycanda bizneslər və müştərilər üçün onlayn növbə, canlı növbə və qəbul rezervasiyası. QR ilə qoşulun, növbənizi telefondan izləyin.",
    { canonicalPath: "/", structuredData: homeStructuredData },
  );
  useLandingMotion(pageRef);
  return (
    <div className="landing-page landing-page--qless" ref={pageRef}>
      <section className="qless-hero" aria-labelledby="hero-title">
        <div
          className="qless-floating qless-floating--one"
          data-hero-float="1"
          aria-hidden="true"
          data-parallax="layer"
        >
          <span>
            Qəbul otağı <small>Nümunə</small>
          </span>
          <strong>A-12</strong>
          <p>
            <i /> Hazırda qəbulda
          </p>
        </div>
        <div
          className="qless-floating qless-floating--two"
          data-hero-float="2"
          aria-hidden="true"
          data-parallax
        >
          <span>
            Rezervasiya <small>Nümunə</small>
          </span>
          <strong>10:00</strong>
          <p>Seçilən qəbul saatı</p>
        </div>
        <div
          className="qless-floating qless-floating--three"
          data-hero-float="3"
          aria-hidden="true"
          data-parallax="layer"
        >
          <span>
            Sizin növbəniz <small>Nümunə</small>
          </span>
          <strong>A-15</strong>
          <p>Sizdən əvvəl: 3 nəfər</p>
        </div>
        <div
          className="qless-floating qless-floating--four"
          data-hero-float="4"
          aria-hidden="true"
          data-parallax
        >
          <span>
            Qəbulun vəziyyəti <small>Nümunə</small>
          </span>
          <strong>Növbə açıqdır</strong>
          <p>
            <i /> Canlı axın
          </p>
        </div>
        <div className="shell qless-hero__content" data-reveal>
          <img
            className="qless-hero__avatars"
            src="/landing/qless/avatars.webp"
            width="480"
            height="160"
            alt=""
          />
          <p className="eyebrow">Vaxtınıza dəyər verən növbə sistemi</p>
          <h1 id="hero-title">
            Daha az gözləyin. <span>Daha çox yaşayın.</span>
          </h1>
          <p className="qless-hero__lede">
            Növbənizi uzaqdan götürün, qəbul saatınızı seçin və gününüzə davam
            edin. Gözləmənin gedişi hər an telefonunuzda olsun.
          </p>
          <div className="qless-hero__actions">
            <ButtonLink to="/rooms">
              Növbəyə qoşul <ArrowIcon />
            </ButtonLink>
            <ButtonLink to={accountTarget} variant="secondary">
              Növbə yarat <ArrowIcon />
            </ButtonLink>
          </div>
          <p className="qless-hero__note">
            Canlı növbəyə qeydiyyatsız qoşulmaq mümkündür.
          </p>
        </div>
      </section>
      <QlessRoleShowcase accountTarget={accountTarget} />
      <QlessBenefits />
      <section
        className="qless-journey"
        id="how-it-works"
        aria-labelledby="journey-title"
      >
        <div className="shell">
          <div className="qless-section-heading" data-reveal>
            <p className="eyebrow">NövbəTime ilə daha rahat gün</p>
            <h2 id="journey-title">
              Gözləmək üçün deyil,
              <br />
              yaşamaq üçün vaxt.
            </h2>
            <p>Növbənizi götürmək üç sadə addımdan ibarətdir.</p>
          </div>
          <div className="qless-journey__grid">
            {steps.map((step, index) => (
              <article key={step.title} data-reveal>
                <span>0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        className="qless-business"
        id="for-business"
        aria-labelledby="business-title"
      >
        <div className="shell">
          <div className="qless-section-heading" data-reveal>
            <p className="eyebrow">Biznes və mütəxəssislər üçün</p>
            <h2 id="business-title">
              Hər otağın öz ritmi.
              <br />
              Hamısı bir platformada.
            </h2>
            <p>
              Filialları, otaqları, komandanı və iş saatlarını bir yerdə idarə
              edin.
            </p>
            <ButtonLink to={accountTarget}>
              {accountLabel}
              <ArrowIcon />
            </ButtonLink>
          </div>
          <img
            src="/landing/qless/workspace.webp"
            width="1000"
            height="750"
            loading="lazy"
            decoding="async"
            alt="NövbəTime iş sahəsini təsvir edən illüstrativ görünüş"
            data-parallax
          />
        </div>
      </section>
      <LandingGallery />
      <section className="qless-scenarios" aria-labelledby="scenarios-title">
        <div className="shell">
          <div className="qless-section-heading" data-reveal>
            <p className="eyebrow">Qəbulun hər növü üçün</p>
            <h2 id="scenarios-title">
              Fərqli xidmətlər.
              <br />
              Eyni rahat təcrübə.
            </h2>
            <p>İllüstrativ xidmət ssenariləri.</p>
          </div>
          <div className="qless-scenarios__grid">
            {scenarios.map((scene, index) => (
              <Link
                className={
                  index === 0
                    ? "qless-scenario qless-scenario--featured"
                    : "qless-scenario"
                }
                key={scene.image}
                to="/rooms"
                data-reveal
              >
                <img
                  src={"/landing/qless/" + scene.image}
                  width="1536"
                  height="1024"
                  loading="lazy"
                  decoding="async"
                  alt={scene.label + " üçün illüstrativ xidmət səhnəsi"}
                />
                <div>
                  <span>{scene.label}</span>
                  <h3>{scene.title}</h3>
                  <p>{scene.text}</p>
                  <span className="qless-scenario__link">
                    Otaqları kəşf edin <ArrowIcon />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section
        className="landing-faq"
        id="landing-faq"
        aria-labelledby="faq-title"
        tabIndex={-1}
      >
        <div className="shell landing-faq__grid">
          <div className="qless-section-heading" data-reveal>
            <p className="eyebrow">Aydın cavablar</p>
            <h2 id="faq-title">Başlamazdan əvvəl.</h2>
          </div>
          <div className="landing-faq__list" data-reveal>
            {questions.map((q, index) => (
              <details key={q.question} open={index === 0}>
                <summary>{q.question}</summary>
                <p>{q.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section className="qless-closing" aria-labelledby="closing-title">
        <div className="shell">
          <div data-reveal>
            <p className="eyebrow">Növbəti addım sizindir</p>
            <h2 id="closing-title">
              Vaxtınızı
              <br />
              geri alın.
            </h2>
            <p>Növbə gözləməyə deyil, gününüzə vaxt ayırın.</p>
            <ButtonLink to="/rooms">
              Uyğun otağı tap <ArrowIcon />
            </ButtonLink>
          </div>
          <img
            src="/landing/qless/phone.webp"
            width="1000"
            height="1000"
            loading="lazy"
            decoding="async"
            alt="Telefondan növbəni izləmənin illüstrativ görünüşü"
            data-parallax
          />
        </div>
      </section>
    </div>
  );
}
