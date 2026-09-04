/**
 * UI-only demo fixtures.
 *
 * These values are intentionally isolated from operational market-data and
 * analysis services. They may be rendered only when VITE_DATA_MODE=mock.
 */
export const demoSectionScores = [
  { key: "technical", label: "تکنیکال", score: 82, tone: "bull" as const },
  { key: "fundamental", label: "بنیادی", score: 75, tone: "bull" as const },
  { key: "news", label: "خبر و احساسات", score: 70, tone: "bull" as const },
  { key: "codal", label: "کدال", score: 65, tone: "neutral" as const },
  { key: "smart_money", label: "اسمارت مانی", score: 85, tone: "bull" as const },
  { key: "risk", label: "ریسک", score: 60, tone: "neutral" as const },
  { key: "ai", label: "اعتماد AI", score: 80, tone: "bull" as const },
];

export const demoRecommendation = {
  action: "خرید",
  confidence: 80,
  overallScore: 78,
  rows: [
    { label: "هدف کوتاه مدت", value: "5,800", delta: "+10.9%", up: true },
    { label: "هدف میان مدت", value: "6,450", delta: "+23.3%", up: true },
    { label: "حد ضرر", value: "4,850", delta: "-7.3%", up: false },
    { label: "ریسک به ریوارد", value: "1 : 2.5", delta: "", up: true },
  ],
  reasons: [
    "بخش «تکنیکال» سیگنال صعودی با قدرت 0.64 و اطمینان 0.81 می‌دهد.",
    "جریان پول هوشمند در ۵ جلسه‌ی اخیر مثبت و رو به افزایش است.",
    "امتیاز کلی (0.56) بالاتر از آستانه‌ی خرید موتور تصمیم است.",
  ],
};

export const demoNews = [
  { time: "10:15", tag: "کدال", tone: "info" as const, text: "افزایش سرمایه ۱۰۰٪ از محل سود انباشته" },
  { time: "09:45", tag: "کدال", tone: "info" as const, text: "گزارش ماهانه آذر ماه ۱۴۰۳ منتشر شد" },
  { time: "09:30", tag: "خبر", tone: "bear" as const, text: "رشد ۱۵ درصدی تولید نسبت به ماه قبل" },
  { time: "09:10", tag: "تحلیل", tone: "accent" as const, text: "تحلیل وضعیت صنعت پالایشگاهی" },
];

export const demoWatchlist = [
  { ticker: "شپنا", price: "5,230", change: "+2.14%", up: true },
  { ticker: "شتران", price: "4,125", change: "+1.23%", up: true },
  { ticker: "فملی", price: "8,730", change: "+0.91%", up: true },
  { ticker: "وبملت", price: "2,890", change: "-0.34%", up: false },
  { ticker: "خودرو", price: "3,220", change: "-1.05%", up: false },
  { ticker: "تتر", price: "59,850", change: "-0.32%", up: false },
  { ticker: "بیت کوین", price: "64,250", change: "+1.25%", up: true },
  { ticker: "اتریوم", price: "3,210", change: "+0.85%", up: true },
];

export const demoMarketTickers = [
  { label: "شاخص کل", value: "2,145,435", change: "+1.35%", up: true },
  { label: "شپنا", value: "5,230", change: "+2.14%", up: true },
  { label: "شاخص هم وزن", value: "702,384", change: "+1.10%", up: true },
  { label: "دلار", value: "59,850", change: "-0.32%", up: false },
  { label: "طلا ۱۸", value: "3,450,000", change: "+0.85%", up: true },
  { label: "بیت کوین", value: "64,250", change: "+1.25%", up: true },
];
