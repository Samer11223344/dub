import './firebase.js';

const { auth, onAuthStateChanged, getProfile, generateProductImage } = window.dhibanFirebase;
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
let selectedTemplate = 'فاخر ومضيء';
let uploadedUrl = '';
let previous = null;

const styles = [
    { name: 'مشهد فاخر', style: 'luxury editorial product photography, warm soft studio lighting, elegant premium background, realistic commercial advertising' },
    { name: 'ستايل عصري', style: 'modern minimal ecommerce product photography, clean gradient background, crisp softbox lighting, polished professional composition' },
    { name: 'طابع دافئ', style: 'warm natural lifestyle product photography, tasteful materials and subtle shadows, inviting premium atmosphere' },
    { name: 'حملة جريئة', style: 'bold high-end advertising campaign, dramatic lighting, dynamic composition, vivid but tasteful colors' }
];

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
    if (subscriber) pill.textContent = 'متاح ضمن اشتراكك';
    else if (trial) pill.textContent = 'تجربة واحدة متاحة';
    else {
        pill.textContent = 'مقفلة — اشترك للمتابعة';
        pill.parentElement.classList.add('service-locked');
        openBtn.textContent = 'الخدمة مقفلة 🔒';
    }
});

document.querySelectorAll('.template-card').forEach((card) => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.template-card').forEach((item) => item.classList.remove('selected'));
        card.classList.add('selected');
        selectedTemplate = card.querySelector('strong').textContent;
    });
});

openBtn.addEventListener('click', () => {
    if (!hasAccess()) {
        alert('الخدمة متاحة للمشتركين أو لمستخدم جديد لديه تجربة مجانية واحدة.');
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
    const saved = JSON.parse(localStorage.getItem('dhiban-last-image-style') || 'null');
    if (saved) {
        reusePrevious.checked = true;
        promptInput.value = saved.prompt || '';
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

generateBtn.addEventListener('click', async () => {
    if (!hasAccess()) { setStatus('الخدمة غير متاحة لهذا الحساب.'); return; }
    const file = fileInput.files[0];
    if (!file) { setStatus('ارفع صورة PNG أولاً.'); return; }
    const description = promptInput.value.trim();
    if (!description) { setStatus('اكتب وصفاً بسيطاً لما تريده في الصورة.'); return; }

    previous = { template: selectedTemplate, prompt: description };
    localStorage.setItem('dhiban-last-image-style', JSON.stringify(previous));
    setupState.style.display = 'none';
    progressState.classList.add('active');
    generateBtn.disabled = true;
    let elapsed = 0;
    const timer = setInterval(() => {
        elapsed += 1;
        countdown.textContent = Math.max(0, 30 - elapsed);
        progressFill.style.width = `${Math.min(92, elapsed * 3)}%`;
    }, 1000);

    try {
        const results = await Promise.all(styles.map((item) => {
            const prompt = `Edit the provided product image for a Saudi ecommerce brand named Dhiban AI. Preserve the exact product identity, shape, logo, colors, label text, and proportions. Do not add or change readable text. ${item.style}. The merchant selected the style "${selectedTemplate}". Merchant instructions: ${description}. Return one polished product image only, with no explanation.`;
            return generateProductImage(file, prompt);
        }));
        clearInterval(timer);
        progressFill.style.width = '100%';
        progressState.classList.remove('active');
        showResults(results);
        if (!profile?.isSubscribed) {
            localStorage.setItem(`dhiban-image-used-${user.uid}`, '1');
            pill.textContent = 'انتهت التجربة — اشترك للمتابعة';
            openBtn.textContent = 'الخدمة مقفلة 🔒';
        }
    } catch (error) {
        clearInterval(timer);
        progressState.classList.remove('active');
        setupState.style.display = 'grid';
        generateBtn.disabled = false;
        setStatus(error?.message || 'تعذر تجهيز الصور. تأكد من تفعيل Gemini وApp Check ثم حاول مرة أخرى.');
    }
});

function showResults(images) {
    resultGrid.innerHTML = '';
    images.forEach((imageUrl, index) => {
        const card = document.createElement('article');
        card.className = 'result-card';
        card.innerHTML = `<div class="result-preview template-${String.fromCharCode(97 + index)}"><img src="${imageUrl}" alt="${styles[index].name}"></div><h4>${styles[index].name}</h4><div class="result-actions"><button class="btn btn-outline save-result">حفظ</button><button class="btn btn-primary-custom download-result">تنزيل</button></div>`;
        card.querySelector('.save-result').addEventListener('click', (event) => {
            localStorage.setItem(`dhiban-last-result-${user.uid}`, imageUrl);
            event.currentTarget.textContent = 'تم الحفظ ✓';
            event.currentTarget.disabled = true;
        });
        card.querySelector('.download-result').addEventListener('click', () => {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `dhiban-${index + 1}.png`;
            link.click();
        });
        resultGrid.appendChild(card);
    });
    resultsState.classList.add('active');
}
