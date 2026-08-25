import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionInfo } from "../api/contracts";
import { SessionLifecycleManager } from "./SessionLifecycleManager";

const sessionMocks = vi.hoisted(() => ({
  session: vi.fn(),
  activity: vi.fn(),
}));

vi.mock("../api/authApi", () => ({
  authApi: {
    session: sessionMocks.session,
    activity: sessionMocks.activity,
  },
}));

describe("SessionLifecycleManager", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-08-25T06:00:00.000Z"));
    sessionMocks.session.mockReset();
    sessionMocks.activity.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("warns before inactivity expiry and extends only after user confirmation", async () => {
    sessionMocks.session.mockResolvedValue(sessionInfo(90));
    sessionMocks.activity.mockResolvedValue(sessionInfo(1_800));

    render(<SessionLifecycleManager status="authenticated" onExpired={vi.fn()} />);

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sessiyanı davam etdir" }));

    await waitFor(() => expect(sessionMocks.activity).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("does not count background time as activity and expires at the server deadline", async () => {
    const onExpired = vi.fn().mockResolvedValue(undefined);
    sessionMocks.session.mockResolvedValue(sessionInfo(2));

    render(<SessionLifecycleManager status="authenticated" onExpired={onExpired} />);
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_100);
    });

    expect(sessionMocks.activity).not.toHaveBeenCalled();
    expect(onExpired).toHaveBeenCalledTimes(1);
  });
});

function sessionInfo(idleSeconds: number): SessionInfo {
  const now = Date.now();
  return {
    id: 10,
    serverTime: new Date(now).toISOString(),
    lastActivityAt: new Date(now).toISOString(),
    idleExpiresAt: new Date(now + idleSeconds * 1_000).toISOString(),
    absoluteExpiresAt: new Date(now + 3_600_000).toISOString(),
  };
}
