import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PhoneField } from "./PhoneField";

describe("PhoneField", () => {
  it("allows only a ten-digit local number beginning with zero", async () => {
    const user = userEvent.setup();
    render(<PhoneField label="Telefon nömrəsi" />);
    const input = screen.getByLabelText("Telefon nömrəsi");

    await user.type(input, "05040599619");

    expect(input).toHaveValue("0504059961");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("pattern", "0[1-9][0-9]{8}");
  });

  it("does not retain international prefixes or formatting characters", () => {
    render(<PhoneField label="Telefon nömrəsi" />);
    const input = screen.getByLabelText("Telefon nömrəsi");

    fireEvent.input(input, { target: { value: "+994504059961" } });
    expect(input).toHaveValue("");

    fireEvent.input(input, { target: { value: "050 405 99 61" } });
    expect(input).toHaveValue("");
  });
});
