const { getAdmin, requireUser, json } = require('./_server');
const COSTS = { pdf_images: 10, pdf_text: 10, pdf_merge: 10, image_compress: 5, image_convert: 5, background_remove: 10, qr_code: 5 };
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const user = await requireUser(req);
    const service = String(req.body?.service || '');
    const cost = COSTS[service];
    if (!cost) return json(res, 400, { error: 'الخدمة غير معروفة.' });
    const adminSdk = getAdmin(); const db = adminSdk.firestore();
    const profileRef = db.collection('profiles').doc(user.uid); const chargeRef = db.collection('creditTransactions').doc();
    let remaining = 0;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(profileRef);
      if (!snap.exists) throw Object.assign(new Error('لم يتم العثور على ملف الحساب.'), { status: 404 });
      const credits = Number(snap.data().credits || 0);
      if (credits < cost) throw Object.assign(new Error(`هذه الخدمة تحتاج ${cost} نقاط. رصيدك الحالي ${credits} نقاط.`), { status: 402 });
      remaining = credits - cost;
      tx.update(profileRef, { credits: remaining, updatedAt: adminSdk.firestore.FieldValue.serverTimestamp() });
      tx.set(chargeRef, { uid: user.uid, service, amount: -cost, type: 'usage', createdAt: adminSdk.firestore.FieldValue.serverTimestamp() });
    });
    return json(res, 200, { chargeId: chargeRef.id, cost, credits: remaining });
  } catch (error) { return json(res, error.status || 500, { error: error.message || 'تعذر خصم الرصيد.' }); }
};
