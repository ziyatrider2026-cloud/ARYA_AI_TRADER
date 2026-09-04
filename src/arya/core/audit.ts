/** Minimal append-only audit store. Persistence can be swapped in at M3 without changing callers. */
import type { AuditEvent } from "./types";

export interface AuditStore {
  append(event: AuditEvent): Promise<void>;
  list(correlationId?: string): Promise<AuditEvent[]>;
}

export class InMemoryAuditStore implements AuditStore {
  private readonly events: AuditEvent[] = [];

  async append(event: AuditEvent): Promise<void> {
    this.events.push({ ...event, payload: { ...event.payload } });
  }

  async list(correlationId?: string): Promise<AuditEvent[]> {
    return this.events
      .filter((event) => !correlationId || event.correlationId === correlationId)
      .map((event) => ({ ...event, payload: { ...event.payload } }));
  }
}
