import './firebase.js';

const {
    auth,
    createUserWithEmailAndPassword,
    updateProfile,
    createProfile,
    arabicError
} = window.dhibanFirebase;

const form = document.getElementById('signupForm');
const submitBtn = document.getElementById('submitBtn');
const status = document.getElementById('formStatus');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري إنشاء الحساب...';

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    try {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credentials.user, { displayName: `${firstName} ${lastName}`.trim() });
        await createProfile(credentials.user, { firstName, lastName, phone, birthDate });
        window.location.replace('services.html');
    } catch (error) {
        status.textContent = arabicError(error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'تسجيل الحساب 🚀';
    }
});
