import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { AnalyticsPage } from "./AnalyticsPage";
import { AdminPlatformLayout } from "../layouts/AdminPlatformLayout";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { ApiError } from "../../shared/api/httpClient";

vi.mock("../../shared/meta/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("../../shared/notifications/NotificationProvider", () => ({ NotificationEvent: () => null }));
vi.mock("../../shared/api/stepSixApi", () => ({ stepSixApi: { businessAnalytics: vi.fn(), downloadBusinessAnalytics: vi.fn(), adminOverview: vi.fn() } }));

function mount(element: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/business/10"]}><Routes><Route path="/business/:businessId" element={element} /></Routes></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => vi.resetAllMocks());

it("shows an export failure and replaces invalid-range loading with validation", async () => {
  const user = userEvent.setup();
  vi.mocked(stepSixApi.businessAnalytics).mockResolvedValue({ rooms: [], busiestDay: "WEDNESDAY", totalPeople: 42 } as unknown as Awaited<ReturnType<typeof stepSixApi.businessAnalytics>>);
  vi.mocked(stepSixApi.downloadBusinessAnalytics).mockRejectedValue(new Error("Excel yüklənmədi"));
  mount(<AnalyticsPage scope="business" />);
  await screen.findByText("Çərşənbə");
  await user.click(screen.getByRole("button", { name: "Excel hesabatını endir" }));
  expect(await screen.findByText("Excel yüklənmədi")).toBeInTheDocument();
  await user.clear(screen.getByLabelText("Son tarix"));
  expect(screen.getByText("Başlanğıc və son tarixi düzgün daxil edin.")).toBeInTheDocument();
  expect(screen.queryByText("Hesabat hazırlanır…")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Excel hesabatını endir" })).toBeDisabled();
});

it("offers retry for server errors instead of sending the admin to login", async () => {
  const user = userEvent.setup();
  vi.mocked(stepSixApi.adminOverview).mockRejectedValue(new ApiError(500, "Server xətası", null));
  mount(<AdminPlatformLayout />);
  await screen.findByRole("heading", { name: "Platform məlumatları yüklənmədi" });
  expect(screen.queryByText("Admin girişinə keç")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Yenidən cəhd et" }));
  expect(stepSixApi.adminOverview).toHaveBeenCalledTimes(2);
});

it("retains the login action for an expired admin session", async () => {
  vi.mocked(stepSixApi.adminOverview).mockRejectedValue(new ApiError(401, "Sessiya bitib", null));
  mount(<AdminPlatformLayout />);
  expect(await screen.findByRole("link", { name: "Admin girişinə keç" })).toHaveAttribute("href", "/platform/login");
});
