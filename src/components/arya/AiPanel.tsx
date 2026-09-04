import { ExternalLink, Sparkles } from "lucide-react";
import { demoRecommendation, demoNews } from "@/lib/demo-data";
import { isDemoMode } from "@/config/demo-mode";
import { DataStatusBadge, MOCK_META } from "@/components/arya/DataStatusBadge";

const toneClass: Record<string, string> = { info: "bg-bull/15 text-bull", bear: "bg-bear/15 text-bear", accent: "bg-accent/20 text-accent-foreground" };

export function AiPanel() {
  if (!isDemoMode) {
    return (
      <div className="flex flex-col gap-3">
        <section className="panel flex flex-col gap-3 p-4">
          <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground"><Sparkles className="size-3.5 text-primary" /> پیشنهاد هوش مصنوعی <DataStatusBadge meta={{ status: "UNAVAILABLE", source: "AnalysisSnapshot", providerId: "analysis", timestamp: 0, quality: 0, reason: "AnalysisSnapshot عملیاتی هنوز متصل نشده است" }} /></h2>
          <div className="rounded-lg border border-border bg-surface-2 py-6 text-center text-sm text-muted-foreground">پیشنهاد AI تا دریافت داده‌ی معتبر و AnalysisSnapshot نمایش داده نمی‌شود.</div>
        </section>
        <section className="panel flex flex-1 flex-col gap-2 p-4"><h2 className="text-[13px] font-semibold text-muted-foreground">اخبار و اطلاعیه‌های مهم</h2><p className="py-4 text-center text-xs text-muted-foreground">داده‌ی خبری عملیاتی در دسترس نیست.</p></section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="panel flex flex-col gap-3 p-4">
        <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground"><Sparkles className="size-3.5 text-primary" /> پیشنهاد هوش مصنوعی <DataStatusBadge meta={MOCK_META} /></h2>
        <div className="rounded-lg border border-warning/40 bg-warning/10 py-5 text-center"><p className="text-2xl font-bold text-warning">{demoRecommendation.action}</p><p className="num mt-1 text-xs text-warning/80">نمایشی · اعتبار {demoRecommendation.confidence}%</p></div>
        <dl className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 p-3">{demoRecommendation.rows.map((r) => <div key={r.label} className="flex items-center justify-between text-[12px]"><dt className="text-muted-foreground">{r.label}</dt><dd className="flex items-center gap-3"><span className="num font-semibold">{r.value}</span>{r.delta && <span className={`num w-14 text-left ${r.up ? "text-bull" : "text-bear"}`}>{r.delta}</span>}</dd></div>)}</dl>
        <ul className="flex flex-col gap-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{demoRecommendation.reasons.map((reason) => <li key={reason} className="flex gap-1.5"><span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />{reason}</li>)}</ul>
        <p className="text-[10px] text-warning">این پیشنهاد از داده‌ی DEMO ساخته شده و ارزش معاملاتی ندارد.</p>
        <button className="flex items-center justify-center gap-1.5 rounded-md border border-border py-2 text-[12px] text-accent-foreground transition-colors hover:bg-surface-2">توضیحات کامل تحلیل <ExternalLink className="size-3.5" /></button>
      </section>
      <section className="panel flex flex-1 flex-col gap-2 p-4"><div className="flex items-center justify-between"><h2 className="text-[13px] font-semibold text-muted-foreground">اخبار و اطلاعیه‌های مهم</h2><button className="text-[11px] text-primary hover:underline">مشاهده همه</button></div><ul className="flex flex-col">{demoNews.map((n) => <li key={n.time} className="flex items-center gap-3 border-b border-border/60 py-2.5 last:border-0"><span className="num text-[11px] text-muted-foreground">{n.time}</span><p className="min-w-0 flex-1 truncate text-[12px]">{n.text}</p><span className={`rounded px-2 py-0.5 text-[10px] font-medium ${toneClass[n.tone]}`}>{n.tag}</span></li>)}</ul></section>
    </div>
  );
}
