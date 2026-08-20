import { forwardRef, type ChangeEvent, type FocusEvent, type InputHTMLAttributes } from "react";

import { formatTime24Input, normalizeTime24 } from "../time/time24Hour";
import { TextField } from "./TextField";

type TimeFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode" | "maxLength"> & {
  label: string;
  error?: string;
  hint?: string;
};

export const TimeField = forwardRef<HTMLInputElement, TimeFieldProps>(function TimeField(
  { onChange, onBlur, hint = "24 saat formatı: SS:DD (məsələn, 18:30)", ...props },
  ref,
) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.currentTarget.value = formatTime24Input(event.currentTarget.value);
    onChange?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const normalized = normalizeTime24(event.currentTarget.value);
    if (normalized !== event.currentTarget.value) {
      event.currentTarget.value = normalized;
      onChange?.(event as ChangeEvent<HTMLInputElement>);
    }
    onBlur?.(event);
  };

  return (
    <TextField
      {...props}
      ref={ref}
      type="text"
      inputMode="numeric"
      maxLength={5}
      placeholder="09:00"
      autoComplete="off"
      hint={hint}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
});
