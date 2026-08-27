import { describe, expect, it } from "vitest";

import { ApiError } from "../../../shared/api/httpClient";
import { roomErrorNavigation } from "./roomErrorNavigation";

const individualContext = {
  roomId: 12,
  businessId: null,
  individualWorkspaceId: 7,
  setupMode: true,
};

describe("roomErrorNavigation", () => {
  it("sends subscription errors to the individual subscription page", () => {
    const error = new ApiError(402, "Aktiv abunəlik tələb olunur.", { code: "REQUEST_REJECTED" });

    expect(roomErrorNavigation(error, individualContext)).toEqual({
      label: "Abunəliyə keç",
      to: "/app/individual/7/subscription",
    });
  });

  it("sends business subscription errors to the business subscription page", () => {
    const error = new ApiError(402, "Abunəlik aktiv deyil.", { code: "REQUEST_REJECTED" });

    expect(roomErrorNavigation(error, { ...individualContext, businessId: 9, individualWorkspaceId: null })).toEqual({
      label: "Abunəliyə keç",
      to: "/app/businesses/9/subscription",
    });
  });

  it("links missing setup requirements to their wizard steps", () => {
    expect(roomErrorNavigation(new Error("Ən azı bir aktiv otaq sahibi olmalıdır."), individualContext)).toEqual({
      label: "Otaq sahiblərinə keç",
      to: "/app/rooms/12/settings?step=owners",
    });
    expect(roomErrorNavigation(new Error("Həftəlik iş cədvəli yaradılmalıdır."), individualContext)).toEqual({
      label: "İş qrafikinə keç",
      to: "/app/rooms/12/settings?step=schedule",
    });
  });

  it("links a missing live queue reset policy to the exact setting", () => {
    expect(roomErrorNavigation(new Error("Canlı növbə otağı üçün reset qaydası seçilməlidir."), {
      ...individualContext,
      setupMode: false,
    })).toEqual({
      label: "Sıfırlama ayarına keç",
      to: "/app/rooms/12/settings?section=overview#live-queue-reset-policy",
    });
  });

  it("does not invent a navigation target for an unrelated error", () => {
    expect(roomErrorNavigation(new Error("Daxili server xətası baş verdi."), individualContext)).toBeNull();
  });
});
