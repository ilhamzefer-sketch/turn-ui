import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { publicApi } from "../../shared/api/publicApi";
import { ExplorePage } from "./ExplorePage";

vi.mock("../../shared/api/publicApi", () => ({
  publicApi: {
    categories: vi.fn(),
    rooms: vi.fn(),
  },
}));

function renderPage(entry = "/rooms") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <ExplorePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ExplorePage", () => {
  beforeEach(() => {
    vi.mocked(publicApi.categories).mockResolvedValue([{ id: 2, code: "BEAUTY", name: "Gözəllik" }]);
    vi.mocked(publicApi.rooms).mockResolvedValue({
      items: [
        {
          id: 7,
          name: "Leyla ilə saç baxımı",
          description: "Saç kəsimi və gündəlik baxım.",
          reservationMode: "PLANNED_BOOKING",
          providerName: "Sahil Studio",
          branchName: "Mərkəz filialı",
          category: { id: 2, code: "BEAUTY", name: "Gözəllik" },
          customSubcategory: null,
          serviceNames: ["Saç kəsimi"],
          location: { address: "Nizami küçəsi 10", city: "Bakı", district: "Səbail", latitude: null, longitude: null },
          averageRating: 4.8,
          ratingCount: 12,
        },
      ],
      page: 0,
      size: 12,
      totalElements: 1,
      totalPages: 1,
    });
  });

  it("renders shareable filters and real room metadata", async () => {
    renderPage("/rooms?q=sa%C3%A7&mode=PLANNED_BOOKING");

    expect(await screen.findByRole("heading", { name: "Leyla ilə saç baxımı" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("saç")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Planlı rezervasiya" })).toBeChecked();
    expect(screen.getByText("Sahil Studio")).toBeInTheDocument();
    expect(screen.getByText(/Səbail · Bakı/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Profili aç/ })).toHaveAttribute("href", "/rooms/7");
  });

  it("explains an empty result and offers recovery", async () => {
    vi.mocked(publicApi.rooms).mockResolvedValue({ items: [], page: 0, size: 12, totalElements: 0, totalPages: 0 });
    renderPage("/rooms?q=olmayan");

    expect(await screen.findByRole("heading", { name: "Bu filterlərə uyğun otaq tapılmadı" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bütün otaqları göstər" })).toHaveAttribute("href", "/rooms");
  });
});
