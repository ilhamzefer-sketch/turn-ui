import { Link, useNavigate } from "react-router-dom";

import type { PublicCategory, ReservationMode } from "../../shared/api/contracts";
import type { PublicRoomSearchParams } from "../../shared/api/publicApi";

type RoomSearchFormProps = {
  categories?: PublicCategory[];
  initialValues?: PublicRoomSearchParams;
  compact?: boolean;
};

export function RoomSearchForm({ categories = [], initialValues = {}, compact = false }: RoomSearchFormProps) {
  const navigate = useNavigate();

  function submit(form: HTMLFormElement) {
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const key of ["q", "categoryId", "city", "district", "mode"]) {
      const value = String(data.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }
    navigate(`/rooms${params.size ? `?${params}` : ""}`);
  }

  if (compact) {
    return (
      <form
        className="quick-search"
        aria-label="Otaq axtarışı"
        onSubmit={(event) => {
          event.preventDefault();
          submit(event.currentTarget);
        }}
      >
        <label className="quick-search__query">
          <span>Nə axtarırsınız?</span>
          <input name="q" maxLength={120} placeholder="Biznes, mütəxəssis və ya xidmət" />
        </label>
        <label className="quick-search__mode">
          <span>Növbə növü</span>
          <select name="mode" defaultValue="">
            <option value="">Hamısı</option>
            <option value="LIVE_QUEUE">Canlı növbə</option>
            <option value="PLANNED_BOOKING">Planlı rezervasiya</option>
          </select>
        </label>
        <button className="button button--primary quick-search__submit" type="submit">
          Otaq tap
          <span aria-hidden="true">→</span>
        </button>
      </form>
    );
  }

  return (
    <form
      className="discovery-filters"
      aria-label="Axtarış filterləri"
      onSubmit={(event) => {
        event.preventDefault();
        submit(event.currentTarget);
      }}
    >
      <div className="discovery-filters__main">
        <label className="filter-field filter-field--query">
          <span>Axtarış</span>
          <input
            name="q"
            maxLength={120}
            defaultValue={initialValues.q}
            placeholder="Biznes, filial, otaq və ya xidmət"
          />
        </label>
        <label className="filter-field">
          <span>Kateqoriya</span>
          <select name="categoryId" defaultValue={initialValues.categoryId ?? ""}>
            <option value="">Bütün kateqoriyalar</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          <span>Şəhər</span>
          <input name="city" maxLength={120} defaultValue={initialValues.city} placeholder="Məsələn, Bakı" />
        </label>
        <label className="filter-field">
          <span>Rayon</span>
          <input name="district" maxLength={120} defaultValue={initialValues.district} placeholder="Məsələn, Nəsimi" />
        </label>
      </div>

      <fieldset className="mode-filter">
        <legend>Növbə növü</legend>
        <ModeOption value="" label="Hamısı" current={initialValues.mode} />
        <ModeOption value="LIVE_QUEUE" label="Canlı növbə" current={initialValues.mode} />
        <ModeOption value="PLANNED_BOOKING" label="Planlı rezervasiya" current={initialValues.mode} />
      </fieldset>

      <div className="discovery-filters__actions">
        <button className="button button--primary" type="submit">Nəticələri göstər</button>
        <Link className="button button--quiet" to="/rooms">Filterləri təmizlə</Link>
      </div>
    </form>
  );
}

function ModeOption({
  value,
  label,
  current,
}: {
  value: "" | ReservationMode;
  label: string;
  current?: ReservationMode;
}) {
  return (
    <label>
      <input type="radio" name="mode" value={value} defaultChecked={(current ?? "") === value} />
      <span>{label}</span>
    </label>
  );
}
