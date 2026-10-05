// اتصال Supabase المشترك لكل صفحات ذيبان AI
// ملاحظة: مفتاح publishable/anon آمن للواجهة الأمامية، أما service_role فلا يوضع هنا أبداً.
const DHIBAN_SUPABASE_URL = 'https://nywanqvgwqfmtvcdpyvl.supabase.co';
const DHIBAN_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_LyXSYKWjPZsrb8eFvEhekw_4catxbKb';

window.dhiban = window.dhiban || {};
window.dhiban.supabase = window.supabase.createClient(
    DHIBAN_SUPABASE_URL,
    DHIBAN_SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

window.dhiban.getProfile = async function (userId) {
    const { data, error } = await window.dhiban.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) throw error;
    return data;
};

window.dhiban.errorMessage = function (error) {
    const message = error?.message || '';
    if (message.toLowerCase().includes('email not confirmed')) {
        return 'بريدك الإلكتروني غير مؤكد. افتح رسالة Supabase ثم اضغط رابط التأكيد.';
    }
    if (message.toLowerCase().includes('invalid login credentials')) {
        return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    }
    if (message.toLowerCase().includes('user already registered')) {
        return 'هذا البريد مسجل مسبقاً. جرّب تسجيل الدخول بدلاً من إنشاء حساب جديد.';
    }
    return message || 'حدث خطأ غير متوقع. حاول مرة أخرى.';
};
