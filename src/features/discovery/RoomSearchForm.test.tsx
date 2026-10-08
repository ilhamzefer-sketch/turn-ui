import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";

import { RoomSearchForm } from "./RoomSearchForm";

it("preserves a shared category filter when its options load later", () => {
  const { rerender } = render(<MemoryRouter><RoomSearchForm initialValues={{ categoryId: 2 }} /></MemoryRouter>);
  rerender(<MemoryRouter><RoomSearchForm initialValues={{ categoryId: 2 }} categories={[{ id: 2, code: "BEAUTY", name: "Gözəllik" }]} /></MemoryRouter>);
  expect(screen.getByRole("combobox", { name: "Kateqoriya" })).toHaveValue("2");
});
