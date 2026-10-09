import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ManagedRoom, WeeklyAvailabilityRule } from "../../../shared/api/contracts";
import { managementApi } from "../../../shared/api/managementApi";
import { RoomScheduleSection } from "./RoomScheduleSection";

vi.mock("../../../shared/api/managementApi", () => ({ managementApi: {
  weeklyAvailability: vi.fn(), availabilityExceptions: vi.fn(), replaceWeeklyAvailability: vi.fn(),
  updateRoomConfiguration: vi.fn(), saveRoomSetupSchedule: vi.fn(),
  createAvailabilityException: vi.fn(), deleteAvailabilityException: vi.fn(),
} }));

const room: ManagedRoom = {
  id: 42,
  businessId: null,
  branchId: null,
  individualWorkspaceId: 7,
  createdByUserId: 3,
  name: "Əsas qəbul",
  roomNumberOrCode: "A147",
  description: "Müştəri qəbulu",
  notes: null,
  timezone: "Asia/Baku",
  reservationMode: "LIVE_QUEUE",
  defaultSlotDurationMinutes: 15,
  visibility: "UNLISTED",
  personalPublicAddress: null,
  personalLatitude: null,
  personalLongitude: null,
  appointmentBufferMinutes: 0,
  bookingWindowDays: 30,
  minimumAdvanceMinutes: 0,
  cancellationCutoffMinutes: 0,
  liveQueueResetPolicy: "DAILY_AT_TIME",
  liveQueueResetLocalTime: "00:00:00",
  liveQueueResetIntervalMinutes: null,
  liveQueueMaxParticipants: 100,
  liveQueueAcceptingNewEntries: true,
  status: "DRAFT",
  createdAt: "2026-09-01T10:00:00",
  archivedAt: null,
};

const rules: WeeklyAvailabilityRule[] = [{ id: 1, roomId: room.id, dayOfWeek: "MONDAY", startTime: "09:00:00", endTime: "18:00:00", active: true }];
function renderSection(client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } }), onContinue = vi.fn()) {
  return { client, onContinue, ...render(<QueryClientProvider client={client}><RoomScheduleSection room={room} setupNavigation={{ onBack: vi.fn(), onContinue }} /></QueryClientProvider>) };
}

