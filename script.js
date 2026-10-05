import './firebase.js';

const { auth, onAuthStateChanged, signOut, getProfile } = window.dhibanFirebase;

async function checkNavbar() {
    const authNavButtons = document.getElementById('authNavButtons');
    if (!authNavButtons) return;

    onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        const profile = await getProfile(user.uid);
        const name = profile?.firstName || user.displayName || 'يا ذيبان';

        authNavButtons.innerHTML = `
            <span class="text-cyan-300 font-bold text-sm">مرحباً، ${name} 🐺</span>
            <a href="services.html" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition text-sm">لوحة الخدمات</a>
            <button id="logoutBtn" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-300 font-bold border border-red-500/20 transition text-sm">خروج</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            await signOut(auth);
            window.location.reload();
        });
    });
}

document.addEventListener('DOMContentLoaded', checkNavbar);
