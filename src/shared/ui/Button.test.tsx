import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("uses a safe default type", () => {
    render(<Button>Yadda saxla</Button>);

    expect(screen.getByRole("button", { name: "Yadda saxla" })).toHaveAttribute("type", "button");
  });

  it("announces and blocks its loading state", () => {
    render(<Button loading>Yadda saxla</Button>);

    const button = screen.getByRole("button", { name: "Gözləyin…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
