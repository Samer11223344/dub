# ذيبان AI — نسخة Firebase

هذه النسخة لا تستخدم Supabase. الربط الآن مع:

- Firebase Authentication لتسجيل الحسابات والدخول.
- Cloud Firestore لحفظ بيانات `profiles`.
- Vercel لاستضافة ملفات HTML/CSS/JavaScript.

## إعداد Firebase

1. من Firebase فعّل:
   `Build → Authentication → Sign-in method → Email/Password`.
2. تأكد من إنشاء Firestore Database.
3. من Firestore افتح تبويب **Rules**.
4. الصق محتوى ملف `firestore.rules` ثم اضغط **Publish**.
5. من Authentication > Settings > Authorized domains، أضف:
   `dub-beta-ivory.vercel.app`
   إذا لم يكن موجوداً تلقائياً.

## النشر على Vercel

ارفع الملفات الموجودة في هذا المجلد، وتأكد أن `index.html` موجود في جذر المشروع. لا تضع الملفات داخل مجلد إضافي داخل مجلد النشر.

## مكان مشاهدة المستخدمين

- حسابات الدخول: `Authentication → Users`.
- بيانات الاسم والهاتف والرصيد: `Firestore Database → Data → profiles`.

عند إنشاء أول مستخدم، ينشئ الموقع مستنداً بهذا الشكل:

```text
profiles/{Firebase UID}
```

ويحتوي على `firstName`, `lastName`, `phone`, `birthDate`, `freeRequestsLeft`, `isSubscribed`, و`subscriptionType`.

## مهم

إعداد Firebase الظاهر في `firebase.js` هو إعداد Web App عام، وليس Service Account. لا تضع أبداً أي ملف JSON خاص أو Service Account key في الموقع.
