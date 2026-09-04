import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { readMarketCandles } from "./market-data.server";

const requestSchema = z.object({
  symbolId: z.string().trim().min(1).optional(),
  ticker: z.string().trim().min(1).optional(),
  timeframe: z.enum(["1m", "5m", "15m", "30m", "1h", "4h", "1D", "1W", "1M"]),
  limit: z.number().int().min(1).max(2_000).default(120),
});

export const getMarketCandles = createServerFn({ method: "GET" })
  .validator(requestSchema)
  .handler(async ({ data }) => readMarketCandles(data));
