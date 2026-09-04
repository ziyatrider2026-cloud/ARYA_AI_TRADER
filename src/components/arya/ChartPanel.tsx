import {
  Crosshair,
  TrendingUp,
  Minus,
  Ruler,
  Type as TypeIcon,
  Pencil,
  Move3d,
  CircleDot,
  Magnet,
  Search,
  Undo2,
  Redo2,
  Settings2,
  Maximize2,
  BarChart3,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DataEnvelope } from "@/arya/core/data-envelope";
import type { Candle, Timeframe } from "@/arya/core/types";
import { toChartSeries } from "@/arya/core/chart-series";
import { getMarketCandles } from "@/arya/server/market-data.functions";
import { CandleChart } from "./CandleChart";
import { IndicatorPanel } from "./IndicatorPanel";
import { DataStatusBadge } from "@/components/arya/DataStatusBadge";

const TIMEFRAMES: Array<{ label: string; value: Timeframe }> = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "D", value: "1D" },
  { label: "W", value: "1W" },
  { label: "M", value: "1M" },
];
const RANGES = ["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All"];
const TOOLS = [Crosshair, TrendingUp, Minus, Ruler, TypeIcon, Pencil, Move3d, CircleDot, Magnet, Search];

interface Props {
  initialData: DataEnvelope<Candle[]>;
}

export function ChartPanel({ initialData }: Props) {
  const [tf, setTf] = useState<Timeframe>("1D");
  const [range, setRange] = useState("6M");
  const [marketData, setMarketData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const series = useMemo(() => toChartSeries(marketData.data), [marketData.data]);

  useEffect(() => {
    if (tf === "1D") return;
    let active = true;
    setLoading(true);
    getMarketCandles({ data: { ticker: "شپنا", timeframe: tf, limit: 120 } })
      .then((result) => {
        if (active) setMarketData(result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tf]);

  const last = series.at(-1);
  const prev = series.at(-2);
  const diff = last && prev ? last.close - prev.close : 0;
  const pct = last && prev && prev.close !== 0 ? (diff / prev.close) * 100 : 0;

  return (
    <section className="panel flex min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
          تحلیل تکنیکال <DataStatusBadge meta={marketData.meta} />
        </h2>
      </div>

      <div className="flex items-center gap-1 border-b border-border px-3 py-1.5">
        {TIMEFRAMES.map((item) => (
          <button
            key={item.value}
            onClick={() => setTf(item.value)}
            className={`num rounded px-2 py-1 text-[11px] transition-colors ${
              tf === item.value ? "bg-surface-2 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-border" />
        <button className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
          <BarChart3 className="size-3.5" />
          Indicators
        </button>
        <span className="mx-2 h-4 w-px bg-border" />
        <Undo2 className="size-3.5 text-muted-foreground" />
        <Redo2 className="size-3.5 text-muted-foreground" />
        <div className="mr-auto flex items-center gap-2 text-muted-foreground">
          <Settings2 className="size-3.5" />
          <Maximize2 className="size-3.5" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-9 shrink-0 flex-col items-center gap-2.5 border-l border-border py-3 text-muted-foreground">
          {TOOLS.map((Icon, i) => (
            <button key={i} className="transition-colors hover:text-primary">
              <Icon className="size-4" strokeWidth={1.6} />
            </button>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col px-3 pb-2 pt-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
            <span className="font-semibold">شپنا · {TIMEFRAMES.find((item) => item.value === tf)?.label}</span>
            <span className="text-muted-foreground">بورس</span>
            {last ? (
              <>
                <span className="num text-muted-foreground">O{last.open} H{last.high} L{last.low} C{last.close}</span>
                <span className={`num ${diff >= 0 ? "text-bull" : "text-bear"}`}>
                  {diff >= 0 ? "+" : ""}
                  {diff.toFixed(0)} ({pct.toFixed(2)}%)
                </span>
                <span className="num text-muted-foreground">Volume {last.volume}</span>
              </>
            ) : null}
          </div>

          <div className="mt-1 min-h-0 flex-1">
            {series.length > 0 ? (
              <CandleChart data={series} />
            ) : (
              <div className="flex h-full min-h-[300px] items-center justify-center text-center text-xs text-muted-foreground">
                {loading ? "در حال دریافت داده بازار…" : marketData.meta.reason ?? "داده‌ای برای نمایش وجود ندارد."}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-t border-border px-3 py-1.5">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`num rounded px-2 py-0.5 text-[11px] transition-colors ${
              range === r ? "bg-surface-2 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {r}
          </button>
        ))}
        <div className="mr-auto flex items-center gap-2 num text-[11px] text-muted-foreground">
          <span>{loading ? "loading…" : "server data"}</span>
          <span>{marketData.meta.providerId}</span>
        </div>
      </div>

      <IndicatorPanel />
    </section>
  );
}
