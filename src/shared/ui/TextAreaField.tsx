import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

import { FieldLabel } from "./FieldLabel";

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
  info?: string;
};

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, error, hint, info, id, className, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const infoId = `${inputId}-info`;
  const describedBy = [descriptionId, infoId].filter(Boolean).join(" ");

  return (
    <div className={`field ${error ? "field--error" : ""} ${className ?? ""}`.trim()}>
      <FieldLabel htmlFor={inputId} label={label} info={info} infoId={infoId} />
      <textarea
        {...props}
        ref={ref}
        id={inputId}
        className="field__control field__control--textarea"
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {error ? (
        <p className="field__message field__message--error" id={descriptionId} role="alert">{error}</p>
      ) : hint ? (
        <p className="field__message" id={descriptionId}>{hint}</p>
      ) : null}
    </div>
  );
});
