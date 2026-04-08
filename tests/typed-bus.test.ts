import { describe, it, expect, vi } from "vitest";
import { TypedEventBus } from "../src/bus/typed-bus";

type TestEvents = {
  "incident.created": { id: string; title: string };
  "approval.granted": { actionId: string; actor: string };
};

describe("TypedEventBus", () => {
  it("should provide type-safe event emission and handling", async () => {
    const bus = new TypedEventBus<TestEvents>();
    const handler = vi.fn();
    bus.on("incident.created", handler);
    await bus.emit("incident.created", { id: "inc-001", title: "Test incident" });
    expect(handler).toHaveBeenCalledWith(
      { id: "inc-001", title: "Test incident" },
      expect.objectContaining({ type: "incident.created" })
    );
  });
});
