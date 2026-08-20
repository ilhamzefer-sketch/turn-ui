import { forwardRef, useId, type SelectHTMLAttributes } from "react";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, error, hint, id, className, children, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={`field ${error ? "field--error" : ""} ${className ?? ""}`.trim()}>
      <label className="field__label" htmlFor={inputId}>{label}</label>
      <select
        {...props}
        ref={ref}
        id={inputId}
        className="field__control field__control--select"
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
      >
        {children}
      </select>
      {error ? (
        <p className="field__message field__message--error" id={descriptionId} role="alert">{error}</p>
      ) : hint ? (
        <p className="field__message" id={descriptionId}>{hint}</p>
      ) : null}
    </div>
  );
});
