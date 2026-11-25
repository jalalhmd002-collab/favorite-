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
    counts[cat] = (counts[cat] || 0) + 1;
  });
  return counts;
}

function updateTriggerBar() {
  const triggerIcon = document.getElementById('triggerCatIcon');
  const triggerName = document.getElementById('triggerCatName');
  const triggerCount = document.getElementById('triggerCatCount');
  const quickFavBtn = document.getElementById('quickFavFilterBtn');
  const quickFavCount = document.getElementById('quickFavCount');

  const counts = getCategoryCounts();
  if (quickFavCount) quickFavCount.textContent = formatEnNumber(counts.favorites);

  if (quickFavBtn) {
    if (currentCategory === 'favorites') {
      quickFavBtn.classList.add('active', 'border-amber-500/60', 'bg-amber-500/10', 'text-amber-600');
    } else {
      quickFavBtn.classList.remove('active', 'border-amber-500/60', 'bg-amber-500/10', 'text-amber-600');
    }
  }

  if (currentCategory === 'all') {
    if (triggerIcon) triggerIcon.innerHTML = getCategoryIconHtml('layers', 15);
    if (triggerName) triggerName.textContent = 'جميع الروابط';
    if (triggerCount) triggerCount.textContent = formatEnNumber(counts.all);
  } else if (currentCategory === 'favorites') {
    if (triggerIcon) triggerIcon.innerHTML = getCategoryIconHtml('star', 15);
    if (triggerName) triggerName.textContent = 'المفضلة';
    if (triggerCount) triggerCount.textContent = formatEnNumber(counts.favorites);
  } else {
    const found = getAllCategories().find(c => c.id === currentCategory);
    if (found) {
      if (triggerIcon) triggerIcon.innerHTML = getCategoryIconHtml(found.icon, 15);
      if (triggerName) triggerName.textContent = found.name;
      if (triggerCount) triggerCount.textContent = formatEnNumber(counts[found.id] || 0);
    } else {
      if (triggerIcon) triggerIcon.innerHTML = getCategoryIconHtml('layers', 15);
      if (triggerName) triggerName.textContent = 'جميع الروابط';
      if (triggerCount) triggerCount.textContent = formatEnNumber(counts.all);
    }
  }
}

function updateBottomNavActiveState() {
  const navAll = document.getElementById('navAllBtn');
  const navFav = document.getElementById('navFavBtn');
  if (navAll) {
    if (currentCategory === 'all') navAll.classList.add('active');
    else navAll.classList.remove('active');
  }
  if (navFav) {
    if (currentCategory === 'favorites') navFav.classList.add('active');
    else navFav.classList.remove('active');
  }
}

