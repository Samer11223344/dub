import './firebase.js';

const { auth } = window.dhibanFirebase;
const modal = document.getElementById('toolModal');
const modalTitle = document.getElementById('modalTitle');
const modalKicker = document.getElementById('modalKicker');
const modalBody = document.getElementById('modalBody');
const statusBox = document.getElementById('toolStatus');
const outputBox = document.getElementById('toolOutput');
let activeTool = null;
let pdfjsPromise = null;
let pdfLibPromise = null;
let jszipPromise = null;
let qrcodePromise = null;

const configs = {
  pdf: { title: 'تحويل PDF', cost: '10 نقاط للمعالجة', kicker: 'ملفات PDF' },
  compress: { title: 'ضغط الصور', cost: '5 نقاط', kicker: 'تحسين الحجم' },
  convert: { title: 'تحويل صيغ الصور', cost: '5 نقاط', kicker: 'تحويل الملفات' },
  background: { title: 'إزالة الخلفية', cost: '10 نقاط', kicker: 'معالجة محلية' },
  qr: { title: 'إنشاء QR Code', cost: '5 نقاط', kicker: 'رمز سريع' }
};

function setStatus(message = '', success = false) { statusBox.textContent = message; statusBox.className = success ? 'tool-status success' : 'tool-status'; }
function openModal(tool) { activeTool = tool; const config = configs[tool]; modalKicker.textContent = `${config.kicker} · ${config.cost}`; modalTitle.textContent = config.title; statusBox.textContent = ''; outputBox.innerHTML = ''; modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); renderForm(tool); }
function closeModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); activeTool = null; }
function fileField(id, accept, multiple = false, label = 'اختر ملفاً') { return `<div class="tool-field"><label for="${id}">${label}</label><div class="tool-file"><input id="${id}" type="file" accept="${accept}" ${multiple ? 'multiple' : ''} required></div></div>`; }
function actionButton(label, cost) { return `<button id="runTool" class="btn btn-primary-custom tool-action" type="submit">${label} — ${cost}</button>`; }

function renderForm(tool) {
  const forms = {
    pdf: `<form id="toolForm">${fileField('pdfFiles', '.pdf', true, 'ملفات PDF')}<div class="tool-field"><label for="pdfMode">اختر التحويل</label><select id="pdfMode"><option value="images-png">PDF إلى صور PNG</option><option value="images-jpg">PDF إلى صور JPG</option><option value="text">PDF إلى ملف نصي TXT</option><option value="merge">دمج عدة ملفات PDF</option></select></div><p class="muted">تحويل الصور يعالج كل صفحات الملف ويضعها في ملف ZIP عند الحاجة.</p>${actionButton('ابدأ التحويل', '10 نقاط')}</form>`,
    compress: `<form id="toolForm">${fileField('imageFile', 'image/*', false, 'الصورة المراد ضغطها')}<div class="tool-field"><label for="quality">مستوى الجودة</label><select id="quality"><option value="0.9">جودة عالية — حجم أكبر</option><option value="0.75" selected>متوازنة — ننصح بها</option><option value="0.55">ضغط قوي — حجم أصغر</option></select></div>${actionButton('ضغط الصورة', '5 نقاط')}</form>`,
    convert: `<form id="toolForm">${fileField('imageFile', 'image/*', false, 'الصورة المراد تحويلها')}<div class="tool-field"><label for="format">الصيغة الجديدة</label><select id="format"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WEBP</option></select></div>${actionButton('تحويل الصورة', '5 نقاط')}</form>`,
    background: `<form id="toolForm">${fileField('imageFile', 'image/*', false, 'صورة بخلفية متجانسة')}<div class="tool-field"><label for="threshold">حساسية الإزالة</label><select id="threshold"><option value="25">منخفضة — يحافظ على التفاصيل</option><option value="45" selected>متوازنة</option><option value="70">عالية — لخلفية واضحة جداً</option></select></div><p class="muted">هذه أداة محلية مناسبة للخلفيات ذات اللون المتجانس، وليست قصاً ذكياً للأشخاص.</p>${actionButton('إزالة الخلفية', '10 نقاط')}</form>`,
    qr: `<form id="toolForm"><div class="tool-field"><label for="qrText">الرابط أو النص</label><textarea id="qrText" required placeholder="https://example.com أو أي نص تريده"></textarea></div><div class="tool-form-grid"><div class="tool-field"><label for="qrSize">الحجم</label><select id="qrSize"><option value="256">256px</option><option value="512" selected>512px</option><option value="1024">1024px</option></select></div><div class="tool-field"><label for="qrColor">لون الرمز</label><input id="qrColor" type="color" value="#07101f"></div></div>${actionButton('إنشاء QR Code', '5 نقاط')}</form>`
  };
  modalBody.innerHTML = forms[tool];
  document.getElementById('toolForm').addEventListener('submit', (event) => { event.preventDefault(); runTool(tool); });
}

