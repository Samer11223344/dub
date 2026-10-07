const { getAdmin, requireUser, json } = require('./_server');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  try {
    const user = await requireUser(req);
    const id = String(req.query?.id || '').trim();
    if (!id) return json(res, 400, { error: 'معرّف التوليد مفقود.' });

    const adminSdk = getAdmin();
    const db = adminSdk.firestore();
    const generationRef = db.collection('generations').doc(id);
    const generationSnap = await generationRef.get();
    if (!generationSnap.exists || generationSnap.data().uid !== user.uid) return json(res, 403, { error: 'لا يسمح لك بقراءة هذه العملية.' });

    const response = await fetch(`https://api.replicate.com/v1/predictions/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` }
    });
    const prediction = await response.json();
    if (!response.ok) return json(res, response.status, { error: prediction.detail || 'تعذر قراءة حالة Replicate.' });

    const terminalFailure = ['failed', 'canceled'].includes(prediction.status);
    if (terminalFailure && !generationSnap.data().refunded) {
      await db.runTransaction(async (tx) => {
        const latest = await tx.get(generationRef);
        if (!latest.exists || latest.data().refunded) return;
        tx.update(db.collection('profiles').doc(user.uid), {
          credits: adminSdk.firestore.FieldValue.increment(1),
          updatedAt: adminSdk.firestore.FieldValue.serverTimestamp()
        });
        tx.update(generationRef, { refunded: true, status: prediction.status });
      });
    }

    if (prediction.status === 'succeeded') {
      await generationRef.update({ status: prediction.status, output: prediction.output || null, completedAt: adminSdk.firestore.FieldValue.serverTimestamp() });
    }
    return json(res, 200, { status: prediction.status, output: prediction.output || null, error: prediction.error || null });
  } catch (error) {
    return json(res, Number.isInteger(error.status) ? error.status : 500, { error: error.message || 'تعذر متابعة الصورة.' });
  }
};
