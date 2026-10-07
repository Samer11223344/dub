import './firebase.js';
const { auth, onAuthStateChanged, signOut, getProfile, syncEmailVerification, reload } = window.dhibanFirebase;
const text = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
let currentUser = null;
let currentProfile = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.replace('login.html');
  currentUser = user;
  await reload(user);
  if (!user.emailVerified) return location.replace('login.html?unverified=1');
  try {
    currentProfile = await getProfile(user.uid);
    if (!currentProfile) return text('accountStatus', 'لم يتم العثور على ملف الحساب.');
    await syncEmailVerification(user);
    const name = `${currentProfile.firstName || ''} ${currentProfile.lastName || ''}`.trim() || user.displayName || 'يا ذيبان';
    text('userGreeting', `أهلاً بك، ${name}`); text('profileName', name); text('profileEmail', user.email || '—'); text('profilePhone', currentProfile.phone || 'غير مضاف');
    text('creditBalance', Number(currentProfile.credits || 0));
    text('accountStatus', Number(currentProfile.credits || 0) > 0 ? 'رصيدك جاهز لاستخدام خدمات ذيبان.' : 'لا يوجد رصيد حالياً. اشحن رصيدك للبدء.');
    window.dhibanAccount = { user, profile: currentProfile, refresh: async () => { currentProfile = await getProfile(user.uid); text('creditBalance', Number(currentProfile?.credits || 0)); return currentProfile; } };
  } catch (error) { console.error(error); text('accountStatus', 'تعذر تحميل بيانات الحساب.'); }
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => { await signOut(auth); location.replace('index.html'); });
document.querySelectorAll('.credit-plan-btn').forEach((button) => button.addEventListener('click', () => alert(`اخترت باقة ${button.dataset.credits} نقطة بسعر ${button.dataset.price} ريال. سنربط بوابة الدفع بعد اعتماد الباقات.`)));