async function getToken() { const user = auth.currentUser; if (!user) throw new Error('انتهت الجلسة. سجّل الدخول مرة أخرى.'); return user.getIdToken(); }
async function charge(service) { const response = await fetch('/api/charge', { method: 'POST', headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ service }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'تعذر خصم الرصيد.'); return data; }
async function refund(chargeId) { if (!chargeId) return; await fetch('/api/refund', { method: 'POST', headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ chargeId }) }).catch(() => {}); }
async function runTool(tool) {
  const button = document.getElementById('runTool'); button.disabled = true; setStatus('جارٍ التحقق من الرصيد...'); outputBox.innerHTML = '';
  let chargeInfo;
  try { chargeInfo = await charge(tool === 'pdf' ? `pdf_${document.getElementById('pdfMode').value.startsWith('images') ? 'images' : document.getElementById('pdfMode').value}` : `${tool === 'compress' ? 'image_compress' : tool === 'convert' ? 'image_convert' : tool === 'background' ? 'background_remove' : 'qr_code'}`); setStatus('جاري تنفيذ الأداة...', true); await ({ pdf: runPdf, compress: runCompress, convert: runConvert, background: runBackground, qr: runQr }[tool])(); await window.dhibanAccount?.refresh?.(); setStatus('تمت العملية بنجاح.', true); } catch (error) { if (chargeInfo?.chargeId) await refund(chargeInfo.chargeId); setStatus(error.message || 'تعذر تنفيذ العملية. تمت إعادة النقاط إن أمكن.'); } finally { button.disabled = false; }
}

async function loadPdfJs() { if (!pdfjsPromise) pdfjsPromise = import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs').then((lib) => { lib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs'; return lib; }); return pdfjsPromise; }
async function loadPdfLib() { if (!pdfLibPromise) pdfLibPromise = import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm'); return pdfLibPromise; }
async function loadZip() { if (!jszipPromise) jszipPromise = import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm').then((m) => m.default || m); return jszipPromise; }
async function loadQr() { if (!qrcodePromise) qrcodePromise = import('https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm').then((m) => m.default || m); return qrcodePromise; }
function downloadBlob(blob, name) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
function addDownload(blob, name, label = 'تنزيل الملف') { const row = document.createElement('div'); row.className = 'output-item'; const span = document.createElement('span'); span.textContent = name; const button = document.createElement('button'); button.className = 'btn btn-outline'; button.textContent = label; button.onclick = () => downloadBlob(blob, name); row.append(span, button); outputBox.appendChild(row); }
function readFile(file) { return file.arrayBuffer(); }
function imageFromFile(file) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = URL.createObjectURL(file); }); }
function canvasBlob(canvas, type, quality) { return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('تعذر إنشاء الصورة.')), type, quality)); }

