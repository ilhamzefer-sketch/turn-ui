import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { registrationSchema, type RegistrationFormValues } from "../../features/auth/schemas";
import { ApiError } from "../../shared/api/httpClient";
import { useAuth } from "../../shared/auth/useAuth";
import { Button } from "../../shared/ui/Button";
import { TextField } from "../../shared/ui/TextField";
import { usePageMeta } from "../../shared/meta/usePageMeta";

export function RegisterPage() {
  usePageMeta("Hesab yaradın — NövbəTime", "Telefon nömrənizlə vahid NövbəTime hesabı yaradın və ya gözləyən hesabınızı tamamlayın.");
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormValues>({ resolver: zodResolver(registrationSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await registerUser({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        password: values.password,
      });
      await navigate("/onboarding", { replace: true });
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Qeydiyyat tamamlanmadı. Yenidən cəhd edin.");
    }
  });

  return (
    <section className="auth-section" aria-labelledby="register-title">
      <div className="auth-card auth-card--wide">
        <div className="auth-card__intro">
          <p className="eyebrow">Vahid hesab</p>
          <h1 id="register-title">NövbəTime-a qoşulun</h1>
          <p>Bir telefon nömrəsi ilə müştəri, fərdi mütəxəssis və biznes rollarınızı idarə edin.</p>
        </div>
        <div className="auth-card__notice">
          <strong>Sizin üçün əvvəlcədən hesab yaradılıb?</strong>
          <p>Eyni telefon nömrəsi ilə bu formanı doldurun. Gözləyən hesabınız və tarixçəniz qorunacaq.</p>
        </div>
        {submitError ? <div className="form-alert" role="alert">{submitError}</div> : null}
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <div className="auth-form__name-grid">
            <TextField label="Ad" autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
            <TextField label="Soyad" autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
          </div>
          <TextField
            label="Telefon nömrəsi"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="050 123 45 67"
            hint="Hazırda yalnız Azərbaycan telefon nömrələri dəstəklənir."
            error={errors.phone?.message}
            {...register("phone")}
          />
          <TextField
            label="Şifrə"
            type="password"
            autoComplete="new-password"
            hint="8–128 simvol istifadə edin. Asan təxmin edilən şifrə seçməyin."
            error={errors.password?.message}
            {...register("password")}
          />
          <TextField
            label="Şifrəni təkrar edin"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" loading={isSubmitting}>Hesab yarat</Button>
        </form>
        <p className="auth-card__switch">Artıq hesabınız var? <Link to="/login">Daxil olun</Link></p>
      </div>
    </section>
  );
}
