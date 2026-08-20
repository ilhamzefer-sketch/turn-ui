import { ButtonLink } from "../../shared/ui/Button";
import { Brand } from "../../shared/ui/Brand";

export function NotFoundPage() {
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
