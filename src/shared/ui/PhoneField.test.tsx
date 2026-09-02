import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PhoneField } from "./PhoneField";

describe("PhoneField", () => {
  it("allows only a ten-digit local number beginning with zero", async () => {
    const user = userEvent.setup();
    render(<PhoneField label="Telefon nömrəsi" />);
    const input = screen.getByLabelText("Telefon nömrəsi");

    await user.type(input, "05000000009");

    expect(input).toHaveValue("0500000000");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("pattern", "0[1-9][0-9]{8}");
    expect(input).toHaveAttribute("placeholder", "0500000000");
    expect(screen.getByText("Format: 0500000000")).toBeInTheDocument();
  });

  it("does not retain international prefixes or formatting characters", () => {
    render(<PhoneField label="Telefon nömrəsi" />);
    const input = screen.getByLabelText("Telefon nömrəsi");

    fireEvent.input(input, { target: { value: "+994500000000" } });
    expect(input).toHaveValue("");

    fireEvent.input(input, { target: { value: "050 000 00 00" } });
    expect(input).toHaveValue("");
  });
});
