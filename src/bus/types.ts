export interface EventEnvelope<T = unknown> {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  correlationId?: string;
  causationId?: string;
  version: string;
  data: T;
  metadata: Record<string, unknown>;
}

export type EventHandler<T = unknown> = (envelope: EventEnvelope<T>) => void | Promise<void>;

export interface EventFilter {
  type?: string | string[];
  source?: string;
  since?: string;
}

export interface Subscription {
  id: string;
  unsubscribe: () => void;
}
