import './firebase.js';
const { auth, onAuthStateChanged } = window.dhibanFirebase;
const modal = document.getElementById('imageModal');
const openButton = document.getElementById('openImageService');
const closeButton = document.getElementById('closeImageModal');
const promptInput = document.getElementById('imagePrompt');
const generateButton = document.getElementById('generateImage');
const setup = document.getElementById('imageSetup');
const progress = document.getElementById('imageProgress');
const result = document.getElementById('imageResult');
const status = document.getElementById('imageStatus');
const progressFill = document.getElementById('imageProgressFill');
const progressText = document.getElementById('imageProgressText');
const outputImage = document.getElementById('generatedImage');
const downloadButton = document.getElementById('downloadImage');
let user = null;
let selectedStyle = 'فاخر وإعلاني';
let pollTimer = null;

const setStatus = (message) => { status.textContent = message; status.className = 'form-status'; };
const token = () => user?.getIdToken();

onAuthStateChanged(auth, (currentUser) => { user = currentUser; });

document.querySelectorAll('.template-card').forEach((card) => card.addEventListener('click', () => {
  document.querySelectorAll('.template-card').forEach((item) => item.classList.remove('selected'));
  card.classList.add('selected'); selectedStyle = card.dataset.style;
}));

openButton.addEventListener('click', () => {
  if (!window.dhibanAccount?.profile || Number(window.dhibanAccount.profile.credits || 0) < 1) return alert('لا يوجد رصيد. اشحن رصيدك أولاً لاستخدام الخدمة.');
  modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
});
closeButton.addEventListener('click', () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); });
modal.addEventListener('click', (event) => { if (event.target === modal) modal.classList.remove('open'); });

generateButton.addEventListener('click', async () => {
  const description = promptInput.value.trim();
  if (description.length < 8) return setStatus('اكتب وصفاً أوضح للصورة، 8 أحرف على الأقل.');
  if (!user) return setStatus('انتهت الجلسة. سجّل الدخول مرة أخرى.');
  generateButton.disabled = true; setup.style.display = 'none'; progress.classList.add('active'); result.classList.remove('active');
  progressFill.style.width = '8%'; progressText.textContent = 'جارٍ خصم نقطة وبدء الطلب...';
  try {
    const idToken = await token();
    const start = await fetch('/api/generate-image', { method: 'POST', headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `Style: ${selectedStyle}. ${description}` }) });
    const startData = await start.json();
    if (!start.ok) throw new Error(startData.error || 'تعذر بدء إنشاء الصورة.');
    let attempts = 0;
    pollTimer = setInterval(async () => {
      attempts += 1; progressFill.style.width = `${Math.min(94, attempts * 5)}%`; progressText.textContent = `ذيبان يجهز صورتك... ${attempts * 3} ثانية`;
      try {
        const pollToken = await token();
        const response = await fetch(`/api/replicate-status?id=${encodeURIComponent(startData.id)}`, { headers: { Authorization: `Bearer ${pollToken}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'تعذر متابعة الطلب.');
        if (data.status === 'succeeded') { clearInterval(pollTimer); showResult(data.output); }
        if (['failed', 'canceled'].includes(data.status)) { clearInterval(pollTimer); throw new Error(data.error || 'فشل إنشاء الصورة وتمت إعادة النقطة إلى رصيدك.'); }
        if (attempts >= 40) { clearInterval(pollTimer); throw new Error('استغرق الطلب وقتاً طويلاً. تحقق من النتيجة لاحقاً.'); }
      } catch (error) { if (pollTimer) clearInterval(pollTimer); showError(error); }
    }, 3000);
  } catch (error) { showError(error); }
});

function showResult(output) {
  const url = Array.isArray(output) ? output[0] : output;
  if (!url) return showError(new Error('لم تصل الصورة من Replicate.'));
  progress.classList.remove('active'); result.classList.add('active'); outputImage.src = url; outputImage.dataset.url = url;
  downloadButton.onclick = () => { const link = document.createElement('a'); link.href = url; link.download = 'dhiban-generated-image.png'; link.target = '_blank'; link.click(); };
  generateButton.disabled = false;
  window.dhibanAccount?.refresh?.();
}
function showError(error) { progress.classList.remove('active'); setup.style.display = 'block'; generateButton.disabled = false; setStatus(error.message || 'حدث خطأ.'); }
