import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { recoverySchema, type RecoveryFormValues } from "../../features/auth/schemas";
import { supportApi } from "../../shared/api/supportApi";
import { ApiError } from "../../shared/api/httpClient";
import { Button } from "../../shared/ui/Button";
import { TextAreaField } from "../../shared/ui/TextAreaField";
import { TextField } from "../../shared/ui/TextField";
import { usePageMeta } from "../../shared/meta/usePageMeta";

export function AccountRecoveryPage() {
  usePageMeta("Hesabı bərpa edin — E-Növbə", "E-Növbə hesabına giriş üçün dəstək müraciəti yaradın.");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoveryFormValues>({ resolver: zodResolver(recoverySchema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const response = await supportApi.createOwnershipDispute(values);
      setRequestId(response.id);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Müraciət göndərilmədi. Yenidən cəhd edin.");
    }
  });

  if (requestId !== null) {
    return (
      <section className="auth-section" aria-labelledby="recovery-success-title">
        <div className="auth-card recovery-success">
          <p className="eyebrow">Müraciət qəbul edildi</p>
          <h1 id="recovery-success-title">Dəstək komandası müraciətinizə baxacaq.</h1>
          <p>Müraciət nömrəniz <strong>#{requestId}</strong>-dir. Yoxlama tamamlandıqdan sonra göstərdiyiniz əlaqə nömrəsi ilə sizinlə əlaqə saxlanılacaq.</p>
          <p>Şifrə sıfırlandıqda yeni şifrəni adi qeydiyyat formasında təyin edəcəksiniz. Bu prosesin avtomatik vaxt limiti yoxdur.</p>
          <Button className="recovery-success__action" onClick={() => setRequestId(null)} variant="secondary">
            Yeni müraciət yarat
          </Button>
          <p className="auth-card__switch"><Link to="/login">Daxil ol səhifəsinə qayıt</Link></p>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-section" aria-labelledby="recovery-title">
      <div className="auth-card auth-card--wide">
        <div className="auth-card__intro">
          <p className="eyebrow">Hesaba giriş</p>
          <h1 id="recovery-title">Dəstəyə müraciət edin</h1>
          <p>E-Növbə SMS və email ilə avtomatik şifrə bərpası etmir. Hesab sahibliyi dəstək komandası tərəfindən ayrıca yoxlanılır.</p>
        </div>
        <div className="auth-card__notice auth-card__notice--warning">
          <strong>Şifrəniz yalnız yoxlamadan sonra sıfırlanacaq.</strong>
          <p>Dəstək qərar verənədək hesabın mövcud məlumatları dəyişdirilmir.</p>
        </div>
        {submitError ? <div className="form-alert" role="alert">{submitError}</div> : null}
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <TextField
            label="Hesabın telefon nömrəsi"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="050 123 45 67"
            error={errors.disputedPhone?.message}
            {...register("disputedPhone")}
          />
          <TextField label="Ad və soyad" autoComplete="name" error={errors.claimantName?.message} {...register("claimantName")} />
          <TextField
            label="Sizinlə əlaqə üçün telefon"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            error={errors.claimantContactPhone?.message}
            {...register("claimantContactPhone")}
          />
          <TextAreaField
            label="Müraciətin izahı"
            rows={5}
            hint="Məsələn: şifrəni unutmuşam və bu nömrə mənə məxsusdur."
            error={errors.description?.message}
            {...register("description")}
          />
          <Button type="submit" loading={isSubmitting}>Müraciəti göndər</Button>
        </form>
        <p className="auth-card__switch"><Link to="/login">Daxil ol səhifəsinə qayıt</Link></p>
      </div>
    </section>
  );
}
