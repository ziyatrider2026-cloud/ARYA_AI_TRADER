import { describe, expect, it } from "vitest";
import { normalizeCandle, validateCandles } from "./data-quality";

describe("data quality", () => {
  it("normalizes numeric strings into a valid candle", () => {
    expect(normalizeCandle({ t: "1000", open: "10", high: "12", low: "9", close: "11", volume: "5" })).toEqual({ t: 1000, open: 10, high: 12, low: 9, close: 11, volume: 5 });
  });

  it("rejects malformed OHLC relationships", () => {
    expect(normalizeCandle({ t: 1000, open: 10, high: 8, low: 9, close: 11, volume: 5 })).toBeNull();
  });

  it("detects gaps and incomplete coverage", () => {
    const result = validateCandles([
      { t: 0, open: 1, high: 2, low: 1, close: 2, volume: 1 },
      { t: 120_000, open: 2, high: 3, low: 2, close: 3, volume: 1 },
    ], "1m", 3);
    expect(result.status).toBe("partial");
    expect(result.coverage).toBeCloseTo(2 / 3);
    expect(result.warnings.some((w) => w.includes("gap"))).toBe(true);
  });
});