async function runPdf() {
  const files = [...document.getElementById('pdfFiles').files]; const mode = document.getElementById('pdfMode').value; if (!files.length) throw new Error('اختر ملف PDF أولاً.');
  if (mode === 'merge') { if (files.length < 2) throw new Error('اختر ملفي PDF على الأقل للدمج.'); const { PDFDocument } = await loadPdfLib(); const merged = await PDFDocument.create(); for (const file of files) { const source = await PDFDocument.load(await readFile(file)); const pages = await merged.copyPages(source, source.getPageIndices()); pages.forEach((page) => merged.addPage(page)); } addDownload(new Blob([await merged.save()], { type: 'application/pdf' }), 'dhiban-merged.pdf'); return; }
  const pdfjs = await loadPdfJs(); const file = files[0]; const pdf = await pdfjs.getDocument({ data: await readFile(file) }).promise;
  if (mode === 'text') { let textContent = ''; for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) { const page = await pdf.getPage(pageNo); const content = await page.getTextContent(); textContent += `\n--- صفحة ${pageNo} ---\n` + content.items.map((item) => item.str).join(' '); } addDownload(new Blob([textContent.trim()], { type: 'text/plain;charset=utf-8' }), `${file.name.replace(/\.pdf$/i, '')}.txt`); return; }
  const zip = await loadZip(); const archive = new zip(); const extension = mode === 'images-jpg' ? 'jpg' : 'png'; const mime = extension === 'jpg' ? 'image/jpeg' : 'image/png';
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) { const page = await pdf.getPage(pageNo); const viewport = page.getViewport({ scale: 1.5 }); const canvas = document.createElement('canvas'); canvas.width = viewport.width; canvas.height = viewport.height; await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise; const blob = await canvasBlob(canvas, mime, .92); archive.file(`page-${pageNo}.${extension}`, await blob.arrayBuffer()); }
  addDownload(await archive.generateAsync({ type: 'blob' }), `${file.name.replace(/\.pdf$/i, '')}-pages.zip`);
}

async function runCompress() { const file = document.getElementById('imageFile').files[0]; if (!file) throw new Error('اختر صورة أولاً.'); const image = await imageFromFile(file); const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; canvas.getContext('2d').drawImage(image, 0, 0); const blob = await canvasBlob(canvas, 'image/jpeg', Number(document.getElementById('quality').value)); addDownload(blob, `${file.name.replace(/\.[^.]+$/, '')}-compressed.jpg`); }
async function runConvert() { const file = document.getElementById('imageFile').files[0]; if (!file) throw new Error('اختر صورة أولاً.'); const image = await imageFromFile(file); const format = document.getElementById('format').value; const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; const context = canvas.getContext('2d'); if (format === 'image/jpeg') { context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); } context.drawImage(image, 0, 0); const blob = await canvasBlob(canvas, format, .92); const ext = format === 'image/jpeg' ? 'jpg' : format.split('/')[1]; addDownload(blob, `${file.name.replace(/\.[^.]+$/, '')}.${ext}`); }

async function runBackground() { const file = document.getElementById('imageFile').files[0]; if (!file) throw new Error('اختر صورة أولاً.'); const image = await imageFromFile(file); const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0); const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height); const data = pixels.data; const threshold = Number(document.getElementById('threshold').value); const samples = [[0, 0], [canvas.width - 1, 0], [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]].map(([x, y]) => { const i = (y * canvas.width + x) * 4; return [data[i], data[i + 1], data[i + 2]]; }); const close = (i, color) => Math.abs(data[i] - color[0]) + Math.abs(data[i + 1] - color[1]) + Math.abs(data[i + 2] - color[2]) < threshold * 3; const seen = new Uint8Array(canvas.width * canvas.height); const queue = []; samples.forEach((color, index) => { const x = index % 2 ? canvas.width - 1 : 0; const y = index > 1 ? canvas.height - 1 : 0; queue.push([x, y, color]); }); while (queue.length) { const [x, y, color] = queue.pop(); if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) continue; const pos = y * canvas.width + x; if (seen[pos]) continue; const i = pos * 4; if (!close(i, color)) continue; seen[pos] = 1; data[i + 3] = 0; queue.push([x + 1, y, color], [x - 1, y, color], [x, y + 1, color], [x, y - 1, color]); } ctx.putImageData(pixels, 0, 0); addDownload(await canvasBlob(canvas, 'image/png'), `${file.name.replace(/\.[^.]+$/, '')}-no-background.png`); }

async function runQr() { const text = document.getElementById('qrText').value.trim(); if (!text) throw new Error('اكتب الرابط أو النص أولاً.'); const QRCode = await loadQr(); const canvas = document.createElement('canvas'); await QRCode.toCanvas(canvas, text, { width: Number(document.getElementById('qrSize').value), margin: 2, color: { dark: document.getElementById('qrColor').value, light: '#ffffff' } }); canvas.className = 'qr-canvas'; outputBox.appendChild(canvas); addDownload(await new Promise((resolve) => canvas.toBlob(resolve, 'image/png')), 'dhiban-qr.png'); }

document.querySelectorAll('.open-tool').forEach((button) => button.addEventListener('click', (event) => openModal(event.currentTarget.closest('.tool-card').dataset.tool)));
document.getElementById('closeTool').addEventListener('click', closeModal); modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
