import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";

import { FieldLabel } from "./FieldLabel";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  info?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, info, id, className, type = "text", disabled, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const infoId = `${inputId}-info`;
  const describedBy = [descriptionId, infoId].filter(Boolean).join(" ");
  const passwordField = type === "password";
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <div className={`field ${error ? "field--error" : ""} ${className ?? ""}`.trim()}>
      <FieldLabel htmlFor={inputId} label={label} info={info} infoId={infoId} />
      <div className="field__control-wrap">
        <input
          {...props}
          ref={ref}
          id={inputId}
          type={passwordField && passwordVisible ? "text" : type}
          disabled={disabled}
          className={`field__control ${passwordField ? "field__control--password" : ""}`.trim()}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        {passwordField ? (
          <button
            type="button"
            className="field__password-toggle"
            aria-label="Şifrəni göstər və ya gizlət"
            aria-pressed={passwordVisible}
            title={passwordVisible ? "Şifrəni gizlət" : "Şifrəni göstər"}
            disabled={disabled}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
              <circle cx="12" cy="12" r="2.75" />
              {!passwordVisible ? <path d="m4 4 16 16" /> : null}
            </svg>
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="field__message field__message--error" id={descriptionId} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field__message" id={descriptionId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
});
