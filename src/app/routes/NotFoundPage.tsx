import { ButtonLink } from "../../shared/ui/Button";
import { Brand } from "../../shared/ui/Brand";
import { usePageMeta } from "../../shared/meta/usePageMeta";

export function NotFoundPage() {
  usePageMeta("Səhifə tapılmadı — NövbəTime", "Axtardığınız NövbəTime səhifəsi mövcud deyil.", { index: false });

  return (
    <main className="not-found">
      <Brand />
      <p className="eyebrow">404</p>
      <h1>Səhifə tapılmadı.</h1>
      <p>Axtardığınız ünvan dəyişdirilmiş və ya silinmiş ola bilər.</p>
      <ButtonLink to="/">Ana səhifəyə qayıt</ButtonLink>
    </main>
  );
}
