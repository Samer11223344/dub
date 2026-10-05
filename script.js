const { supabase } = window.dhiban;

async function checkNavbar() {
    const authNavButtons = document.getElementById('authNavButtons');
    if (!authNavButtons) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const profile = await window.dhiban.getProfile(session.user.id);
    const name = profile?.first_name || 'يا ذيبان';

    authNavButtons.innerHTML = `
        <span class="text-cyan-300 font-bold text-sm">مرحباً، ${name} 🐺</span>
        <a href="services.html" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition text-sm">لوحة الخدمات</a>
        <button id="logoutBtn" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-300 font-bold border border-red-500/20 transition text-sm">خروج</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.reload();
    });
}

document.addEventListener('DOMContentLoaded', checkNavbar);
