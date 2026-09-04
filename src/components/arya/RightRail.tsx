import { Plus, ChevronLeft } from "lucide-react";
import { demoWatchlist } from "@/lib/demo-data";
import { isDemoMode } from "@/config/demo-mode";
import { DataStatusBadge, MOCK_META } from "@/components/arya/DataStatusBadge";

const demoBreadth = [
  { label: "مثبت", value: 325, color: "var(--bull)" },
  { label: "منفی", value: 180, color: "var(--bear)" },
  { label: "بدون تغییر", value: 95, color: "var(--neutral)" },
];

function Donut() {
  const total = demoBreadth.reduce((a, b) => a + b.value, 0);
  let offset = 0;
  const r = 32;
  const c = 2 * Math.PI * r;
  return <svg viewBox="0 0 80 80" className="size-[78px] -rotate-90">{demoBreadth.map((b) => { const len = (b.value / total) * c; const el = <circle key={b.label} cx="40" cy="40" r={r} fill="none" stroke={b.color} strokeWidth={11} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />; offset += len; return el; })}</svg>;
}

export function RightRail() {
  if (!isDemoMode) {
    return <div className="flex w-[236px] shrink-0 flex-col gap-3"><section className="panel flex min-h-0 flex-1 flex-col p-4"><div className="flex items-center justify-between"><h2 className="text-[13px] font-semibold text-muted-foreground">واچ لیست من <DataStatusBadge meta={{ status: "UNAVAILABLE", source: "MarketData", providerId: "market-data", timestamp: 0, quality: 0, reason: "داده‌ی عملیاتی واچ‌لیست هنوز متصل نشده است" }} /></h2><button className="text-muted-foreground hover:text-primary"><Plus className="size-4" /></button></div><p className="py-6 text-center text-xs text-muted-foreground">داده‌ی عملیاتی در دسترس نیست.</p></section><section className="panel p-4"><h2 className="text-[13px] font-semibold text-muted-foreground">وضعیت بازار</h2><p className="py-4 text-center text-xs text-muted-foreground">Breadth عملیاتی در دسترس نیست.</p></section></div>;
  }

  return <div className="flex w-[236px] shrink-0 flex-col gap-3"><section className="panel flex min-h-0 flex-1 flex-col p-4"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">واچ لیست من <DataStatusBadge meta={MOCK_META} /></h2><button className="text-muted-foreground hover:text-primary"><Plus className="size-4" /></button></div><div className="mt-3 flex items-center justify-between border-b border-border pb-1.5 text-[11px] text-muted-foreground"><span>نماد</span><span>قیمت</span><span>تغییر</span></div><ul className="flex flex-col">{demoWatchlist.map((w) => <li key={w.ticker} className="flex items-center justify-between gap-2 border-b border-border/50 py-2 text-[12px]"><span className="w-14 truncate">{w.ticker}</span><span className="num text-muted-foreground">{w.price}</span><span className={`num flex w-16 items-center justify-end gap-0.5 ${w.up ? "text-bull" : "text-bear"}`}>{w.change}<ChevronLeft className="size-3" /></span></li>)}</ul></section><section className="panel p-4"><h2 className="text-[13px] font-semibold text-muted-foreground">وضعیت بازار <DataStatusBadge meta={MOCK_META} /></h2><div className="mt-2 flex items-center gap-3"><Donut /><ul className="flex flex-1 flex-col gap-2">{demoBreadth.map((b) => <li key={b.label} className="flex items-center gap-2 text-[12px]"><span className="size-2 rounded-full" style={{ backgroundColor: b.color }} /><span className="flex-1 text-muted-foreground">{b.label}</span><span className="num font-semibold">{b.value}</span></li>)}</ul></div><p className="mt-2 text-[10px] text-warning">داده‌های این بخش DEMO هستند.</p></section></div>;
}
