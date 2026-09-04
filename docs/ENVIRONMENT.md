# متغیرهای محیطی (Environment Variables)

این سند توضیح می‌دهد پروژه ARYA AI TRADER به چه متغیرهایی نیاز دارد، هر کدام چه کاری می‌کنند و چطور تنظیم می‌شوند.

## وضعیت فعلی

در کد فعلی مخزن **هیچ متغیر محیطی اجباری وجود ندارد**: تمام داده‌ها از `MockProvider` (داده نمونه) خوانده می‌شود و برنامه بدون `.env` هم اجرا می‌شود.
متغیرهای زیر برای مرحله بعد (اتصال به داده واقعی، هوش مصنوعی و پایگاه داده) پیش‌بینی شده‌اند؛ هر کدام را هنگام فعال کردن آن قابلیت پر کنید.

## شروع سریع

```sh
cp .env.example .env
# مقادیر لازم را داخل .env بنویسید
bun install   # یا: npm i
bun run dev   # یا: npm run dev
```

## دو نوع متغیر

| نوع | پیشوند | کجا خوانده می‌شود | آیا محرمانه است؟ |
| --- | --- | --- | --- |
| سمت مرورگر | `VITE_` | `import.meta.env.VITE_X` | **خیر** — داخل باندل عمومی دیده می‌شود |
| سمت سرور | بدون پیشوند | `process.env['X']` داخل بدنه‌ی `.handler()` سرور فانکشن | بله — فقط روی سرور |

قانون طلایی: **هیچ کلید محرمانه‌ای را با پیشوند `VITE_` تعریف نکنید.**

## جدول متغیرها

| نام | اجباری | توضیح | نمونه مقدار |
| --- | --- | --- | --- |
| `NODE_ENV` | خیر | محیط اجرا | `development` |
| `PORT` | خیر | پورت سرور توسعه | `8080` |
| `VITE_APP_NAME` | خیر | نام نمایشی برنامه | `ARYA AI TRADER` |
| `VITE_DATA_MODE` | خیر | `mock` یا `live` | `mock` |
| `TSETMC_BASE_URL` | برای داده واقعی | آدرس پایه منبع بورس تهران | `https://cdn.tsetmc.com` |
| `TSETMC_API_KEY` | برای داده واقعی | کلید سرویس داده بازار | `—` |
| `CODAL_BASE_URL` | برای کدال | آدرس پایه کدال | `https://search.codal.ir` |
| `CODAL_API_KEY` | برای کدال | کلید سرویس کدال | `—` |
| `CRYPTO_API_KEY` | خیر | کلید سرویس داده کریپتو | `—` |
| `LOVABLE_API_KEY` | برای AI | کلید Lovable AI Gateway (خودکار تزریق می‌شود) | `—` |
| `OPENAI_API_KEY` | خیر | در صورت استفاده مستقیم از OpenAI | `sk-...` |
| `VITE_SUPABASE_URL` | با فعال‌سازی Cloud | آدرس پروژه پایگاه داده | `https://xxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | با فعال‌سازی Cloud | کلید عمومی (قابل انتشار) | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | فقط سرور | کلید مدیریتی — هرگز در مرورگر استفاده نشود | `—` |
| `SESSION_SECRET` | برای نشست/امضا | رشته تصادفی؛ با `openssl rand -hex 32` بسازید | `—` |

## نحوه استفاده در کد

سمت سرور (داخل `.handler()` بخوانید، نه در سطح ماژول):

```ts
import { createServerFn } from "@tanstack/react-start";

export const getQuote = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env["TSETMC_API_KEY"];
  if (!apiKey) throw new Error("TSETMC_API_KEY تنظیم نشده است");
  // ... فراخوانی سرویس
});
```

سمت مرورگر:

```ts
const mode = import.meta.env.VITE_DATA_MODE ?? "mock";
```

## تنظیم در محیط‌های مختلف

- **لوکال**: فایل `.env` در ریشه پروژه.
- **Lovable**: کلیدهای محرمانه در بخش Secrets پروژه ذخیره می‌شوند و به‌صورت خودکار در کد سرور در دسترس‌اند؛ در گیت ذخیره نمی‌شوند.
- **Cloudflare Workers / سرویس میزبان**: همان نام‌ها را در بخش Environment Variables / Secrets پنل میزبان وارد کنید.
- **CI (GitHub Actions)**: در `Settings → Secrets and variables → Actions` تعریف کنید.

## نکات امنیتی

- `.env` هرگز commit نشود (در `.gitignore` هست). فقط `.env.example` در مخزن بماند.
- اگر کلیدی به اشتباه منتشر شد، در سرویس مربوطه آن را باطل و کلید جدید بسازید.
- کلیدهای محرمانه فقط در سرور فانکشن‌ها استفاده شوند، نه در کامپوننت‌های React.
