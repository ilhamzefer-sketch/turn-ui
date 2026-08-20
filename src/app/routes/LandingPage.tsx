import { ArrowIcon } from "../../shared/ui/ArrowIcon";
import { ButtonLink } from "../../shared/ui/Button";
import { RoomSearchForm } from "../../features/discovery/RoomSearchForm";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { useAuth } from "../../shared/auth/useAuth";

const flowItems = [
  { reference: "A-14", label: "İndi xidmət alır", state: "active" },
  { reference: "A-15", label: "Siz növbədəsiniz", state: "next" },
  { reference: "A-16", label: "Təxminən 18 dəqiqə", state: "waiting" },
] as const;

export function LandingPage() {
  const { status } = useAuth();
  const hasAccountSession = status === "authenticated" || status === "checking" || status === "idle";
  usePageMeta(
    "E-Növbə — Vaxtınızı növbədə yox, həyatınızda keçirin",
    "Canlı növbəyə uzaqdan qoşulun və ya uyğun saatı əvvəlcədən rezervasiya edin.",
  );

  return (
    <>
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Vaxtınızı geri qazanın</p>
            <h1 id="hero-title">Növbəni deyil, gününüzü planlayın.</h1>
            <p className="hero-lede">
              Canlı növbəyə uzaqdan qoşulun və ya uyğun saatı əvvəlcədən rezervasiya edin.
              E-Növbə gözləməyi görünən və idarə olunan edir.
            </p>
            <RoomSearchForm compact />
            <a className="hero-text-link" href="#how-it-works">
              Əvvəlcə necə işlədiyinə baxın <ArrowIcon />
            </a>
            <p className="hero-note">Qeydiyyatsız canlı növbə · Telefonla vahid hesab · Azərbaycan dili</p>
          </div>

          <div className="queue-visual" aria-label="Canlı növbənin nümunə görünüşü">
            <div className="queue-visual__topline">
              <div>
                <span className="queue-visual__eyebrow">Nümunə görünüş</span>
                <h2>Bugünkü canlı növbə</h2>
              </div>
              <span className="status-pill">
                <span aria-hidden="true" /> Açıqdır
              </span>
            </div>
            <ol className="queue-list">
              {flowItems.map((item) => (
                <li className={`queue-list__item queue-list__item--${item.state}`} key={item.reference}>
                  <span className="queue-list__reference">{item.reference}</span>
                  <span className="queue-list__label">{item.label}</span>
                  <span className="queue-list__indicator" aria-hidden="true" />
                </li>
              ))}
            </ol>
            <div className="queue-visual__footer">
              <span>Növbəniz yaxınlaşanda xəbərdar olun</span>
              <span className="queue-visual__bell" aria-hidden="true">●</span>
            </div>
          </div>
        </div>
      </section>

      <section className="principle-strip" aria-label="Platformanın əsas üstünlükləri">
        <div className="shell principle-strip__grid">
          <p><strong>Canlı vəziyyət</strong><span>Növbədə neçə nəfər olduğunu görün.</span></p>
          <p><strong>Uyğun saatlar</strong><span>Yalnız həqiqətən boş vaxtları seçin.</span></p>
          <p><strong>Bir telefon nömrəsi</strong><span>Bütün rollar üçün vahid hesab istifadə edin.</span></p>
        </div>
      </section>

      <section className="story-section shell" id="how-it-works" aria-labelledby="flow-title">
        <div className="story-heading">
          <p className="eyebrow">Bir sistem, iki axın</p>
          <h2 id="flow-title">Ehtiyacınıza uyğun gözləyin. Ya da heç gözləməyin.</h2>
        </div>
        <div className="mode-grid">
          <article className="mode-chapter mode-chapter--live">
            <div className="mode-chapter__copy">
              <span className="mode-number">01</span>
              <h3>Canlı növbə</h3>
              <p>QR kodu oxudun, ad və telefonunuzu yazın, növbənizi olduğunuz yerdən izləyin.</p>
            </div>
            <div className="live-orbit" aria-hidden="true">
              <span className="live-orbit__core">Siz</span>
              <span className="live-orbit__ring live-orbit__ring--one" />
              <span className="live-orbit__ring live-orbit__ring--two" />
            </div>
          </article>

          <article className="mode-chapter mode-chapter--planned">
            <div className="mode-chapter__copy">
              <span className="mode-number">02</span>
              <h3>Planlı rezervasiya</h3>
              <p>Otağın real iş qrafikindən yaranan boş saatı seçin və rezervasiyanı dərhal təsdiqləyin.</p>
            </div>
            <div className="slot-preview" aria-hidden="true">
              <span>09:30</span><span className="slot-preview__selected">10:00</span><span>10:30</span><span>11:00</span>
            </div>
          </article>
        </div>
      </section>

      <section className="business-section" id="for-business" aria-labelledby="business-title">
        <div className="shell business-grid">
          <div className="business-copy">
            <p className="eyebrow eyebrow--light">Biznes üçün</p>
            <h2 id="business-title">Filialdan otağa qədər hər şeyi bir axında idarə edin.</h2>
            <p>
              Filiallar yaradın, otaq sahiblərini təyin edin, iş saatlarını qurun və əməliyyat
              nəticələrini bir paneldə izləyin.
            </p>
            <ButtonLink to={hasAccountSession ? "/app" : "/register"} variant="secondary">
              {status === "authenticated" ? "İş sahəsinə keçin" : hasAccountSession ? "Hesab açılır…" : "Biznes hesabına başlayın"}
              <ArrowIcon />
            </ButtonLink>
          </div>
          <div className="business-map" aria-label="Biznes strukturunun sxemi">
            <div className="business-map__root">Biznes</div>
            <div className="business-map__branch">Mərkəz filialı</div>
            <div className="business-map__rooms">
              <span>Otaq 1</span><span>Otaq 2</span><span>Otaq 3</span>
            </div>
          </div>
        </div>
      </section>

      <section className="closing-section shell" aria-labelledby="closing-title">
        <p className="eyebrow">Başlamaq üçün</p>
        <h2 id="closing-title">Bir telefon nömrəsi. Bütün növbələriniz.</h2>
        <p>Hesab yaratmaq pulsuzdur. Müştəri, fərdi mütəxəssis və biznes rolları eyni hesabda işləyir.</p>
        <ButtonLink to={hasAccountSession ? "/app" : "/register"}>
          {status === "authenticated" ? "Hesabıma keç" : hasAccountSession ? "Hesab açılır…" : "Pulsuz hesab yarat"}
          <ArrowIcon />
        </ButtonLink>
      </section>
    </>
  );
}
