# ذيبان — أدوات رقمية بدون ذكاء اصطناعي

## الأدوات

- **تحويل PDF:** إلى صور PNG أو JPG، استخراج TXT، ودمج ملفات PDF.
- **ضغط الصور:** JPEG بجودة قابلة للاختيار.
- **تحويل صيغ الصور:** PNG وJPG وWEBP.
- **إزالة الخلفية:** إزالة الخلفيات المتجانسة محلياً. ليست قصاً ذكياً للأشخاص أو المنتجات ذات الخلفية المعقدة.
- **إنشاء QR Code:** نص أو رابط إلى PNG.

المعالجة الأساسية تتم داخل متصفح العميل، ولا يتم رفع ملفات العميل إلى خادم خارجي.

## تكلفة الرصيد

| الأداة | التكلفة |
|---|---:|
| PDF إلى PNG/JPG/TXT أو دمج PDF | 10 نقاط |
| ضغط الصور | 5 نقاط |
| تحويل صيغ الصور | 5 نقاط |
| إزالة الخلفية | 10 نقاط |
| QR Code | 5 نقاط |

## إعداد Vercel

أضف المتغير السري الوحيد:

```text
FIREBASE_SERVICE_ACCOUNT_JSON
```

قيمته هي محتوى Service Account JSON الخاص بـFirebase Admin. لا تضعه في HTML أو JavaScript أو GitHub.

من Firebase:

```text
Project settings → Service accounts → Generate new private key
```

بعد وضع المتغير في Vercel، نفّذ Redeploy.

## إضافة رصيد يدوياً

من Firebase Console:

```text
Firestore Database → Data → profiles → UID العميل
```

أضف أو عدّل:

```text
credits
Type: number
Value: 50
```

قواعد Firestore تمنع العميل من تعديل الرصيد بنفسه. تعديل المالك من لوحة Firebase مسموح لأنه يتم بصلاحيات مالك المشروع.

## الأمان

- لا توجد مفاتيح Replicate أو Gemini أو خدمات AI.
- الملفات لا تُرسل للخادم في الأدوات الأساسية.
- خصم الرصيد يتم من API Serverless بعد التحقق من Firebase ID Token.
- الرصيد يُخصم داخل Firestore transaction لمنع الخصم المتزامن الخاطئ.
- عند فشل العملية، يطلب المتصفح إعادة الرصيد، وتمنع قاعدة العملية إعادة الاسترجاع مرتين.
- لا يمكن للعميل الكتابة إلى `credits` أو سجلات المعاملات.

## النشر

يجب أن يكون مجلد `dab` هو Root Directory في Vercel، أو ارفع محتوياته مباشرة بحيث تكون البنية:

```text
index.html
services.html
package.json
api/charge.js
api/refund.js
```
