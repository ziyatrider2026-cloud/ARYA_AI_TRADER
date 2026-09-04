import { createFileRoute } from "@tanstack/react-router";
import { LineChart } from "lucide-react";

import { AppShell } from "@/components/arya/AppShell";
import { ChartPanel } from "@/components/arya/ChartPanel";
import { getMarketCandles } from "@/arya/server/market-data.functions";

const title = "تحلیل نمودار | آریا";
const description = "نمودار کندلی چندتایم‌فریمی با اندیکاتورهای قابل تنظیم برای بورس، ارز دیجیتال و فارکس.";

export const Route = createFileRoute("/chart")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => getMarketCandles({ data: { ticker: "شپنا", timeframe: "1D", limit: 120 } }),
  component: ChartPage,
});

function ChartPage() {
  const marketData = Route.useLoaderData();
  return (
    <AppShell>
      <ChartPanel initialData={marketData} />
    </AppShell>
  );
}
