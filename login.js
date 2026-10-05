const { supabase, errorMessage } = window.dhiban;
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

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        status.textContent = errorMessage(error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'تسجيل الدخول 🔓';
        return;
    }

    window.location.replace('services.html');
});
