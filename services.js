import './firebase.js';

const { auth, onAuthStateChanged, signOut, getProfile } = window.dhibanFirebase;

const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
};

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace('login.html');
        return;
    }

    try {
        const profile = await getProfile(user.uid);
        if (!profile) {
            setText('trialStatus', 'لم يتم العثور على ملف الحساب. تأكد من نشر Firestore Rules ثم أنشئ الحساب من جديد.');
            return;
        }

        const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.displayName || 'يا ذيبان';
        setText('userGreeting', `أهلاً بك، ${fullName} 🐺`);
        setText('profileName', fullName);
        setText('profileEmail', user.email || '—');
        setText('profilePhone', profile.phone || 'غير مضاف');
        setText('profileRequests', profile.freeRequestsLeft ?? 0);

        if (profile.isSubscribed) {
            setText('subBadge', profile.subscriptionType === 'yearly' ? 'مشترك (سنوي ⭐)' : 'مشترك (شهري 🚀)');
            setText('trialStatus', 'حسابك مشترك ويمكنك استخدام الخدمات المتاحة.');
        } else {
            setText('trialStatus', `رصيد التجربة المجانية المتبقي لديك: ${profile.freeRequestsLeft ?? 0} طلب.`);
        }
    } catch (error) {
        console.error(error);
        setText('trialStatus', 'تعذر تحميل بيانات الحساب. تأكد من Firestore Rules وإعداد المشروع.');
    }
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.replace('index.html');
});

document.querySelectorAll('.plan-btn').forEach((button) => {
    button.addEventListener('click', () => {
        const plan = button.dataset.plan === 'yearly' ? 'السنوية' : 'الشهرية';
        alert(`الباقة ${plan} جاهزة، وسيتم تفعيل الدفع الإلكتروني بعد ربط بوابة دفع آمنة.`);
    });
});
