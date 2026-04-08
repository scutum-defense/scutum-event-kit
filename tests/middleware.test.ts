import { describe, it, expect, vi } from "vitest";
import { EventBus } from "../src/bus/event-bus";
import { ValidationMiddleware } from "../src/middleware/middleware";
import type { EventEnvelope } from "../src/bus/types";

function makeEnvelope(type: string): EventEnvelope {
  return { id: "test", type, source: "test", timestamp: new Date().toISOString(), version: "1.0", data: {}, metadata: {} };
}

describe("ValidationMiddleware", () => {
  it("should allow known event types", async () => {
    const bus = new EventBus();
    bus.use(new ValidationMiddleware(["incident.created"]));
    const handler = vi.fn();
    bus.subscribe("incident.created", handler);
    await bus.publish(makeEnvelope("incident.created"));
    expect(handler).toHaveBeenCalled();
  });

  it("should reject unknown event types", async () => {
    const bus = new EventBus();
    bus.use(new ValidationMiddleware(["incident.created"]));
    const handler = vi.fn();
    bus.subscribe("unknown.event", handler);
    await bus.publish(makeEnvelope("unknown.event"));
    expect(handler).not.toHaveBeenCalled();
  });
});
