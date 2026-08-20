import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TextField } from "./TextField";

describe("field information tooltip", () => {
  it("connects the visible label and an accessible explanation to the field", () => {
    render(<TextField label="Telefon nömrəsi" />);

    const field = screen.getByLabelText("Telefon nömrəsi");
    const infoButton = screen.getByRole("button", { name: "Telefon nömrəsi haqqında məlumat" });
    const tooltip = screen.getByRole("tooltip");
    expect(infoButton).toHaveAttribute("aria-describedby", tooltip.id);
    expect(field).toHaveAttribute("aria-describedby", tooltip.id);
    expect(tooltip).toHaveTextContent("Əlaqə");
  });

  it("keeps the tooltip reachable with a keyboard", async () => {
    const user = userEvent.setup();
    render(<TextField label="Otaq adı" info="Müştərinin görəcəyi otaq adıdır." />);

    await user.tab();

    expect(screen.getByRole("button", { name: "Otaq adı haqqında məlumat" })).toHaveFocus();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Müştərinin görəcəyi otaq adıdır.");
  });
});
