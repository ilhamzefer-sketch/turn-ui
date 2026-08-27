import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TextField } from "./TextField";

describe("field information tooltip", () => {
  it("connects the visible label and an accessible explanation to the field", () => {
    render(<TextField label="Telefon nömrəsi" />);

    const field = screen.getByLabelText("Telefon nömrəsi");
    const infoButton = screen.getByRole("button", { name: "Sahə haqqında məlumatı göstər" });
    const tooltip = screen.getByRole("tooltip");
    expect(infoButton).toHaveAttribute("aria-describedby", tooltip.id);
    expect(field).toHaveAttribute("aria-describedby", tooltip.id);
    expect(tooltip).toHaveTextContent("Əlaqə");
  });

  it("keeps info out of the Tab order while describing the input", async () => {
    const user = userEvent.setup();
    render(<TextField label="Otaq adı" info="Müştərinin görəcəyi otaq adıdır." />);

    await user.tab();

    const field = screen.getByLabelText("Otaq adı");
    const infoButton = screen.getByRole("button", { name: "Sahə haqqında məlumatı göstər" });
    expect(field).toHaveFocus();
    expect(field).toHaveAccessibleDescription("Müştərinin görəcəyi otaq adıdır.");
    expect(infoButton).toHaveAttribute("tabindex", "-1");
  });
});
