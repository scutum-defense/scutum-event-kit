import { EventBus } from "./event-bus";
import type { EventEnvelope, EventHandler, Subscription } from "./types";
import { randomUUID } from "crypto";

export class TypedEventBus<EventMap extends Record<string, unknown>> {
  private bus = new EventBus();

  emit<K extends keyof EventMap & string>(
    type: K,
    data: EventMap[K],
    options?: { source?: string; correlationId?: string }
  ): Promise<void> {
    const envelope: EventEnvelope<EventMap[K]> = {
      id: randomUUID(),
      type,
      source: options?.source ?? "system",
      timestamp: new Date().toISOString(),
      correlationId: options?.correlationId,
      version: "1.0",
      data,
      metadata: {},
    };
    return this.bus.publish(envelope);
  }

  on<K extends keyof EventMap & string>(
    type: K,
    handler: (data: EventMap[K], envelope: EventEnvelope<EventMap[K]>) => void | Promise<void>
  ): Subscription {
    return this.bus.subscribe(type, (env) => handler(env.data as EventMap[K], env as EventEnvelope<EventMap[K]>));
  }
}
