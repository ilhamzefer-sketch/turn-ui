import { describe, expect, it } from "vitest";

import { workspaceHomePath } from "./workspaceLabels";

describe("workspaceHomePath", () => {
  it("opens a room through the status-aware entry route", () => {
    expect(workspaceHomePath({ type: "ROOM", contextId: 42, name: "Qəbul otağı", role: "OWNER" }))
      .toBe("/app/rooms/42");
  });
});
