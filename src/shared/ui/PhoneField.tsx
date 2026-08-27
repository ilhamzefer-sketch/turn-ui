import { forwardRef, type ComponentProps, type InputEvent } from "react";

import { TextField } from "./TextField";

type PhoneFieldProps = Omit<ComponentProps<typeof TextField>, "type" | "inputMode" | "maxLength" | "pattern">;

export const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(function PhoneField(
  { autoComplete = "tel-national", hint = "Format: 0504059961", onInput, placeholder = "0504059961", ...props },
  ref,
) {
  const handleInput = (event: InputEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    event.currentTarget.value = /^0\d*$/.test(value) || value === "" ? value.slice(0, 10) : "";
    onInput?.(event);
  };

  return (
    <TextField
      {...props}
      ref={ref}
      type="tel"
      inputMode="numeric"
      autoComplete={autoComplete}
      maxLength={10}
      pattern="0[1-9][0-9]{8}"
      placeholder={placeholder}
      hint={hint}
      onInput={handleInput}
    />
  );
});
