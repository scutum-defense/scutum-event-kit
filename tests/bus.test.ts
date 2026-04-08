import { describe, it, expect, vi } from "vitest";
import { EventBus } from "../src/bus/event-bus";
import type { EventEnvelope } from "../src/bus/types";

function makeEnvelope(type: string, data: unknown = {}): EventEnvelope {
  return {
    id: `test-${Date.now()}`, type, source: "test", timestamp: new Date().toISOString(),
    version: "1.0", data, metadata: {},
  };
}

describe("EventBus", () => {
  it("should deliver events to subscribers", async () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe("incident.created", handler);
    await bus.publish(makeEnvelope("incident.created", { title: "Test" }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should not deliver events to wrong type", async () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe("incident.created", handler);
    await bus.publish(makeEnvelope("approval.granted"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("should deliver to global subscribers", async () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribeAll(handler);
    await bus.publish(makeEnvelope("incident.created"));
    await bus.publish(makeEnvelope("approval.granted"));
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("should support unsubscribe", async () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const sub = bus.subscribe("incident.created", handler);
    sub.unsubscribe();
    await bus.publish(makeEnvelope("incident.created"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("should maintain event log", async () => {
    const bus = new EventBus();
    await bus.publish(makeEnvelope("incident.created"));
    await bus.publish(makeEnvelope("approval.granted"));
    expect(bus.getEventCount()).toBe(2);
  });

  it("should query events by type", async () => {
    const bus = new EventBus();
    await bus.publish(makeEnvelope("incident.created"));
    await bus.publish(makeEnvelope("approval.granted"));
    await bus.publish(makeEnvelope("incident.created"));
    const results = bus.query({ type: "incident.created" });
    expect(results.length).toBe(2);
  });
});