describe("RoomScheduleSection", () => {
  beforeEach(() => {
    vi.clearAllMocks(); sessionStorage.clear();
    vi.mocked(managementApi.weeklyAvailability).mockResolvedValue(rules);
    vi.mocked(managementApi.availabilityExceptions).mockResolvedValue([]);
  });
  it("retains the input element and focus from the first keyboard edit", async () => {
    const user = userEvent.setup(); renderSection();
    const start = await screen.findByRole("textbox", { name: "Başlayır" });
    await user.click(start); await user.keyboard("{Control>}a{/Control}{Backspace}0800");
    expect(start).toHaveValue("08:00"); expect(start).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Başlayır" })).toBe(start);
  });
  it("retains hours and configuration drafts after leaving and reopening the stage", async () => {
    const user = userEvent.setup(); const first = renderSection();
    const start = await screen.findByRole("textbox", { name: "Başlayır" });
    await user.clear(start); await user.type(start, "0800");
    const limit = screen.getByRole("spinbutton", { name: "İştirakçı limiti (boş = limitsiz)" });
    await user.clear(limit); await user.type(limit, "80");
    first.unmount(); renderSection(first.client);
    expect(await screen.findByRole("textbox", { name: "Başlayır" })).toHaveValue("08:00");
    expect(screen.getByRole("spinbutton", { name: "İştirakçı limiti (boş = limitsiz)" })).toHaveValue(80);
    expect(screen.getByRole("button", { name: "Saxla və davam et" })).toBeEnabled();
  });
  it("does not overwrite edited hours when the schedule query refreshes", async () => {
    const user = userEvent.setup(); const { client } = renderSection();
    const start = await screen.findByRole("textbox", { name: "Başlayır" });
    await user.clear(start); await user.type(start, "0800");
    act(() => { client.setQueryData(["management-room-schedule", room.id], [{ ...rules[0], startTime: "10:00:00" }]); });
    expect(start).toHaveValue("08:00"); expect(start).toHaveFocus();
  });
  it("continues without requests when hours and configuration are unchanged", async () => {
    const user = userEvent.setup(); const { onContinue } = renderSection();
    await screen.findByRole("textbox", { name: "Başlayır" });
    await user.click(screen.getByRole("button", { name: "Davam et" }));
    await waitFor(() => expect(onContinue).toHaveBeenCalledOnce());
    expect(managementApi.saveRoomSetupSchedule).not.toHaveBeenCalled();
    expect(managementApi.updateRoomConfiguration).not.toHaveBeenCalled();
  });
  it("saves changed data atomically, locks navigation and retains drafts after failure", async () => {
    const user = userEvent.setup(); const { client, onContinue } = renderSection();
    const start = await screen.findByRole("textbox", { name: "Başlayır" });
    await user.clear(start); await user.type(start, "0800");
    let rejectSave: (reason: Error) => void = () => {};
    vi.mocked(managementApi.saveRoomSetupSchedule).mockImplementation(() => new Promise((_resolve, reject) => { rejectSave = reject; }));
    await user.click(screen.getByRole("button", { name: "Saxla və davam et" }));
    expect(screen.getByRole("button", { name: "Geri" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Dəyişiklikləri saxla" })).toBeDisabled();
    expect(start).toBeDisabled();
    expect(managementApi.saveRoomSetupSchedule).toHaveBeenCalledWith(room.id, { weeklyAvailability: [{dayOfWeek: "MONDAY", startTime: "08:00", endTime: "18:00", active: true}], configuration: null, expectedUpdatedAt: null });
    await act(async () => rejectSave(new Error("Server unavailable")));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server unavailable");
    expect(start).toHaveValue("08:00"); expect(onContinue).not.toHaveBeenCalled();
    expect(client.getQueryData(["management-room-schedule", room.id])).toEqual(rules);
  });
  it("uses the atomic response without refetching room or opening a success modal", async () => {
    const user = userEvent.setup(); const { client, onContinue } = renderSection();
    const start = await screen.findByRole("textbox", { name: "Başlayır" });
    await user.clear(start); await user.type(start, "0800");
    const saved = [{ ...rules[0], startTime: "08:00:00" }];
    vi.mocked(managementApi.saveRoomSetupSchedule).mockResolvedValue({ room, weeklyAvailability: saved });
    await user.click(screen.getByRole("button", { name: "Saxla və davam et" }));
    await waitFor(() => expect(onContinue).toHaveBeenCalledOnce());
    expect(client.getQueryData(["management-room-schedule", room.id])).toEqual(saved);
    expect(client.getQueryData(["management-room", room.id])).toEqual(room);
    expect(sessionStorage.getItem(`novbetime.room-schedule-draft.v1:${room.id}`)).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("keeps the original version when a background room refresh arrives during dirty editing", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } });
    const navigation = { onBack: vi.fn(), onContinue: vi.fn() };
    const initialRoom = { ...room, updatedAt: "2026-10-09T08:00:00" };
    const { rerender } = render(<QueryClientProvider client={client}><RoomScheduleSection room={initialRoom} setupNavigation={navigation} /></QueryClientProvider>);
    const start = await screen.findByRole("textbox", { name: "Başlayır" });
    await user.clear(start); await user.type(start, "0800");
    rerender(<QueryClientProvider client={client}><RoomScheduleSection room={{...initialRoom, updatedAt:"2026-10-09T09:00:00"}} setupNavigation={navigation} /></QueryClientProvider>);
    vi.mocked(managementApi.saveRoomSetupSchedule).mockRejectedValue(new Error("Conflict"));
    await user.click(screen.getByRole("button", { name: "Saxla və davam et" }));
    await waitFor(() => expect(managementApi.saveRoomSetupSchedule).toHaveBeenCalledWith(room.id, expect.objectContaining({ expectedUpdatedAt: "2026-10-09T08:00:00" })));
    expect(start).toHaveValue("08:00");
  });
  it("saves weekly hours through the atomic endpoint without a blocking success dialog", async () => {
    const user = userEvent.setup(); renderSection();
    const start = await screen.findByRole("textbox", { name: "Başlayır" });
    await user.clear(start); await user.type(start, "0800");
    vi.mocked(managementApi.saveRoomSetupSchedule).mockResolvedValue({room, weeklyAvailability: [{...rules[0],startTime:"08:00:00"}]});
    await user.click(screen.getByRole("button", {name:"Dəyişiklikləri saxla"}));
    expect(await screen.findByText("Həftəlik iş qrafiki saxlanıldı.")).toHaveAttribute("role","status");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", {name:"Dəyişiklikləri saxla"})).toBeDisabled();
    expect(managementApi.replaceWeeklyAvailability).not.toHaveBeenCalled();
  });

});
