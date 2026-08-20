import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { loginSchema, type LoginFormValues } from "../../features/auth/schemas";
import { ApiError } from "../../shared/api/httpClient";
import { useAuth } from "../../shared/auth/useAuth";
import { Button } from "../../shared/ui/Button";
import { TextField } from "../../shared/ui/TextField";
import { usePageMeta } from "../../shared/meta/usePageMeta";

type LoginLocationState = {
  from?: { pathname?: string; search?: string };
};

export function LoginPage() {
  usePageMeta("Daxil olun — E-Növbə", "Telefon nömrəniz və şifrənizlə E-Növbə hesabınıza daxil olun.");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showRegistrationCompletion, setShowRegistrationCompletion] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setShowRegistrationCompletion(false);
    try {
      await login(values);
      const state = location.state as LoginLocationState | null;
      const returnPath = state?.from?.pathname ? `${state.from.pathname}${state.from.search ?? ""}` : "/app";
      await navigate(returnPath, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setShowRegistrationCompletion(true);
      }
      setSubmitError(error instanceof ApiError ? error.message : "Daxil olmaq mümkün olmadı. Yenidən cəhd edin.");
    }
  });

  return (
    <section className="auth-section" aria-labelledby="login-title">
      <div className="auth-card">
        <div className="auth-card__intro">
          <p className="eyebrow">Yenidən xoş gəlmisiniz</p>
          <h1 id="login-title">Hesabınıza daxil olun</h1>
          <p>Telefon nömrəniz bütün müştəri və biznes rollarınızı bir hesabda açır.</p>
        </div>
        {submitError ? (
          <div className="form-alert" role="alert">
            <p>{submitError}</p>
            {showRegistrationCompletion ? (
              <Link to="/register">Qeydiyyat formasında şifrə təyin edin</Link>
            ) : null}
          </div>
        ) : null}
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <TextField
            label="Telefon nömrəsi"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="050 123 45 67"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <TextField
            label="Şifrə"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" loading={isSubmitting}>Daxil ol</Button>
        </form>
        <p className="auth-card__assist"><Link to="/account-recovery">Şifrəni unutmusunuz?</Link></p>
        <p className="auth-card__switch">Hesabınız yoxdur? <Link to="/register">Pulsuz qeydiyyatdan keçin</Link></p>
      </div>
    </section>
  );
}
