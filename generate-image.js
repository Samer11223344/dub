const { getAdmin, requireUser, json } = require('./_server');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  let user;
  try {
    user = await requireUser(req);
    const prompt = String(req.body?.prompt || '').trim();
    if (prompt.length < 8 || prompt.length > 1600) return json(res, 400, { error: 'اكتب وصفاً بين 8 و1600 حرف.' });

    const adminSdk = getAdmin();
    const db = adminSdk.firestore();
    const profileRef = db.collection('profiles').doc(user.uid);
    let remainingCredits = 0;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(profileRef);
      if (!snap.exists) throw Object.assign(new Error('لم يتم العثور على ملف الحساب.'), { status: 404 });
      const data = snap.data();
      const credits = Number.isInteger(data.credits) ? data.credits : 0;
      if (credits < 1) throw Object.assign(new Error('لا يوجد رصيد كافٍ. اشحن رصيدك أولاً.'), { status: 402 });
      remainingCredits = credits - 1;
      tx.update(profileRef, {
        credits: remainingCredits,
        updatedAt: adminSdk.firestore.FieldValue.serverTimestamp()
      });
    });

    let prediction;
    try {
      const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: {
            prompt: `Create a polished commercial product image for a Saudi ecommerce brand. ${prompt}. High quality, professional lighting, clean composition, no watermarks, no unnecessary text.`,
            aspect_ratio: '1:1',
            output_format: 'png',
            output_quality: 90,
            num_outputs: 1
          }
        })
      });
      prediction = await response.json();
      if (!response.ok) throw new Error(prediction.detail || 'Replicate request failed');
    } catch (error) {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(profileRef);
        if (snap.exists) tx.update(profileRef, {
          credits: adminSdk.firestore.FieldValue.increment(1),
          updatedAt: adminSdk.firestore.FieldValue.serverTimestamp()
        });
      });
      throw error;
    }

    await db.collection('generations').doc(prediction.id).set({
      uid: user.uid,
      status: prediction.status || 'starting',
      prompt,
      chargedCredits: 1,
      refunded: false,
      createdAt: adminSdk.firestore.FieldValue.serverTimestamp()
    });

    return json(res, 200, { id: prediction.id, status: prediction.status, credits: remainingCredits });
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    return json(res, status, { error: error.message || 'تعذر بدء إنشاء الصورة.' });
  }
};