function renderSites() {
  const grid = document.getElementById('sitesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  updateTriggerBar();

  const filteredSites = activeSites.filter(s => {
    if (!isAdminMode && s.isHidden) return false;
    if (currentCategory === 'favorites') {
      if (!s.isFavorite) return false;
    } else if (currentCategory !== 'all') {
      if (s.category !== currentCategory) return false;
    }

    if (!savedSearchQuery) return true;
    const q = normalizeArabicText(savedSearchQuery);
    const nameMatch = normalizeArabicText(s.name || '').includes(q);
    const domainMatch = cleanDomain(s.domain || s.url || '').toLowerCase().includes(q.toLowerCase());
    const descMatch = normalizeArabicText(s.description || '').includes(q);
    return nameMatch || domainMatch || descMatch;
  });

  const empty = document.getElementById('emptyState');
  const clearBtn = document.getElementById('clearSearchBtn');
  const addBtn = document.getElementById('openAddSiteModalBtn');

  if (clearBtn) clearBtn.classList.toggle('hidden', !savedSearchQuery);
  if (addBtn) addBtn.classList.toggle('ring-2', filteredSites.length === 0 && !savedSearchQuery);

  if (empty) {
    if (filteredSites.length === 0) {
      empty.classList.remove('hidden');
      empty.classList.add('flex');
    } else {
      empty.classList.add('hidden');
      empty.classList.remove('flex');
    }
  }

  const fragment = document.createDocumentFragment();
  const cardBorderPalette = [
    { border: 'rgba(245, 158, 11, 0.45)', bg: 'rgba(245, 158, 11, 0.08)' },
    { border: 'rgba(59, 130, 246, 0.45)', bg: 'rgba(59, 130, 246, 0.08)' },
    { border: 'rgba(16, 185, 129, 0.45)', bg: 'rgba(16, 185, 129, 0.08)' },
    { border: 'rgba(168, 85, 247, 0.45)', bg: 'rgba(168, 85, 247, 0.08)' },
    { border: 'rgba(236, 72, 153, 0.45)', bg: 'rgba(236, 72, 153, 0.08)' },
    { border: 'rgba(20, 184, 166, 0.45)', bg: 'rgba(20, 184, 166, 0.08)' }
  ];

  filteredSites.forEach((site, index) => {
    const palette = cardBorderPalette[index % cardBorderPalette.length];
    const siteTitle = site.name || 'بدون اسم';
    const domain = cleanDomain(site.domain || site.url);
    const siteDesc = (site.description && site.description.trim()) ? site.description.trim() : '';

    const card = document.createElement('article');
    card.className = `apple-site-card flex items-center justify-between gap-3 text-right cursor-pointer select-none group ${site.isHidden ? 'site-card-hidden opacity-50 border-dashed border-neutral-400' : ''}`;
    if (site.isHidden) card.setAttribute('data-hidden', 'true');
    card.style.borderColor = site.isHidden ? '' : palette.border;
    card.onclick = () => openSite(site);

    const rightContent = document.createElement('div');
    rightContent.className = 'flex items-center gap-3 min-w-0 flex-1';

    const iconBox = document.createElement('div');
    iconBox.className = 'site-icon-box w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105';
    iconBox.style.borderColor = palette.border;
    iconBox.style.backgroundColor = palette.bg;
    const img = document.createElement('img');
    const cleanFullUrl = formatUrl(site.url).replace(/\/+$/, '');
    const parsedUrl = new URL(cleanFullUrl);
    const isMyProject = (domain.endsWith('github.io') || domain.endsWith('vercel.app')) && parsedUrl.pathname.length > 1;
    const googleFavicon = `https://google.com{domain}&sz=64`;
    const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://w3.org' viewBox='0 0 24 24' fill='none' stroke='%23f59e0b' stroke-width='2'%3E%3Cpath d='m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z'/%3E%3C/svg%3E";

    img.alt = siteTitle;
    img.className = 'w-6 h-6 rounded object-contain';
    img.loading = 'lazy';

    if (isMyProject) {
      img.src = `${cleanFullUrl}/icon.png`;
      img.onerror = () => {
        img.onerror = () => {
          img.onerror = null;
          img.src = fallbackSvg;
        };
        img.src = googleFavicon;
      };
    } else {
      img.src = googleFavicon;
      img.onerror = () => {
        img.onerror = null;
        img.src = fallbackSvg;
      };
    }


    iconBox.appendChild(img);

    const textWrap = document.createElement('div');
    textWrap.className = 'min-w-0 flex-1';

    const titleEl = document.createElement('h3');
    titleEl.className = 'text-base font-bold text-main truncate tracking-tight';
    titleEl.textContent = siteTitle;

    const descEl = document.createElement('p');
    descEl.className = 'text-xs sm:text-[13px] text-muted truncate mt-0.5';
    descEl.textContent = siteDesc || domain;

    textWrap.appendChild(titleEl);
    textWrap.appendChild(descEl);

    rightContent.appendChild(iconBox);
    rightContent.appendChild(textWrap);
    card.appendChild(rightContent);

    const leftActions = document.createElement('div');
    leftActions.className = 'flex items-center gap-1 shrink-0';

    if (isAdminMode && site.isHidden) {
      const hiddenBadge = document.createElement('span');
      hiddenBadge.className = 'flex items-center justify-center w-7 h-7 rounded-full text-neutral-500 bg-neutral-100 dark:bg-neutral-800 border border-black/10 dark:border-white/10';
      hiddenBadge.title = 'مخفي عن المستخدمين';
      hiddenBadge.setAttribute('aria-label', 'مخفي عن المستخدمين');
      hiddenBadge.innerHTML = `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
      hiddenBadge.onclick = (e) => e.stopPropagation();
      leftActions.appendChild(hiddenBadge);
    }

    if (site.translate) {
      const trBadge = document.createElement('span');
      trBadge.className = 'text-[10px] font-normal text-sky-600 bg-sky-50 border border-sky-200/60 px-1.5 py-0.5 rounded-full leading-none';
      trBadge.textContent = 'مترجم';
      leftActions.appendChild(trBadge);
    }

    const starBtn = document.createElement('button');
    starBtn.type = 'button';
    starBtn.className = `w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.08] ${site.isFavorite ? 'text-amber-500' : 'text-neutral-400 hover:text-amber-500'}`;
    starBtn.setAttribute('aria-label', site.isFavorite ? 'إزالة من المفضلة' : 'أضف للمفضلة');
    starBtn.innerHTML = SVG_ICONS.star(17, Boolean(site.isFavorite));
    starBtn.onclick = (e) => {
      e.stopPropagation();
      toggleFavoriteDirect(site.id);
    };
    leftActions.appendChild(starBtn);

    const dotsBtn = document.createElement('button');
    dotsBtn.type = 'button';
    dotsBtn.className = 'admin-only w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] cursor-pointer transition-colors';
    dotsBtn.setAttribute('aria-label', 'خيارات');
    dotsBtn.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>`;
    dotsBtn.onclick = (e) => {
      e.stopPropagation();
      if (typeof openManageModal === 'function') openManageModal(site);
    };
    leftActions.appendChild(dotsBtn);

    card.appendChild(leftActions);
    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
}

function toggleFavoriteDirect(siteId) {
  const site = activeSites.find(s => s.id === siteId);
  if (!site) return;
  site.isFavorite = !site.isFavorite;
  persistActiveSites();
  renderSites();
  showToast(site.isFavorite ? `تمت إضافة "${site.name}" للمفضلة` : `تمت إزالة "${site.name}" من المفضلة`, 'info');
}

function openSite(site) {
  site.visits = (Number(site.visits) || 0) + 1;
  site.lastVisited = Date.now();
  persistActiveSites(true);
  setTimeout(() => renderSites(), 300);

  const targetUrl = formatUrl(site.url);
  const finalUrl = site.translate
    ? `https://translate.google.com/translate?sl=auto&tl=ar&u=${encodeURIComponent(targetUrl)}`
    : targetUrl;
  window.open(finalUrl, '_blank', 'noopener,noreferrer');
}

// ==========================================================================
// تسجيل SERVICE WORKER لتطبيق الويب التقدمي (PWA)
// ==========================================================================
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('[PWA] Service Worker registered with scope:', reg.scope);
      })
      .catch(err => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
  }
}

