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
import { useMemo, useState } from "react";
import { CandleChart } from "./CandleChart";
import { generateSeries } from "@/lib/arya-data";
import { IndicatorPanel } from "./IndicatorPanel";
import { DataStatusBadge, MOCK_META } from "@/components/arya/DataStatusBadge";

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "D", "W", "M"];
const RANGES = ["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All"];
const TOOLS = [Crosshair, TrendingUp, Minus, Ruler, TypeIcon, Pencil, Move3d, CircleDot, Magnet, Search];

export function ChartPanel() {
  const [tf, setTf] = useState("D");
  const [range, setRange] = useState("6M");
  const data = useMemo(() => generateSeries("شپنا", 4600, 120), []);
  const last = data[data.length - 1]!;
  const prev = data[data.length - 2]!;
  const diff = last.close - prev.close;
  const pct = (diff / prev.close) * 100;

  return (
    <section className="panel flex min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">تحلیل تکنیکال <DataStatusBadge meta={MOCK_META} /></h2>
      </div>

      <div className="flex items-center gap-1 border-b border-border px-3 py-1.5">
        {TIMEFRAMES.map((t) => (
          <button
            key={t}
            onClick={() => setTf(t)}
            className={`num rounded px-2 py-1 text-[11px] transition-colors ${
              tf === t ? "bg-surface-2 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
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
            <span className="font-semibold">شپنا · 1D</span>
            <span className="text-muted-foreground">بورس</span>
            <span className="num text-muted-foreground">
              O{last.open} H{last.high} L{last.low} C{last.close}
            </span>
            <span className={`num ${diff >= 0 ? "text-bull" : "text-bear"}`}>
              {diff >= 0 ? "+" : ""}
              {diff.toFixed(0)} ({pct.toFixed(2)}%)
            </span>
            <span className="num text-muted-foreground">Volume {last.volume}M</span>
          </div>

          <div className="mt-1 min-h-0 flex-1">
            <CandleChart data={data} />
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
          <span>10:30:45 (UTC+3:30)</span>
          <span>log</span>
          <span>auto</span>
        </div>
      </div>

      <IndicatorPanel />

    </section>
  );
}