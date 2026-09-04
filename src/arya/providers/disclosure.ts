import type { DataEnvelope } from "@/arya/core/data-envelope";

export interface DisclosureItem {
  id: string;
  symbol?: string;
  issuer?: string;
  title: string;
  publishedAt: number;
  url?: string;
  body?: string;
  raw?: Record<string, unknown>;
}

export interface DisclosureQuery { symbol?: string; from?: number; to?: number; limit?: number; }
export interface DisclosureProvider {
  readonly id: string;
  readonly name: string;
  health(): Promise<DataEnvelope<{ ok: boolean }>>;
  search(query: DisclosureQuery): Promise<DataEnvelope<DisclosureItem[]>>;
}

/**
 * Contract only: a Codal adapter must be wired to a verified current public
 * endpoint/schema before production use. This prevents an undocumented URL
 * from becoming a hidden dependency of the AI/news layer.
 */
export class UnconfiguredCodalProvider implements DisclosureProvider {
  readonly id = "codal-unconfigured";
  readonly name = "Codal (not configured)";
  async health(): Promise<DataEnvelope<{ ok: boolean }>> {
    return { data: { ok: false }, meta: { source: this.name, providerId: this.id, timestamp: Date.now(), status: "UNAVAILABLE", quality: 0, reason: "Current Codal endpoint contract has not been verified/configured" } };
  }
  async search(_query: DisclosureQuery): Promise<DataEnvelope<DisclosureItem[]>> {
    return { data: [], meta: { source: this.name, providerId: this.id, timestamp: Date.now(), status: "UNAVAILABLE", quality: 0, reason: "Current Codal endpoint contract has not been verified/configured" } };
  }
}
