import { describe, expect, it } from "vitest";
import { TsetmcProvider } from "./tsetmc-provider";

function response(body: unknown, ok = true): Response { return new Response(JSON.stringify(body), { status: ok ? 200 : 503, headers: { "content-type": "application/json" } }); }

describe("TsetmcProvider", () => {
  it("normalizes daily TSETMC history into epoch candles", async () => {
    const provider = new TsetmcProvider({ fetchImpl: async () => response({ closingPriceDaily: [{ dEven: 20260903, pFirst: 100, pMax: 110, pMin: 95, pClosing: 105, qTotTran5J: 1000 }] }) });
    const result = await provider.getOhlcv({ symbolId: "tsetmc:123", timeframe: "1D", limit: 1 });
    expect(result.meta.status).toBe("LIVE");
    expect(result.data[0]?.t).toBe(Date.UTC(2026, 8, 3));
    expect(result.data[0]?.close).toBe(105);
  });

  it("does not pretend TSETMC supports intraday history through the daily endpoint", async () => {
    const provider = new TsetmcProvider({ fetchImpl: async () => response({}) });
    const result = await provider.getOhlcv({ symbolId: "tsetmc:123", timeframe: "1h", limit: 50 });
    expect(result.meta.status).toBe("UNAVAILABLE");
    expect(result.data).toEqual([]);
  });
});
