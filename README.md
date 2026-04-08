```
  ____              _                       _____                 _     _  ___ _
 / ___|  ___ _   _| |_ _   _ _ __ ___     | ____|_   _____ _ __ | |_  | |/ (_) |_
 \___ \ / __| | | | __| | | | '_ ` _ \    |  _| \ \ / / _ \ '_ \| __| | ' /| | __|
  ___) | (__| |_| | |_| |_| | | | | | |   | |___ \ V /  __/ | | | |_  | . \| | |_
 |____/ \___|\__,_|\__|\__,_|_| |_| |_|   |_____| \_/ \___|_| |_|\__| |_|\_\_|\__|

@scutum/event-kit
```

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="Apache 2.0"></a>
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Event_Types-12-green" alt="12 Event Types">
  <img src="https://img.shields.io/badge/Middleware-2_built--in-orange" alt="Middleware">
  <img src="https://img.shields.io/badge/Version-0.1.0-purple" alt="Version 0.1.0">
</p>

<p align="center">
  <strong>Type-safe event bus and message protocol library for the Scutum Command Platform.</strong>
</p>

---

## Overview

**@scutum/event-kit** is the transport layer for all Scutum platform events. It provides a lightweight, in-process event bus with full TypeScript type safety, a middleware pipeline for validation and logging, and a versioned protocol definition for the 12 core event types used across the Scutum Command Platform.

This library is designed to be the single source of truth for event contracts between platform services. Whether events flow through the in-process bus during development or through an external message broker in production, the envelope schema and type definitions remain consistent.

---

## Architecture

```
+------------------+     +------------------+     +------------------+
|   Publisher A    |     |   Publisher B    |     |   Publisher C    |
| (Incident Svc)  |     | (Sensor Svc)    |     | (Approval Svc)  |
+--------+---------+     +--------+---------+     +--------+---------+
         |                         |                        |
         v                         v                        v
+--------+-------------------------+------------------------+---------+
|                        EventEnvelope                                |
|  { id, type, source, timestamp, correlationId, version, data }      |
+--------+-------------------------+------------------------+---------+
         |                         |                        |
         v                         v                        v
+--------+-------------------------+------------------------+---------+
|                      Middleware Pipeline                             |
|  [ValidationMiddleware] --> [LoggingMiddleware] --> [Custom...]      |
+--------+-------------------------+------------------------+---------+
         |                         |                        |
         v                         v                        v
+--------+-------------------------+------------------------+---------+
|                         EventBus Core                               |
|  subscribe() | subscribeAll() | publish() | query()                 |
+--------+-------------------------+------------------------+---------+
         |                         |                        |
         v                         v                        v
+--------+---------+     +--------+---------+     +--------+---------+
|  Subscriber X   |     |  Subscriber Y   |     |  Subscriber Z   |
| (Audit Logger)  |     | (Notification)  |     | (Digital Twin)  |
+------------------+     +------------------+     +------------------+
```

### Design Principles

1. **Type Safety First** -- The `TypedEventBus` enforces compile-time type checking for event data, ensuring publishers and subscribers agree on the shape of every event.

2. **Envelope Standard** -- Every event is wrapped in an `EventEnvelope` that carries metadata (id, type, source, timestamp, correlationId, causationId, version) alongside the payload.

3. **Middleware Pipeline** -- Events pass through a configurable middleware chain before reaching subscribers. Middleware can validate, transform, log, or reject events.

4. **Protocol Versioning** -- The Scutum Event Protocol defines all valid event types with semantic versioning, enabling safe evolution of the event contract.

5. **Zero Dependencies** -- The core library has no runtime dependencies beyond Node.js built-ins.

---

## Installation

```bash
npm install @scutum/event-kit
```

---

## Quick Start

### Basic EventBus

```typescript
import { EventBus } from "@scutum/event-kit";

const bus = new EventBus();

// Subscribe to a specific event type
bus.subscribe("incident.created", (envelope) => {
  console.log(`New incident: ${envelope.data.title}`);
});

// Publish an event
await bus.publish({
  id: "evt-001",
  type: "incident.created",
  source: "incident-service",
  timestamp: new Date().toISOString(),
  version: "1.0",
  data: { title: "Perimeter breach detected", severity: "critical" },
  metadata: {},
});
```

### TypedEventBus (Recommended)

```typescript
import { TypedEventBus } from "@scutum/event-kit";

// Define your event map
type PlatformEvents = {
  "incident.created": { id: string; title: string; severity: string };
  "approval.granted": { actionId: string; actor: string };
  "audit.recorded": { chainId: string; sequenceNumber: number };
};

const bus = new TypedEventBus<PlatformEvents>();

// Type-safe handler -- TypeScript knows `data` is { id, title, severity }
bus.on("incident.created", (data, envelope) => {
  console.log(`[${data.severity}] ${data.title}`);
});

// Type-safe emission -- TypeScript enforces the correct payload shape
await bus.emit("incident.created", {
  id: "inc-001",
  title: "Suspicious drone near port perimeter",
  severity: "high",
});
```

---

## EventEnvelope Schema

Every event flowing through the system is wrapped in an `EventEnvelope`:

```typescript
interface EventEnvelope<T = unknown> {
  /** Unique event identifier (UUID v4) */
  id: string;

  /** Event type from the Scutum Event Protocol */
  type: string;

  /** Service or component that generated the event */
  source: string;

  /** ISO 8601 timestamp of when the event was created */
  timestamp: string;

  /** Optional correlation ID for request tracing */
  correlationId?: string;

  /** Optional causation ID linking to the triggering event */
  causationId?: string;

  /** Protocol version string */
  version: string;

  /** The event payload, typed via generics */
  data: T;

  /** Arbitrary metadata for extensibility */
  metadata: Record<string, unknown>;
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Globally unique event identifier. Generated via `crypto.randomUUID()`. |
| `type` | `string` | Yes | Dot-notation event type from the protocol (e.g., `incident.created`). |
| `source` | `string` | Yes | The originating service or component name. |
| `timestamp` | `string` | Yes | ISO 8601 timestamp with timezone. |
| `correlationId` | `string` | No | Tracks related events across a request chain. |
| `causationId` | `string` | No | Links to the specific event that caused this one. |
| `version` | `string` | Yes | Protocol version for schema evolution. |
| `data` | `T` | Yes | The event payload. Shape depends on `type`. |
| `metadata` | `Record<string, unknown>` | Yes | Extensible metadata bag for custom fields. |

---

## TypedEventBus API

The `TypedEventBus<EventMap>` provides compile-time type safety by parameterizing the bus with an event map type.

### `emit<K>(type, data, options?)`

Publish a type-safe event.

```typescript
await bus.emit("incident.created", {
  id: "inc-001",
  title: "Perimeter alert",
  severity: "high",
});

// With options
await bus.emit("incident.created", data, {
  source: "sensor-gateway",
  correlationId: "corr-abc-123",
});
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `K extends keyof EventMap` | The event type key |
| `data` | `EventMap[K]` | The typed event payload |
| `options.source` | `string` | Override the default source ("system") |
| `options.correlationId` | `string` | Set a correlation ID for tracing |

### `on<K>(type, handler)`

Subscribe to a specific event type with a type-safe handler.

```typescript
const sub = bus.on("approval.granted", (data, envelope) => {
  // data is typed as { actionId: string; actor: string }
  console.log(`Action ${data.actionId} approved by ${data.actor}`);
});

// Later: unsubscribe
sub.unsubscribe();
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `K extends keyof EventMap` | The event type to listen for |
| `handler` | `(data, envelope) => void` | Callback receiving typed data and full envelope |

**Returns:** `Subscription` with an `unsubscribe()` method.

---

## Middleware Pipeline

Middleware components intercept events before they reach subscribers. Each middleware receives the event envelope and can modify it, pass it through, or reject it by returning `null`.

### Interface

```typescript
interface Middleware {
  process(envelope: EventEnvelope): Promise<EventEnvelope | null>;
}
```

### Built-in Middleware

#### ValidationMiddleware

Rejects events with unknown types or missing required fields.

```typescript
import { EventBus, ValidationMiddleware } from "@scutum/event-kit";
import { SCUTUM_PROTOCOL } from "@scutum/event-kit/protocols";

const bus = new EventBus();
bus.use(new ValidationMiddleware(SCUTUM_PROTOCOL.eventTypes));

// This will be rejected -- "unknown.event" is not in the protocol
await bus.publish(makeEnvelope("unknown.event", {}));
```

#### LoggingMiddleware

Logs every event that passes through the pipeline.

```typescript
import { EventBus, LoggingMiddleware } from "@scutum/event-kit";

const bus = new EventBus();
bus.use(new LoggingMiddleware());

// Output: [event] incident.created from sensor-gateway at 2026-04-01T12:00:00Z
await bus.publish(envelope);
```

### Custom Middleware

```typescript
import type { Middleware } from "@scutum/event-kit";
import type { EventEnvelope } from "@scutum/event-kit";

class ClassificationMiddleware implements Middleware {
  async process(envelope: EventEnvelope): Promise<EventEnvelope | null> {
    // Inject classification metadata
    return {
      ...envelope,
      metadata: {
        ...envelope.metadata,
        classification: "restricted",
        processedAt: new Date().toISOString(),
      },
    };
  }
}

const bus = new EventBus();
bus.use(new ClassificationMiddleware());
```

### Pipeline Ordering

Middleware executes in the order it is registered via `bus.use()`. If any middleware returns `null`, the event is dropped and subsequent middleware and subscribers are not invoked.

```typescript
bus.use(new ValidationMiddleware(allowedTypes));   // 1st: validate
bus.use(new ClassificationMiddleware());           // 2nd: enrich
bus.use(new LoggingMiddleware());                  // 3rd: log
```

---

## Scutum Event Protocol

The protocol defines all valid event types for the Scutum Command Platform. Version: **1.0.0**.

### Event Types

| Event Type | Domain | Description |
|------------|--------|-------------|
| `incident.created` | Incidents | A new incident has been detected or reported |
| `incident.updated` | Incidents | An existing incident has been modified |
| `incident.closed` | Incidents | An incident has been resolved and closed |
| `recommendation.generated` | COA Engine | AI-generated courses of action are available |
| `recommendation.ranked` | COA Engine | Recommendations have been ranked by priority |
| `approval.requested` | Approvals | An action requires operator approval |
| `approval.granted` | Approvals | An operator has approved an action |
| `approval.rejected` | Approvals | An operator has rejected an action |
| `audit.recorded` | Audit Trail | An immutable audit record has been written |
| `sensor.reading` | Sensors | A new sensor data reading has arrived |
| `twin.validated` | Digital Twin | A digital twin simulation has been validated |
| `policy.evaluated` | Policy Engine | A policy rule has been evaluated against data |

### Protocol Definition

```typescript
import { SCUTUM_PROTOCOL } from "@scutum/event-kit";

console.log(SCUTUM_PROTOCOL.name);       // "scutum-event-protocol"
console.log(SCUTUM_PROTOCOL.version);    // { major: 1, minor: 0, patch: 0 }
console.log(SCUTUM_PROTOCOL.eventTypes); // Array of 12 event type strings
```

---

## Event Querying and Filtering

The `EventBus` maintains an in-memory event log that can be queried.

### Query by Type

```typescript
const incidents = bus.query({ type: "incident.created" });
```

### Query by Multiple Types

```typescript
const approvalEvents = bus.query({
  type: ["approval.requested", "approval.granted", "approval.rejected"],
});
```

### Query by Source

```typescript
const sensorEvents = bus.query({ source: "sensor-gateway" });
```

### Query by Time Range

```typescript
const recentEvents = bus.query({
  since: "2026-04-01T00:00:00Z",
});
```

### Combined Filters

```typescript
const recentIncidents = bus.query({
  type: "incident.created",
  source: "incident-service",
  since: "2026-04-01T12:00:00Z",
});
```

### Event Log Management

```typescript
// Get total event count
const count = bus.getEventCount();

// Clear the event log
bus.clear();
```

---

## Serialization

The `JsonSerializer` provides JSON serialization for event envelopes, useful when transmitting events over the wire.

```typescript
import { JsonSerializer } from "@scutum/event-kit";

const serializer = new JsonSerializer();

// Serialize to JSON string
const json = serializer.serialize(envelope);

// Deserialize from JSON string
const restored = serializer.deserialize(json);
```

### Custom Serializers

Implement the `Serializer` interface for custom formats:

```typescript
import type { Serializer } from "@scutum/event-kit";

class MsgPackSerializer implements Serializer {
  serialize(envelope: EventEnvelope): string {
    // Custom serialization logic
  }
  deserialize(data: string): EventEnvelope {
    // Custom deserialization logic
  }
}
```

---

## Global Subscribers

Subscribe to all events regardless of type:

```typescript
const bus = new EventBus();

// Receives every event published to the bus
const sub = bus.subscribeAll((envelope) => {
  console.log(`[ALL] ${envelope.type}: ${JSON.stringify(envelope.data)}`);
});

// Unsubscribe when done
sub.unsubscribe();
```

---

## Project Structure

```
scutum-event-kit/
  src/
    index.ts                    # Public API exports
    bus/
      types.ts                  # EventEnvelope, EventHandler, Subscription
      event-bus.ts              # Core EventBus implementation
      typed-bus.ts              # TypedEventBus with generics
    protocols/
      types.ts                  # EventProtocol, SCUTUM_PROTOCOL
    serialization/
      json.ts                   # JsonSerializer
    middleware/
      middleware.ts             # Middleware interface, built-in middleware
  tests/
    bus.test.ts                 # EventBus unit tests
    typed-bus.test.ts           # TypedEventBus unit tests
    middleware.test.ts          # Middleware unit tests
  examples/
    typed-events.ts             # Full typed event example
  docs/                         # Additional documentation
  .github/
    workflows/                  # CI/CD pipelines
  package.json
  tsconfig.json
  CODEOWNERS
  CHANGELOG.md
  LICENSE
  README.md
```

---

## Test Suite

The test suite uses [Vitest](https://vitest.dev/) and covers the core bus, typed bus, and middleware functionality.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check without emitting
npm run typecheck
```

### Test Coverage

| Module | Tests | Coverage |
|--------|-------|----------|
| `EventBus` | 6 tests | subscribe, publish, unsubscribe, event log, query |
| `TypedEventBus` | 1 test | type-safe emission and handling |
| `ValidationMiddleware` | 2 tests | allow known types, reject unknown types |

---

<details>
<summary><strong>Advanced Usage</strong></summary>

### Correlation Tracking

Use `correlationId` to trace events across a request chain:

```typescript
const correlationId = crypto.randomUUID();

await bus.emit("incident.created", incidentData, { correlationId });
await bus.emit("recommendation.generated", coaData, { correlationId });
await bus.emit("approval.requested", approvalData, { correlationId });

// Query all events in this chain
const chain = bus.query({}).filter((e) => e.correlationId === correlationId);
```

### Multiple Subscriptions

A single handler can subscribe to multiple event types:

```typescript
const auditHandler = (envelope: EventEnvelope) => {
  auditService.record(envelope);
};

bus.subscribe("incident.created", auditHandler);
bus.subscribe("approval.granted", auditHandler);
bus.subscribe("policy.evaluated", auditHandler);
```

### Error Handling

Handler errors do not propagate to the publisher or other subscribers:

```typescript
bus.subscribe("incident.created", async (envelope) => {
  try {
    await processIncident(envelope.data);
  } catch (error) {
    console.error(`Handler failed for ${envelope.id}:`, error);
  }
});
```

</details>

---

<details>
<summary><strong>Integration Patterns</strong></summary>

### With Express.js

```typescript
import express from "express";
import { TypedEventBus } from "@scutum/event-kit";

const app = express();
const bus = new TypedEventBus<PlatformEvents>();

app.post("/incidents", async (req, res) => {
  const incident = await createIncident(req.body);
  await bus.emit("incident.created", incident);
  res.json(incident);
});
```

### With WebSocket

```typescript
import { EventBus, JsonSerializer } from "@scutum/event-kit";

const bus = new EventBus();
const serializer = new JsonSerializer();

bus.subscribeAll((envelope) => {
  const json = serializer.serialize(envelope);
  wsClients.forEach((client) => client.send(json));
});
```

### With External Message Brokers

The event-kit envelope schema is designed to be broker-agnostic. Wrap the bus with an adapter for your message broker:

```typescript
class RedisAdapter {
  constructor(private bus: EventBus, private redis: RedisClient) {
    bus.subscribeAll((envelope) => {
      redis.publish(`events:${envelope.type}`, JSON.stringify(envelope));
    });
  }
}
```

</details>

---

<details>
<summary><strong>Contributing</strong></summary>

### Development Setup

```bash
git clone https://github.com/scutum-defense/scutum-event-kit.git
cd scutum-event-kit
npm install
npm run typecheck
npm test
```

### Guidelines

- All source code must pass `npm run typecheck` with zero errors
- New event types must be added to `SCUTUM_PROTOCOL` in `src/protocols/types.ts`
- Every public API must have corresponding unit tests
- Middleware implementations must handle both sync and async patterns
- CHANGELOG.md must be updated for every release

### Code Owners

See [CODEOWNERS](./CODEOWNERS) for ownership rules. Protocol changes require approval from `@ScutumDefense/architecture-council`.

</details>

---

## License

Copyright 2026 Scutum Defense. Licensed under the [Apache License 2.0](./LICENSE).
