import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { NotificationEvent, NotificationProvider } from "./NotificationProvider";

describe("NotificationProvider", () => {
  it("shows success confirmations in an accessible toast and keeps them dismissed", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NotificationProvider>
          <NotificationEvent tone="success" message="Növbə rejiminin ayarları saxlanıldı." />
        </NotificationProvider>
      </MemoryRouter>,
    );

    const toast = await screen.findByRole("status", { name: "Əməliyyat tamamlandı" });
    expect(toast).toHaveTextContent("Növbə rejiminin ayarları saxlanıldı.");
    expect(toast).toHaveAttribute("aria-live", "polite");

    await user.click(screen.getByRole("button", { name: "Bildirişi bağla" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows only the latest notification when success and error states overlap", async () => {
    render(
      <MemoryRouter>
        <NotificationProvider>
          <NotificationEvent tone="success" message="Ayarlar saxlanıldı." />
          <NotificationEvent tone="error" message="Canlı növbə otağı üçün reset qaydası seçilməlidir." />
        </NotificationProvider>
      </MemoryRouter>,
    );

    const toast = await screen.findByRole("alert", { name: "Əməliyyat tamamlanmadı" });
    expect(toast).toHaveTextContent("Canlı növbə otağı üçün reset qaydası seçilməlidir.");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.queryByText("Ayarlar saxlanıldı.")).not.toBeInTheDocument();
  });

  it("renders a direct recovery action inside an error popup", async () => {
    render(
      <MemoryRouter>
        <NotificationProvider>
          <NotificationEvent
            tone="error"
            message="Aktiv abunəlik tələb olunur."
            action={{ label: "Abunəliyə keç", to: "/app/individual/7/subscription" }}
          />
        </NotificationProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("link", { name: "Abunəliyə keç" })).toHaveAttribute("href", "/app/individual/7/subscription");
  });
});
