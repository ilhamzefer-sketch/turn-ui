import { forwardRef, useId, type InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, id, className, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={`field ${error ? "field--error" : ""} ${className ?? ""}`.trim()}>
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        {...props}
        ref={ref}
        id={inputId}
        className="field__control"
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
      />
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
