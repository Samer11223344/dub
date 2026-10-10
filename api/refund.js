const { getAdmin, requireUser, json } = require('./_server');
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const user = await requireUser(req); const chargeId = String(req.body?.chargeId || '');
    if (!chargeId) return json(res, 400, { error: 'رقم العملية مفقود.' });
    const adminSdk = getAdmin(); const db = adminSdk.firestore(); const txRef = db.collection('creditTransactions').doc(chargeId); const profileRef = db.collection('profiles').doc(user.uid);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(txRef);
      if (!snap.exists || snap.data().uid !== user.uid || snap.data().type !== 'usage') throw Object.assign(new Error('عملية غير صالحة.'), { status: 403 });
      if (snap.data().refunded) return;
      tx.update(profileRef, { credits: adminSdk.firestore.FieldValue.increment(Math.abs(Number(snap.data().amount || 0))), updatedAt: adminSdk.firestore.FieldValue.serverTimestamp() });
      tx.update(txRef, { refunded: true, refundedAt: adminSdk.firestore.FieldValue.serverTimestamp() });
    });
    return json(res, 200, { ok: true });
  } catch (error) { return json(res, error.status || 500, { error: error.message || 'تعذر إعادة الرصيد.' }); }
};
