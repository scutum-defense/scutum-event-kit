export interface ProtocolVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface EventProtocol {
  name: string;
  version: ProtocolVersion;
  eventTypes: string[];
  description: string;
}

export const SCUTUM_PROTOCOL: EventProtocol = {
  name: "scutum-event-protocol",
  version: { major: 1, minor: 0, patch: 0 },
  eventTypes: [
    "incident.created",
    "incident.updated",
    "incident.closed",
    "recommendation.generated",
    "recommendation.ranked",
    "approval.requested",
    "approval.granted",
    "approval.rejected",
    "audit.recorded",
    "sensor.reading",
    "twin.validated",
    "policy.evaluated",
  ],
  description: "Core event protocol for the Scutum Command Platform",
};
