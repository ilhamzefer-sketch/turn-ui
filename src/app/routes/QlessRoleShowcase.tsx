import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";

import { ArrowIcon } from "../../shared/ui/ArrowIcon";

const roles = [
  {
    label: "Müştəri",
    title: "Gününüzü gözləmə zalında keçirməyin.",
    text: "Növbənizi uzaqdan götürün, yerinizi izləyin və vaxtınız çatanda gəlin.",
    action: "Növbəyə qoşul",
    image: "phone.webp",
    scene: "customer",
  },
  {
    label: "Əməkdaş",
    title: "Qəbula fokuslanın. Axını aydın görün.",
    text: "Növbəni irəli aparın, qəbulun gedişini izləyin və müştəriləri ardıcıllıqla qarşılayın.",
    action: "İş sahəsinə keçin",
    image: "workspace.webp",
    scene: "employee",
  },
  {
    label: "Biznes sahibi",
    title: "Hər otaq işləsin. Siz ümumi mənzərəni görün.",
    text: "Filialları, otaqları, komandanı və iş saatlarını vahid iş sahəsində idarə edin.",
    action: "Növbə yarat",
    image: "workspace.webp",
    scene: "business",
  },
] as const;

export function QlessRoleShowcase({
  accountTarget,
}: {
  accountTarget: string;
}) {
  const [active, setActive] = useState(0);
  const panels = [
    { role: roles[2], index: 2, clone: true },
    ...roles.map((role, index) => ({ role, index, clone: false })),
    { role: roles[0], index: 0, clone: true },
  ];

  return (
    <section className="qless-roles" aria-labelledby="roles-title">
      <div className="shell qless-roles__heading" data-reveal>
        <h2 id="roles-title">
          Uzun növbələrə və dolu
          <br />
          gözləmə zallarına son qoyun.
        </h2>
        <p>
          Müştəri üçün rahatlıq. Komanda üçün aydınlıq. Biznes üçün nəzarət.
        </p>
      </div>
      <div
        className="qless-roles__tabs"
        role="tablist"
        aria-label="NövbəTime kimlər üçündür"
      >
        {roles.map((role, index) => (
          <button
            key={role.scene}
            id={`role-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-controls={`role-panel-${index}`}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % roles.length
                  : event.key === "ArrowLeft"
                    ? (index + roles.length - 1) % roles.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? roles.length - 1
                        : null;
              if (next === null) return;
              event.preventDefault();
              setActive(next);
              document.getElementById(`role-tab-${next}`)?.focus();
            }}
          >
            {role.label}
          </button>
        ))}
      </div>
      <div className="qless-roles__viewport">
        <div
          className="qless-roles__track"
          style={{ "--role-index": active + 1 } as CSSProperties}
        >
          {panels.map(({ role, index, clone }) => (
            <article
              key={`${clone ? "preview" : "panel"}-${role.scene}`}
              className={`qless-role qless-role--${role.scene}`}
              id={clone ? undefined : `role-panel-${index}`}
              role={clone ? "presentation" : "tabpanel"}
              aria-labelledby={clone ? undefined : `role-tab-${index}`}
              aria-hidden={clone || active !== index}
              data-role-clone={clone ? "true" : undefined}
            >
              <div className="qless-role__scene" data-parallax>
                <img
                  src={`/landing/qless/${role.image}`}
                  width="1000"
                  height={role.scene === "customer" ? 1000 : 750}
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
                <div className="qless-role__sample">
                  <small>Nümunə görünüş</small>
                  <strong>
                    {index === 0
                      ? "A-15"
                      : index === 1
                        ? "Növbəti qəbul"
                        : "Otaqlarınız"}
                  </strong>
                  <span>
                    {index === 0
                      ? "Sizdən əvvəl: 3 nəfər"
                      : index === 1
                        ? "A-13 · Gözləyir"
                        : "Canlı və planlı axın"}
                  </span>
                </div>
              </div>
              <div className="qless-role__copy">
                <h3>{role.title}</h3>
                <p>{role.text}</p>
                {clone ? (
                  <span className="qless-role__action" aria-hidden="true">
                    {role.action}
                    <ArrowIcon />
                  </span>
                ) : (
                  <Link
                    className="qless-role__action"
                    to={index === 0 ? "/rooms" : accountTarget}
                    tabIndex={active === index ? 0 : -1}
                  >
                    {role.action}
                    <ArrowIcon />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="shell qless-roles__footer">
        <span>Bir platforma. Üç baxış.</span>
        <span aria-live="polite">0{active + 1} / 03</span>
      </div>
    </section>
  );
}
