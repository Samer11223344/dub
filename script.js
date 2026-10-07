import './firebase.js';
const{auth,onAuthStateChanged,signOut,getProfile}=window.dhibanFirebase;
const nav=document.getElementById('authNavButtons');
if(nav)onAuthStateChanged(auth,async user=>{if(!user)return;const p=await getProfile(user.uid).catch(()=>null),name=p?.firstName||user.displayName||'يا ذيبان';nav.innerHTML=`<span class="text-link">مرحباً، ${name} 🐺</span><a class="btn btn-primary-custom" href="services.html">لوحة الخدمات</a><button id="logoutBtn" class="btn btn-danger">خروج</button>`;document.getElementById('logoutBtn').onclick=async()=>{await signOut(auth);location.reload();};});
