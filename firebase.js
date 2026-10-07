// Firebase المشترك — ذيبان AI
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence, sendEmailVerification, sendPasswordResetEmail, reload, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAl2opeNhwAqPfYgxKBP85VAYbKS509hPg',
  authDomain: 'duban-3d487.firebaseapp.com',
  projectId: 'duban-3d487',
  storageBucket: 'duban-3d487.firebasestorage.app',
  messagingSenderId: '233528749300',
  appId: '1:233528749300:web:a92b6534a529f0f8a682a1'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
await setPersistence(auth, browserLocalPersistence);

const verificationSettings = { url: `${window.location.origin}/login.html`, handleCodeInApp: false };

function arabicError(error) {
  const messages = {
    'auth/email-already-in-use': 'هذا البريد مسجل مسبقاً. جرّب تسجيل الدخول.',
    'auth/invalid-email': 'صيغة البريد الإلكتروني غير صحيحة.',
    'auth/weak-password': 'كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.',
    'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'auth/user-not-found': 'لا يوجد حساب بهذا البريد الإلكتروني.',
    'auth/wrong-password': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'auth/too-many-requests': 'محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى.',
    'auth/network-request-failed': 'تعذر الاتصال بالإنترنت. حاول مرة أخرى.',
    'auth/operation-not-allowed': 'تسجيل البريد وكلمة المرور غير مفعّل من Firebase.',
    'auth/unauthorized-continue-uri': 'الدومين غير مضاف إلى Authorized domains في Firebase.',
    'permission-denied': 'تم رفض الوصول إلى Firestore. تأكد من نشر القواعد.'
  };
  return messages[error?.code] || error?.message || 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}

async function getProfile(userId) {
  const snapshot = await getDoc(doc(db, 'profiles', userId));
  return snapshot.exists() ? snapshot.data() : null;
}

async function createProfile(user, profileData) {
  await setDoc(doc(db, 'profiles', user.uid), {
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    phone: profileData.phone,
    birthDate: profileData.birthDate,
    email: user.email || '',
    emailVerified: false,
    credits: 0,
    totalCreditsPurchased: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

async function syncEmailVerification(user) {
  await setDoc(doc(db, 'profiles', user.uid), { emailVerified: user.emailVerified, updatedAt: serverTimestamp() }, { merge: true });
}

window.dhibanFirebase = { app, auth, db, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, getProfile, createProfile, syncEmailVerification, sendEmailVerification, sendPasswordResetEmail, reload, verificationSettings, arabicError };
