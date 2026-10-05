import './firebase.js';

const { auth, signInWithEmailAndPassword, arabicError } = window.dhibanFirebase;
const form = document.getElementById('loginForm');
const submitBtn = form.querySelector('button[type="submit"]');
const status = document.getElementById('formStatus');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري تسجيل الدخول...';

    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.replace('services.html');
    } catch (error) {
        status.textContent = arabicError(error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'تسجيل الدخول 🔓';
    }
});
