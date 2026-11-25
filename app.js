/* ==========================================================================
   app.js - الملف الرئيسي لتشغيل التطبيق، عرض البطاقات، البحث، والثيم
   مشروع روابطي المفضلة (PWA)
   ========================================================================== */

// ==========================================================================
// إعدادات وتخصيص مكتبة Tailwind CSS
// ==========================================================================
tailwind.config = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Cairo"', 'system-ui', '-apple-system', 'sans-serif'],
      }
    }
  }
};

// ==========================================================================
// أيقونات SVG وتصنيفات النظام
// ==========================================================================
const SVG_ICONS = {
  bookmark: (sz = 16) => `<svg class="shrink-0" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
  newspaper: (sz = 16) => `<svg class="shrink-0" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>`,
  flag: (sz = 16) => `<svg class="shrink-0" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  globe: (sz = 16) => `<svg class="shrink-0" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  compass: (sz = 16) => `<svg class="shrink-0" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  zap: (sz = 16) => `<svg class="shrink-0" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  star: (sz = 16, filled = false) => `<svg class="shrink-0" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  layers: (sz = 16) => `<svg class="shrink-0" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  sun: (sz = 16) => `<svg class="shrink-0" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  moon: (sz = 16) => `<svg class="shrink-0" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
};

const CATEGORY_ICON_OPTIONS = [
  { id: 'layers', name: 'طبقات (عام)' },
  { id: 'bookmark', name: 'إشارة مرجعية' },
  { id: 'globe', name: 'مواقع ويب' },
  { id: 'zap', name: 'أدوات سريعة' },
  { id: 'compass', name: 'استكشاف ومنوعات' },
  { id: 'newspaper', name: 'أخبار ومقالات' },
  { id: 'flag', name: 'محلي وخدمات' }
];

function getCategoryIconHtml(iconKey, size = 16) {
  if (iconKey === 'star') return SVG_ICONS.star(size, true);
  if (SVG_ICONS[iconKey]) return SVG_ICONS[iconKey](size);
  return SVG_ICONS.layers(size);
}

const BUILTIN_CATEGORIES = [
  { id: 'general', name: 'روابط عامة', icon: 'bookmark' },
  { id: 'work', name: 'العمل والإنتاجية', icon: 'zap' },
  { id: 'news', name: 'أخبار ومواقع إعلامية', icon: 'newspaper' },
  { id: 'tech', name: 'تقنية وأدوات', icon: 'globe' },
  { id: 'learning', name: 'تعليم ومراجع', icon: 'compass' },
  { id: 'services', name: 'خدمات ومنوعات', icon: 'flag' }
];

// ==========================================================================
// الدوال المساعدة (UTILITIES)
// ==========================================================================
function formatEnNumber(num) {
  return Number(num || 0).toLocaleString('en-US');
}

function normalizeArabicText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

function cleanDomain(input) {
  if (!input) return '';
  let domain = input.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  return domain.split('/')[0].split('?')[0].split('#')[0];
}

function formatUrl(input) {
  let clean = (input || '').trim();
  if (!clean) return '';
  if (!/^https?:\/\//i.test(clean)) {
    clean = 'https://' + clean;
  }
  return clean;
}

function extractNameFromDomain(domain) {
  const clean = cleanDomain(domain);
  if (!clean) return 'رابط جديد';
  const parts = clean.split('.');
  let core = (parts[0] === 'm' || parts[0] === 'edition') ? (parts[1] || parts[0]) : parts[0];
  return core ? core.charAt(0).toUpperCase() + core.slice(1) : 'رابط جديد';
}

function getAllCategories() {
  const activeBuiltins = BUILTIN_CATEGORIES.filter(c => !deletedBuiltinCatIds.includes(c.id));
  return [...customCategories, ...activeBuiltins];
}

function debounce(fn, delay = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast flex items-center gap-2';

  let icon = 'ℹ️';
  if (type === 'success') icon = '✓';
  else if (type === 'error') icon = '✕';

  toast.innerHTML = `<span class="text-amber-400 font-bold">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 250);
  }, 2200);
}

// ==========================================================================
// إدارة الثيم (THEME MANAGEMENT)
// ==========================================================================
function applyTheme(theme) {
  const target = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', target);
  const brandThemeIcon = document.getElementById('brandThemeIcon');
  const brandThemeBadge = document.getElementById('brandThemeBadge');
  if (brandThemeIcon) brandThemeIcon.innerHTML = target === 'dark' ? SVG_ICONS.moon(16) : SVG_ICONS.sun(16);
  if (brandThemeBadge) brandThemeBadge.textContent = target === 'dark' ? 'مفعّل' : 'معطّل';
  try { localStorage.setItem(THEME_STORAGE_KEY, target); } catch (e) {}
}

function initTheme() {
  let savedTheme = 'light';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') savedTheme = stored;
  } catch (e) {}
  applyTheme(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  showToast(next === 'dark' ? 'تم تفعيل الوضع المظلم' : 'تم تفعيل الوضع الفاتح', 'info');
}

function closeBrandDropdown() {
  const dropdown = document.getElementById('brandDropdown');
  const btn = document.getElementById('brandMenuBtn');
  if (dropdown) dropdown.classList.remove('active');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

// ==========================================================================
// ترتيب وتصفية وعرض بطاقات الروابط (GRID RENDERING)
// ==========================================================================
function sortActiveSites() {
  activeSites.sort((a, b) => {
    const vA = Number(a.visits) || 0;
    const vB = Number(b.visits) || 0;
    if (vB !== vA) return vB - vA;
    return (Number(b.lastVisited) || 0) - (Number(a.lastVisited) || 0);
  });
}

function getCategoryCounts() {
  const counts = { all: activeSites.length, favorites: 0 };
  getAllCategories().forEach(c => { counts[c.id] = 0; });
  const visibleSites = isAdminMode ? activeSites : activeSites.filter(s => !s.isHidden);
  counts.all = visibleSites.length;
  visibleSites.forEach(s => {
    if (s.isFavorite) counts.favorites++;
    const cat = s.category || 'general';
