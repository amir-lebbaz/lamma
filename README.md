# «لَمّة» — Lamma

[![Android](https://img.shields.io/badge/Platform-Android%20Native%20(Kotlin%20%2B%20Compose)-3DDC84?logo=android&logoColor=white)](https://github.com/amir-lebbaz/lamma/releases)
[![Web](https://img.shields.io/badge/Web-Next.js%2015%20(React%2019)-000000?logo=next.js&logoColor=white)](https://family-chat-opal.vercel.app)
[![Backend](https://img.shields.io/badge/Realtime-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Amir%20Lebbaz-purple.svg)](https://github.com/amir-lebbaz)

منصة تواصل ومراسلة عائلية خاصة ومستقلة، مبنية على بنية معمارية مزدوجة تجمع بين **تطبيق أندرويد أصلي فائق الخفة (100% Native Kotlin + Jetpack Compose)** و**تطبيق ويب لسطح المكتب (Next.js 15 Desktop Web)** متصلين بقنوات لحظية موحدة، ومصممة لتعمل بسلاسة حتى على أضعف الهواتف الذكية وبأعلى معايير الخصوصية العائلية.

A private, dual-platform family communication platform featuring a **pure native Android application (Kotlin + Jetpack Compose)** and a **dedicated Desktop Web application (Next.js 15)** connected via unified real-time channels, engineered for extreme reliability and lightweight performance on low-end hardware.

---

## 📖 الفهرس / Table of Contents
- [العربية](#العربية)
  - [نظرة عامة](#نظرة-عامة)
  - [البنية الهندسية المزدوجة](#البنية-الهندسية-المزدوجة)
  - [الميزات الجوهرية](#الميزات-الجوهرية)
  - [تحميل وتثبيت تطبيق الهاتف](#تحميل-وتثبيت-تطبيق-الهاتف)
  - [التشغيل والاستضافة الذاتية](#التشغيل-والاستضافة-الذاتية)
- [English](#english)
  - [Overview](#overview)
  - [Dual-Platform Architecture](#dual-platform-architecture)
  - [Core Features](#core-features)
  - [Direct APK Installation](#direct-apk-installation)
  - [Self-Hosting & Local Development](#self-hosting--local-development)
- [المطور / Author](#المطور--author)

---

# العربية

## نظرة عامة
تم تصميم منصة **«لَمّة»** لتجاوز المشاكل الشائعة في تطبيقات المراسلة التقليدية داخل المحيط العائلي: ضياع الرسائل الهامة في الوضع الصامت، تجميد الهواتف الضعيفة عند استقبال سيل من الإشعارات، استهلاك باقات الإنترنت الشحيحة، ورفع الصور الخاصة إلى خوادم تخزين سحابية عامة.

تضمن «لَمّة» بيئة آمنة وهادئة وخاصة لكل أسرة، دون اشتراكات شهرية، ودون رسوم رسائل SMS، وبحجم تثبيت فائق الخفة لا يتجاوز 3.8 ميغابايت على الهاتف.

---

## البنية الهندسية المزدوجة
تتألف المنصة من نظامين متكاملين متصلين بقاعدة بيانات Supabase Realtime موحدة:

```
                      ┌────────────────────────────────────────┐
                      │        Supabase Realtime Cloud         │
                      │   PostgreSQL + Realtime WebSockets     │
                      └───────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
   ┌──────────────────────────────┐                ┌──────────────────────────────┐
   │     android-app/ (الهاتف)     │                │          web/ (الحاسوب)       │
   │  100% Native Jetpack Compose │                │     Next.js 15 Desktop App   │
   │   Material 3 • Kotlin 2.0    │                │    Tailwind CSS • Web Audio  │
   │   Anti-Lag Alert Engine      │                │   Persistent Household Tasks │
   │   Local-Only Photo Storage   │                │   Mobile Download Gate Card  │
   └──────────────────────────────┘                └──────────────────────────────┘
```

1. **تطبيق الهاتف (`android-app/`):**
   * كود برمجي أصلي 100% بلغة **Kotlin** وأحدث مكتبات **Jetpack Compose** و **Material 3**.
   * خالٍ تماماً من تقنيات WebView، أو TWA، أو أطر العمل الهجينة (Capacitor/Cordova).
   * متوافق مع هواتف أندرويد بدءاً من الإصدار 7.0 (Android Nougat API 24) وحتى أحدث الإصدارات (Android 15 API 35).
2. **تطبيق سطح المكتب (`web/`):**
   * واجهة متخصصة لشاشات الحواسيب المحمولة والمكتبية مبنية بـ **Next.js 15** و **Tailwind CSS**.
   * شاشة تقسيم عريضة مستوحاة من Telegram Web، مع قائمة مهام منزلية مشتركة وإشعارات سطح المكتب المستمرة (`requireInteraction: true`).
   * **بوابة توجيه تلقائية:** عند فتح الموقع عبر شاشة هاتف محمول (`< 768px`)، يتم توجيه الزائر فوراً لتحميل تطبيق أندرويد الأصلي `lamma.apk`.

---

## الميزات الجوهرية

### 🛡️ 1. تخزين الصور محلياً فقط (Local-Only Media Storage)
* لا يتم رفع أي صور عائلية إلى وحدات التخزين السحابية (Supabase Storage).
* تُعالج الصور وتُضغط محلياً وتُحفظ داخل مجلد التطبيق المعزول على الهاتف، أو في IndexedDB على المتصفح.
* تظل الخصوصية العائلية محفوظة 100% مع الحفاظ على الحصة المجانية لقواعد البيانات دون أي تكاليف تشغيلية.

### 🔔 2. محرك التنبيهات المانع للتجميد (Anti-Lag Notification Coalescing)
* تجميع كافة الإشعارات المتتالية داخل بطاقة إشعار موحدة بمعرّف ثابت (`LAMMA_ALERT_ID = 1001`) بنمط `InboxStyle`.
* مؤقت حماية إجباري (5-Second Cooldown Throttle) يمنع تكرار الرنين والاهتزاز أكثر من مرة كل 5 ثوانٍ، مما يحمي الهواتف الاقتصادية (1GB - 2GB RAM) من التجميد أو إعادة التشغيل القسري أثناء تدفق الرسائل.

### 🚨 3. زر النداء العائلي العاجل (Urgent Family Buzz)
* زر تبديل فوري في شريط الكتابة يتيح إرسال تنبيه عاجل بلون أحمر بارز.
* يُطلق رنيناً حاداً بنمط إنذار (`USAGE_ALARM`) واهتزازاً مزدوجاً يتجاوز وضع الصامت (DND Bypass) لتنبيه الأهل فوراً في الحالات الطارئة.

### 🧓 4. وضع الهاتف الخفيف / وضع الوالد (Ultra-Lite Mode)
* يتم تفعيله تلقائياً عند اكتشاف هاتف بذاكرة وصول عشوائي محدودة (`isLowRamDevice`)، أو عبر الإعدادات يدوياً.
* يُعطّل الظلال والتمويهات الحركية، ويُقلص استهلاك ذاكرة الصور عبر التدرج الثنائي `RGB_565`، ويُكبّر مقاسات الخطوط وأزرار اللمس بمقدار 1.3x لتسهيل الاستخدام على كبار السن.

### 📞 5. طلب اتصال مجاني بدون رصيد (Zero-Credit USSD Dialer)
* زر اتصال مباشر يفتح لوحة الاتصال برمز الشريحة المجاني (`tel:*100%23` أو الرمز المحلي) لطلب إعادة الاتصال "Call Me Back" عندما ينفد رصيد الإنترنت لدى أحد الأفراد، بدون طلب أذونات الرسائل المدفوعة (`SEND_SMS`).

### 🐱 6. زينو («Zino») — تميمة العائلة الصامتة
* قط سيامي بأذنين شوكولاتية وعينين ياقوتيتين، لا يتكلم ولا يرسل نصوصاً، بل يتفاعل بالحركات اللطيفة (الخرخرة، التلويح بالذيل، ولمسات الكف) لإضفاء جو دافئ داخل المحادثة.

### 🎨 7. نظام الألوان الحصري (Sakura Dusk & Velvet Ink)
* **ثيم الساكورا المسائي (Sakura Dusk):** تدرجات العقيق والخمري مع زهر الكرز (`#1B0C1A`، `#2D222F`، `#6D3C52`، `#FADCD5`).
* **ثيم حبر المخمل (Velvet Ink):** تدرجات الليل الكحلي الداكن والفضي الهادئ (`#0B1421`، `#283041`، `#34394A`، `#B5B9BC`).

---

## تحميل وتثبيت تطبيق الهاتف

يمكنك تثبيت تطبيق أندرويد الأصلي مباشرة على أي هاتف:

1. **الرابط المباشر السريع (Vercel Production):**
   * [تحميل lamma.apk (الحجم: 3.87 ميغابايت)](https://family-chat-opal.vercel.app/lamma.apk)
2. **عبر صفحة الإصدارات في GitHub (Releases):**
   * [تنزيل الإصدار المستقر v1.0.0](https://github.com/amir-lebbaz/lamma/releases/tag/v1.0.0)
3. افتح الملف على هاتفك، ووافق على تثبيت التطبيقات من مصادر موثوقة (Allow Install from Unknown Sources)، وسيبدأ التطبيق فوراً.

---

## التشغيل والاستضافة الذاتية

### المتطلبات المسبقة
* **Node.js** (الإصدار 18 فما فوق) و **npm**
* **JDK 17** و **Android SDK 35** (لتجميع تطبيق الهاتف)
* حساب مجاني على [Supabase](https://supabase.com)

### 1. إعداد خادم Supabase
1. أنشئ مشروعاً جديداً في Supabase.
2. توجّه إلى محرر الـ SQL ونفّذ السكربت الموجود في `supabase/schema.sql` لإنشاء الجداول وسياسات الأمان وتفعيل الـ Realtime.
3. انسخ المفاتيح (`URL` و `Anon Key`).

### 2. تشغيل منصة الويب (Next.js 15)
```bash
# تثبيت الاعتماديات
npm install

# إعداد المتغيرات البيئية
cp .env.example .env.local
# ضع مفاتيح Supabase الخاصة بك داخل .env.local

# تشغيل خادم التطوير
npm run dev

# أو بناء نسخة الإنتاج
npm run build
npm run start
```

### 3. بناء تطبيق الهاتف (Android APK)
```bash
cd android-app

# بناء حزمة الإنتاج مع تحسينات R8
./gradlew :app:assembleRelease -x lint --no-daemon

# ستجد ملف الـ APK النهائي جاهزاً في:
# android-app/app/build/outputs/apk/release/app-release.apk
```

---

# English

## Overview
**Lamma («لَمّة»)** is an independent, private family communication platform engineered from the ground up to eliminate common group chat pain points: missed emergency messages when phones are on silent, OS freezes on budget smartphones during notification bursts, expensive cloud hosting fees, and privacy concerns regarding family photos on public cloud servers.

Built with an uncompromising dual-platform philosophy, Lamma delivers an ultra-lean **3.87 MB native Android app** and a wide **desktop web workstation**, keeping family members seamlessly synchronized in real-time.

---

## Dual-Platform Architecture

1. **Standalone Native Android App (`android-app/`):**
   * **100% Pure Kotlin + Jetpack Compose** with Material 3 design tokens.
   * Completely free of WebViews, hybrid wrappers, or browser engines.
   * Runs smoothly on low-end hardware starting from Android 7.0 (API 24) through Android 15 (API 35).
2. **Desktop Web App (`web/`):**
   * Optimized strictly for desktop/laptop screens using **Next.js 15**, **React 19**, and **Tailwind CSS**.
   * Features a persistent household checklist, Web Audio triple-chime synthesis, and desktop OS notifications (`requireInteraction: true`).
   * **Mobile Gate:** Mobile browser visitors (`< 768px`) are greeted with a clean landing card providing a 1-tap download link for the native APK.

---

## Core Features

* **Local-Only Media Storage:** Photos are never uploaded to cloud buckets or database blobs. Everything is downsampled safely using `inSampleSize` power-of-two scaling and stored strictly on device internal storage.
* **Anti-Lag Notification Coalescing:** Consolidates incoming alert bursts into a single unified notification card (`LAMMA_ALERT_ID = 1001`) with an `InboxStyle` format and a strict **5-second cooldown throttle** to safeguard 1GB/2GB RAM phones against UI freezing.
* **Urgent Family Buzz («نداء عاجل 🔔»):** High-priority emergency alert using `USAGE_ALARM` audio attributes and a double-pulse vibration pattern designed to pierce through Do Not Disturb (DND) modes.
* **Ultra-Lite Mode («وضع الهاتف الخفيف»):** Auto-detected on low-RAM devices (`ActivityManager.isLowRamDevice`). Strips heavy Compose shadows, downsamples bitmaps to `RGB_565`, and scales UI elements by 1.3x for senior family members.
* **Zero-Credit Free USSD Dialing Shortcut:** Direct dialer shortcut (`tel:*100%23`) for offline family members without internet balance. Strictly zero cellular SMS fees (`SEND_SMS` is prohibited).
* **Zino («زينو») Mascot:** The silent Siamese cat family member who never talks, offering warm non-verbal purrs, paw taps, and status reactions.
* **Signature Palettes:** **Sakura Dusk** (`#1B0C1A`, `#2D222F`, `#6D3C52`, `#FADCD5`) & **Velvet Ink** (`#0B1421`, `#283041`, `#34394A`, `#B5B9BC`).

---

## Direct APK Installation

Install the official native Android build:

1. **Direct Download from Production CDN:**
   * [Download lamma.apk (3.87 MB)](https://family-chat-opal.vercel.app/lamma.apk)
2. **GitHub Releases:**
   * [Stable Release v1.0.0](https://github.com/amir-lebbaz/lamma/releases/tag/v1.0.0)

---

## Self-Hosting & Local Development

### Prerequisites
* **Node.js** (v18+) & **npm**
* **JDK 17** & **Android SDK 35**
* Free [Supabase](https://supabase.com) project

### 1. Database Setup
Execute `supabase/schema.sql` inside the Supabase SQL Editor to provision tables, security rules, and real-time triggers.

### 2. Run Desktop Web App
```bash
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

### 3. Compile Native Android APK
```bash
cd android-app
./gradlew :app:assembleRelease -x lint --no-daemon
```

---

## المطور / Author

تم تصميم وتطوير منصة **«لَمّة»** بواسطة:
Designed and built by:

**أمير لباز (Amir Lebbaz)**
* GitHub: [@amir-lebbaz](https://github.com/amir-lebbaz)
* Repository: [amir-lebbaz/lamma](https://github.com/amir-lebbaz/lamma)
* Production: [family-chat-opal.vercel.app](https://family-chat-opal.vercel.app)

---

## الترخيص / License
This project is open-source under the [MIT License](LICENSE).
