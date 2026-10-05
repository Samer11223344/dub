const { supabase, errorMessage } = window.dhiban;
const form = document.getElementById('signupForm');
const submitBtn = document.getElementById('submitBtn');
const status = document.getElementById('formStatus');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري إنشاء الحساب...';

    const first_name = document.getElementById('firstName').value.trim();
    const last_name = document.getElementById('lastName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const birth_date = document.getElementById('birthDate').value;
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${window.location.origin}/login.html`,
            data: { first_name, last_name, phone, birth_date }
        }
    });

    if (error) {
        status.textContent = errorMessage(error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'تسجيل الحساب 🚀';
        return;
    }

    if (data.session) {
        window.location.replace('services.html');
        return;
    }

    status.className = 'rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300';
    status.textContent = 'تم إنشاء الحساب. افتح بريدك الإلكتروني واضغط رابط التأكيد، ثم سجّل الدخول.';
    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = 'تسجيل الحساب 🚀';
});
