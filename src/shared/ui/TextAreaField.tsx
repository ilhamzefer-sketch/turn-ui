import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, error, hint, id, className, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={`field ${error ? "field--error" : ""} ${className ?? ""}`.trim()}>
      <label className="field__label" htmlFor={inputId}>{label}</label>
      <textarea
        {...props}
        ref={ref}
        id={inputId}
        className="field__control field__control--textarea"
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
      />
      {error ? (
        <p className="field__message field__message--error" id={descriptionId} role="alert">{error}</p>
      ) : hint ? (
        <p className="field__message" id={descriptionId}>{hint}</p>
      ) : null}
    </div>
  );
});
