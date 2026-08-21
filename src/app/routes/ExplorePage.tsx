import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";

import { readDiscoveryParams, withPage } from "../../features/discovery/discoveryParams";
import { RoomCard } from "../../features/discovery/RoomCard";
import { RoomSearchForm } from "../../features/discovery/RoomSearchForm";
import { publicApi } from "../../shared/api/publicApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";

export function ExplorePage() {
  const [searchParams] = useSearchParams();
  const filters = readDiscoveryParams(searchParams);
  const categoriesQuery = useQuery({ queryKey: ["public-categories"], queryFn: publicApi.categories });
  const roomsQuery = useQuery({
    queryKey: ["public-rooms", filters],
    queryFn: () => publicApi.rooms(filters),
  });

  usePageMeta(
    "Otaq tap — NövbəTime",
    "Biznes, filial, mütəxəssis və növbə növünə görə açıq otaqları axtarın.",
  );

  const page = roomsQuery.data;

  return (
    <div className="discovery-page">
      <section className="discovery-hero" aria-labelledby="discovery-title">
        <div className="shell discovery-hero__inner">
          <p className="eyebrow">Açıq otaqlar</p>
          <h1 id="discovery-title">Uyğun otağı, uyğun vaxtda tapın.</h1>
          <p>
            Biznes, filial, otaq və ya mütəxəssis adı ilə axtarın. Canlı növbəni və planlı
            rezervasiyanı ehtiyacınıza görə ayırın.
          </p>
        </div>
      </section>

      <div className="shell discovery-layout">
        <aside className="discovery-sidebar" aria-label="Axtarışı dəqiqləşdirin">
          <RoomSearchForm
            key={searchParams.toString()}
            categories={categoriesQuery.data}
            initialValues={filters}
          />
          {categoriesQuery.isError && (
            <p className="filter-note" role="status">Kateqoriyalar hazırda yüklənmədi. Digər filterlər işləkdir.</p>
          )}
        </aside>

        <section className="discovery-results" aria-labelledby="results-title" aria-live="polite">
          <div className="results-heading">
            <div>
              <p className="eyebrow">Axtarış nəticəsi</p>
              <h2 id="results-title">
                {page ? `${page.totalElements} otaq tapıldı` : "Otaqlar axtarılır"}
              </h2>
            </div>
            {filters.q && <p>“{filters.q}” üçün nəticələr</p>}
          </div>

          {roomsQuery.isPending && <RoomCardSkeletons />}

          {roomsQuery.isError && (
            <div className="result-state result-state--error" role="alert">
              <span className="result-state__icon" aria-hidden="true">!</span>
              <h3>Otaqlar yüklənmədi</h3>
              <p>Bağlantını yoxlayın və sorğunu yenidən göndərin.</p>
              <button className="button button--secondary" type="button" onClick={() => roomsQuery.refetch()}>
                Yenidən yoxla
              </button>
            </div>
          )}

          {page && page.items.length === 0 && (
            <div className="result-state">
              <span className="result-state__icon" aria-hidden="true">⌕</span>
              <h3>Bu filterlərə uyğun otaq tapılmadı</h3>
              <p>Axtarış sözünü qısaldın və ya filterlərdən birini təmizləyin.</p>
              <Link className="button button--secondary" to="/rooms">Bütün otaqları göstər</Link>
            </div>
          )}

          {page && page.items.length > 0 && (
            <>
              <div className="room-grid">
                {page.items.map((room) => <RoomCard key={room.id} room={room} />)}
              </div>
              {page.totalPages > 1 && (
                <nav className="pagination" aria-label="Nəticə səhifələri">
                  {page.page > 0 ? (
                    <Link className="button button--secondary" to={{ search: withPage(searchParams, page.page - 1) }}>
                      <span aria-hidden="true">←</span> Əvvəlki
                    </Link>
                  ) : <span />}
                  <span>{page.page + 1} / {page.totalPages}</span>
                  {page.page + 1 < page.totalPages ? (
                    <Link className="button button--secondary" to={{ search: withPage(searchParams, page.page + 1) }}>
                      Növbəti <span aria-hidden="true">→</span>
                    </Link>
                  ) : <span />}
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function RoomCardSkeletons() {
  return (
    <div className="room-grid" aria-label="Otaqlar yüklənir" role="status">
      {[0, 1, 2, 3].map((item) => (
        <div className="room-card room-card--skeleton" key={item} aria-hidden="true">
          <span /><span /><span /><span />
        </div>
      ))}
    </div>
  );
}
