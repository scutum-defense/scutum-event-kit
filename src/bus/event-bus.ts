import type { EventEnvelope, EventHandler, EventFilter, Subscription } from "./types";
import type { Middleware } from "../middleware/middleware";
import { randomUUID } from "crypto";

export class EventBus {
  private handlers: Map<string, Map<string, EventHandler>> = new Map();
  private globalHandlers: Map<string, EventHandler> = new Map();
  private middleware: Middleware[] = [];
  private eventLog: EventEnvelope[] = [];

  use(mw: Middleware): void {
    this.middleware.push(mw);
  }

  subscribe(eventType: string, handler: EventHandler): Subscription {
    const subId = randomUUID();
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Map());
    }
    this.handlers.get(eventType)!.set(subId, handler);
    return {
      id: subId,
      unsubscribe: () => this.handlers.get(eventType)?.delete(subId),
    };
  }

  subscribeAll(handler: EventHandler): Subscription {
    const subId = randomUUID();
    this.globalHandlers.set(subId, handler);
    return {
      id: subId,
      unsubscribe: () => this.globalHandlers.delete(subId),
    };
  }

  async publish(envelope: EventEnvelope): Promise<void> {
    for (const mw of this.middleware) {
      const result = await mw.process(envelope);
      if (!result) return; // middleware rejected
    }

    this.eventLog.push(envelope);

    const typeHandlers = this.handlers.get(envelope.type);
    if (typeHandlers) {
      for (const [, handler] of typeHandlers) {
        await handler(envelope);
      }
    }

    for (const [, handler] of this.globalHandlers) {
      await handler(envelope);
    }
  }

  query(filter: EventFilter): EventEnvelope[] {
    let results = [...this.eventLog];
    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      results = results.filter((e) => types.includes(e.type));
    }
    if (filter.source) {
      results = results.filter((e) => e.source === filter.source);
    }
    if (filter.since) {
      const since = new Date(filter.since).getTime();
      results = results.filter((e) => new Date(e.timestamp).getTime() >= since);
    }
    return results;
  }

  getEventCount(): number {
    return this.eventLog.length;
  }

  clear(): void {
    this.eventLog = [];
  }
}
