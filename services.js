import './firebase.js';
const { auth, onAuthStateChanged, signOut, getProfile, syncEmailVerification, reload } = window.dhibanFirebase;
const text = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
let currentProfile = null;
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.replace('login.html');
  await reload(user);
  if (!user.emailVerified) return location.replace('login.html?unverified=1');
  try {
    currentProfile = await getProfile(user.uid);
    if (!currentProfile) return text('accountStatus', 'لم يتم العثور على ملف الحساب.');
    await syncEmailVerification(user);
    const name = `${currentProfile.firstName || ''} ${currentProfile.lastName || ''}`.trim() || user.displayName || 'تاجر ذيبان';
    text('userGreeting', name); text('profileName', name); text('profileEmail', user.email || '—'); text('creditBalance', Number(currentProfile.credits || 0));
    text('accountStatus', Number(currentProfile.credits || 0) ? 'رصيدك جاهز لاستخدام الأدوات.' : 'لا يوجد رصيد. أضف رصيداً من Firebase قبل الاستخدام.');
    text('verificationStatus', 'البريد موثق');
    window.dhibanAccount = { user, profile: currentProfile, refresh: async () => { currentProfile = await getProfile(user.uid); text('creditBalance', Number(currentProfile?.credits || 0)); return currentProfile; } };
  } catch (error) { console.error(error); text('accountStatus', 'تعذر تحميل بيانات الحساب.'); }
});
document.getElementById('logoutBtn')?.addEventListener('click', async () => { await signOut(auth); location.replace('index.html'); });
