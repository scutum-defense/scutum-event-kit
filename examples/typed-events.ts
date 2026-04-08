import { TypedEventBus } from "../src/bus/typed-bus";

// Define the platform event map
type ScutumEvents = {
  "incident.created": { id: string; title: string; severity: string };
  "recommendation.generated": { incidentId: string; actionCount: number };
  "approval.granted": { actionId: string; actor: string; timestamp: string };
  "audit.recorded": { chainId: string; sequenceNumber: number };
};

async function main() {
  const bus = new TypedEventBus<ScutumEvents>();

  // Type-safe event handlers
  bus.on("incident.created", (data) => {
    console.log(`[INCIDENT] ${data.severity}: ${data.title}`);
  });

  bus.on("recommendation.generated", (data) => {
    console.log(`[COA] ${data.actionCount} actions for incident ${data.incidentId}`);
  });

  bus.on("approval.granted", (data) => {
    console.log(`[APPROVED] Action ${data.actionId} by ${data.actor}`);
  });

  // Simulate platform events
  await bus.emit("incident.created", {
    id: "inc-001",
    title: "Suspicious drone near port perimeter",
    severity: "high",
  });

  await bus.emit("recommendation.generated", {
    incidentId: "inc-001",
    actionCount: 3,
  });

  await bus.emit("approval.granted", {
    actionId: "act-001",
    actor: "operator-1",
    timestamp: new Date().toISOString(),
  });
}

main().catch(console.error);
