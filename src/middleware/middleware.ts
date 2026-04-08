import type { EventEnvelope } from "../bus/types";

export interface Middleware {
  process(envelope: EventEnvelope): Promise<EventEnvelope | null>;
}

export class LoggingMiddleware implements Middleware {
  async process(envelope: EventEnvelope): Promise<EventEnvelope> {
    console.log(`[event] ${envelope.type} from ${envelope.source} at ${envelope.timestamp}`);
    return envelope;
  }
}

export class ValidationMiddleware implements Middleware {
  private allowedTypes: Set<string>;

  constructor(allowedTypes: string[]) {
    this.allowedTypes = new Set(allowedTypes);
  }

  async process(envelope: EventEnvelope): Promise<EventEnvelope | null> {
    if (!this.allowedTypes.has(envelope.type)) {
      console.warn(`[event] Rejected unknown event type: ${envelope.type}`);
      return null;
    }
    if (!envelope.id || !envelope.timestamp) {
      console.warn(`[event] Rejected malformed event: missing id or timestamp`);
      return null;
    }
    return envelope;
  }
}
