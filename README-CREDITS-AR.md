# ذيبان AI — نظام الرصيد وReplicate

## التغيير

تم إلغاء الاشتراكات والتجربة المجانية من النظام. المستخدم الجديد يبدأ بـ **0 نقطة**. كل طلب ناجح لإنشاء صورة يخصم **نقطة واحدة** من الخادم. لا يستطيع العميل استخدام الخدمة عند رصيد 0.

الباقات المعروضة:

| النقاط | السعر |
|---:|---:|
| 50 | 25 ر.س |
| 100 | 39 ر.س |
| 300 | 63 ر.س |
| 500 | 130 ر.س |
| 1000 | 320 ر.س |

أزرار الدفع حالياً توضيحية فقط حتى يتم اختيار بوابة الدفع وربطها لاحقاً.

## سر Replicate — مهم جداً

لا تضع توكن Replicate في `HTML` أو `JavaScript` أو Firestore. تم تجهيز API Serverless داخل مجلد `api`، ويقرأ التوكن من متغير Vercel:

```text
REPLICATE_API_TOKEN = ضع التوكن هنا
```

إذا كان التوكن الذي أرسلته في محادثة مستخدماً فعلياً، ألغِه من Replicate وأنشئ توكناً جديداً قبل الإنتاج؛ لا تعيد استخدام توكن مكشوف في الرسائل.

## متغيرات Vercel المطلوبة

من مشروع Vercel:

```text
Settings → Environment Variables
```

أضف للبيئات Production وPreview عند الحاجة:

```text
REPLICATE_API_TOKEN
```
قيمة: توكن Replicate الجديد.

```text
FIREBASE_SERVICE_ACCOUNT_JSON
```
قيمة: محتوى JSON الكامل لحساب خدمة Firebase Admin، كسطر واحد أو JSON صالح.

بعد حفظ المتغيرات اضغط Redeploy. لا تضع هذه القيم داخل المستودع أو ملفات ZIP العامة.

## إنشاء Firebase Service Account

Firebase Console → Project settings → Service accounts → Generate new private key.

نزّل JSON، وانسخ محتواه إلى `FIREBASE_SERVICE_ACCOUNT_JSON` في Vercel فقط. لا ترسله في المحادثة ولا ترفعه إلى GitHub.

## إضافة رصيد يدوياً مؤقتاً

حالياً لا توجد صفحة مالك داخل الموقع. لإضافة رصيد يدوياً من Firebase Console:

1. افتح `Firebase Console → Firestore Database → Data`.
2. افتح المجموعة `profiles`.
3. افتح مستند العميل باستخدام UID الموجود في `Authentication → Users`.
4. أنشئ أو عدّل الحقل:

```text
credits
Type: number
Value: 50
```

يمكنك تعديل `credits` من لوحة Firebase بصفتك مالك المشروع، حتى لو كانت قواعد Firestore تمنع العميل من تعديله.

لا تحذف الحقول الأخرى من مستند العميل. سننشئ لاحقاً لوحة مالك آمنة بعد اكتمال الموقع وربط الدفع.

## قاعدة البيانات

Firestore لا يحتاج إنشاء جدول يدوياً. عند إنشاء الحساب ينشأ المستند:

```text
profiles/{uid}
```

بحقول أساسية:

```text
credits: 0
totalCreditsPurchased: 0
emailVerified: false
```

الخادم ينشئ أيضاً:

```text
creditTransactions/{id}
generations/{replicatePredictionId}
```

انشر محتوى `firestore.rules` من Firebase Console → Firestore Database → Rules.

## Replicate

تستخدم الخدمة نموذج `black-forest-labs/flux-schnell` لإنشاء صورة من وصف نصي. الخادم يخصم النقطة أولاً، وإذا رفض Replicate الطلب يعيد النقطة تلقائياً. النتيجة تُتابع من خلال `/api/replicate-status`، ولا يخرج توكن Replicate إلى المتصفح.

## النشر

ارفع محتويات مجلد `dab` إلى Vercel، وليس ملف ZIP نفسه إذا كان Vercel لا يفك الضغط تلقائياً. يجب أن تكون هذه الملفات في الجذر:

```text
index.html
services.html
api/generate-image.js
api/replicate-status.js
package.json
```

بعد أول نشر، أضف متغيرات Vercel ثم أعد النشر. اختبر بحساب موثق ورصيد مضاف يدوياً من Firebase Console.