// ==========================================================================
// نقطة انطلاق التطبيق (ENTRY POINT & DOM LOADED)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // تهيئة الثيم
  initTheme();

  // التحقق من وضع المدير المحفوظ
  try {
    const savedAdmin = localStorage.getItem(STORAGE_KEY_ADMIN_STATE) === 'true';
    if (savedAdmin && typeof setAdminMode === 'function') setAdminMode(true, true);
  } catch (e) {}

  // القائمة المنسدلة للعلامة التجارية
  const brandMenuBtn = document.getElementById('brandMenuBtn');
  const brandMenuWrapper = document.getElementById('brandMenuWrapper');
  if (brandMenuBtn) {
    brandMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = document.getElementById('brandDropdown');
      const isOpen = dropdown.classList.toggle('active');
      brandMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // الضغط السري 5 مرات لفتح وضع المدير
  const appTitleTrigger = document.getElementById('appTitleTrigger');
  if (appTitleTrigger) {
    appTitleTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof handleSecretTitleClick === 'function') handleSecretTitleClick();
    });
  }

  // تبديل الوضع الليلي (Dark Mode)
  ['brandDropdownThemeBtn', 'brandThemeToggleBtn', 'themeToggleBtn', 'settingsThemeToggleBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        toggleTheme();
        closeBrandDropdown();
      });
    }
  });

  // زر تغيير كلمة مرور المدير
  const changeAdminPassBtn = document.getElementById('changeAdminPassBtn');
  if (changeAdminPassBtn) {
    changeAdminPassBtn.addEventListener('click', () => {
      closeBrandDropdown();
      if (typeof openChangePassModal === 'function') openChangePassModal();
    });
  }

  // زر تفريغ البيانات
  const resetDbBtn = document.getElementById('resetDbBtn');
  if (resetDbBtn) {
    resetDbBtn.addEventListener('click', () => {
      closeBrandDropdown();
      if (typeof openConfirmResetModal === 'function') openConfirmResetModal();
    });
  }

  // زر فتح قائمة التصنيفات
  ['openCategoriesCurtainBtn', 'navCatsBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        closeBrandDropdown();
        if (typeof openCurtain === 'function') openCurtain();
      });
    }
  });

  // إغلاق القوائم المنسدلة عند النقر بالخارج
  document.addEventListener('click', (e) => {
    if (brandMenuWrapper && !brandMenuWrapper.contains(e.target)) {
      closeBrandDropdown();
    }
  });

  // شريط البحث وفلترة الروابط
  const debouncedMainSearch = debounce((query) => {
    savedSearchQuery = query.trim();
    renderSites();
  }, 150);

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      debouncedMainSearch(e.target.value);
    });
  }

  const clearSearchBtn = document.getElementById('clearSearchBtn');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      savedSearchQuery = '';
      renderSites();
      if (searchInput) searchInput.focus();
    });
  }

  // أزرار الشريط السفلي
  const navAllBtn = document.getElementById('navAllBtn');
  if (navAllBtn) {
    navAllBtn.addEventListener('click', () => {
      saveCurrentCategory('all');
      updateTriggerBar();
      renderSites();
    });
  }

  const navFavBtn = document.getElementById('navFavBtn');
  if (navFavBtn) {
    navFavBtn.addEventListener('click', () => {
      saveCurrentCategory('favorites');
      updateTriggerBar();
      renderSites();
    });
  }

  // الفحص التلقائي لنافذة الباركود (مرة كل 24 ساعة بعد 30 ثانية)
  const QR_LAST_AUTO_KEY = 'news_app_last_auto_qr_v7';
  const lastAuto = parseInt(localStorage.getItem(QR_LAST_AUTO_KEY) || '0', 10);
  const now = Date.now();
  if (!lastAuto || (now - lastAuto) > 24 * 60 * 60 * 1000) {
    setTimeout(() => {
      if (typeof modalStack !== 'undefined' && modalStack.length === 0) {
        if (typeof openQrModal === 'function') {
          openQrModal();
          try { localStorage.setItem(QR_LAST_AUTO_KEY, String(Date.now())); } catch (e) {}
        }
      }
    }, 30000);
  }

  // حفظ الحالة عند مغادرة الصفحة
  window.addEventListener('beforeunload', () => {
    if (isAppInitialized && typeof persistActiveSites === 'function') persistActiveSites(true);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && isAppInitialized && typeof persistActiveSites === 'function') {
      persistActiveSites(true);
    }
  });

  // تسجيل Service Worker للتخزين دون اتصال (PWA)
  registerServiceWorker();

  // تحميل الروابط والبيانات الأولية
  if (typeof loadActiveSites === 'function') {
    loadActiveSites();
  }
});
