import './firebase.js';

const { auth, onAuthStateChanged, getProfile } = window.dhibanFirebase;
const modal = document.getElementById('imageModal');
const openBtn = document.getElementById('openImageService');
const closeBtn = document.getElementById('closeImageModal');
const fileInput = document.getElementById('productImage');
const uploadZone = document.getElementById('uploadZone');
const placeholder = document.getElementById('uploadPlaceholder');
const promptInput = document.getElementById('productPrompt');
const generateBtn = document.getElementById('generateImages');
const status = document.getElementById('imageServiceStatus');
const setupState = document.getElementById('setupState');
const progressState = document.getElementById('progressState');
const resultsState = document.getElementById('resultsState');
const progressFill = document.getElementById('progressFill');
const countdown = document.getElementById('countdown');
const resultGrid = document.getElementById('resultGrid');
const pill = document.getElementById('imageServicePill');
const reusePrevious = document.getElementById('reusePrevious');
let profile = null;
let user = null;
let selectedTemplate = 'template-a';
let uploadedUrl = '';
let previous = null;

const setStatus = (message, success = false) => {
    status.textContent = message;
    status.className = success ? 'form-status success' : 'form-status';
};

const hasAccess = () => Boolean(profile?.isSubscribed || (profile?.freeRequestsLeft > 0 && !localStorage.getItem(`dhiban-image-used-${user?.uid}`)));

onAuthStateChanged(auth, async (currentUser) => {
    if (!currentUser) return;
    user = currentUser;
    profile = await getProfile(user.uid).catch(() => null);
    const subscriber = Boolean(profile?.isSubscribed);
    const trial = Boolean(profile?.freeRequestsLeft > 0 && !localStorage.getItem(`dhiban-image-used-${user.uid}`));
    if (subscriber) {
        pill.textContent = 'متاح ضمن اشتراكك';
    } else if (trial) {
        pill.textContent = 'تجربة واحدة متاحة';
    } else {
        pill.textContent = 'مقفلة — اشترك للمتابعة';
        pill.parentElement.classList.add('service-locked');
        openBtn.textContent = 'الخدمة مقفلة 🔒';
    }
});

document.querySelectorAll('.template-card').forEach((card) => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.template-card').forEach((item) => item.classList.remove('selected'));
        card.classList.add('selected');
        selectedTemplate = card.dataset.template;
    });
});

openBtn.addEventListener('click', () => {
    if (!hasAccess()) {
        setStatus('هذه الخدمة متاحة للمشتركين فقط، أو لمستخدم جديد لديه تجربة واحدة متبقية.');
        alert('الخدمة مقفلة. اشترك في إحدى الباقات أو استخدم حساباً جديداً لديه تجربة مجانية.');
        return;
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
});

const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
};
closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });

document.getElementById('newImageRequest').addEventListener('click', () => {
    resultsState.classList.remove('active');
    setupState.style.display = 'grid';
    if (previous) {
        reusePrevious.checked = true;
        selectedTemplate = previous.template;
        promptInput.value = previous.prompt;
    }
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (file.type !== 'image/png') {
        fileInput.value = '';
        setStatus('نقبل صور PNG فقط. اختر ملفاً امتداده PNG.');
        return;
    }
    if (file.size > 8 * 1024 * 1024) {
        fileInput.value = '';
        setStatus('حجم الصورة كبير. الحد الأقصى 8 ميجابايت.');
        return;
    }
    if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
    uploadedUrl = URL.createObjectURL(file);
    uploadZone.classList.add('has-file');
    placeholder.innerHTML = `<img src="${uploadedUrl}" alt="معاينة صورة المنتج"><span>تم اختيار الصورة — اضغط لتغييرها</span>`;
    setStatus('');
});

generateBtn.addEventListener('click', () => {
    if (!hasAccess()) { setStatus('الخدمة غير متاحة لهذا الحساب.'); return; }
    if (!fileInput.files[0]) { setStatus('ارفع صورة PNG أولاً.'); return; }
    if (!promptInput.value.trim()) { setStatus('اكتب وصفاً بسيطاً لما تريده في الصورة.'); return; }
    previous = { template: selectedTemplate, prompt: promptInput.value.trim() };
    localStorage.setItem('dhiban-last-image-style', JSON.stringify(previous));
    setupState.style.display = 'none';
    progressState.classList.add('active');
    let remaining = 30;
    countdown.textContent = remaining;
    progressFill.style.width = '0%';
    const timer = setInterval(() => {
        remaining -= 1;
        countdown.textContent = remaining;
        progressFill.style.width = `${((30 - remaining) / 30) * 100}%`;
        if (remaining <= 0) {
            clearInterval(timer);
            progressState.classList.remove('active');
            showResults();
            if (!profile?.isSubscribed) {
                localStorage.setItem(`dhiban-image-used-${user.uid}`, '1');
                pill.textContent = 'انتهت التجربة — اشترك للمتابعة';
                openBtn.textContent = 'الخدمة مقفلة 🔒';
            }
        }
    }, 1000);
});

function showResults() {
    const names = ['مشهد فاخر', 'ستايل عصري', 'طابع دافئ', 'حملة جريئة'];
    const templates = ['template-a', 'template-b', 'template-c', 'template-d'];
    resultGrid.innerHTML = '';
    templates.forEach((template, index) => {
        const card = document.createElement('article');
        card.className = 'result-card';
        card.innerHTML = `<div class="result-preview ${template}"><img src="${uploadedUrl}" alt="نتيجة ${names[index]}"></div><h4>${names[index]}</h4><div class="result-actions"><button class="btn btn-outline save-result">حفظ</button><button class="btn btn-primary-custom download-result">تنزيل</button></div>`;
        card.querySelector('.save-result').addEventListener('click', (event) => {
            event.currentTarget.textContent = 'تم الحفظ ✓';
            event.currentTarget.disabled = true;
        });
        card.querySelector('.download-result').addEventListener('click', () => {
            const link = document.createElement('a');
            link.href = uploadedUrl;
            link.download = `dhiban-${index + 1}.png`;
            link.click();
        });
        resultGrid.appendChild(card);
    });
    resultsState.classList.add('active');
}
