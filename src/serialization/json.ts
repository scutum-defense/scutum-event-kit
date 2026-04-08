import type { EventEnvelope } from "../bus/types";

export interface Serializer {
  serialize(envelope: EventEnvelope): string;
  deserialize(data: string): EventEnvelope;
}

export class JsonSerializer implements Serializer {
  serialize(envelope: EventEnvelope): string {
    return JSON.stringify(envelope);
  }

  deserialize(data: string): EventEnvelope {
    return JSON.parse(data) as EventEnvelope;
  }
}
