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
  moon: (sz = 16) => `<svg class="shrink-0" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  shield: (sz = 16) => `<svg class="shrink-0" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><rect x="9" y="10" width="6" height="5" rx="1"/><path d="M10 10V8a2 2 0 1 1 4 0v2"/></svg>`,
  apps: (sz = 16) => `<svg class="shrink-0" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`
};

const CATEGORY_ICON_OPTIONS = [
  { id: 'layers', name: 'طبقات (عام)' },
  { id: 'bookmark', name: 'إشارة مرجعية' },
  { id: 'globe', name: 'مواقع عالمية' },
  { id: 'zap', name: 'أدوات سريعة' },
  { id: 'compass', name: 'استكشاف ومنوعات' },
  { id: 'newspaper', name: 'أخبار ومقالات' },
  { id: 'flag', name: 'محلي وخدمات' },
  { id: 'shield', name: 'خاصة ومحمية' },
  { id: 'apps', name: 'البرامج والتطبيقات' }
];

function getCategoryIconHtml(iconKey, size = 16) {
  if (iconKey === 'star') return SVG_ICONS.star(size, true);
  if (SVG_ICONS[iconKey]) return SVG_ICONS[iconKey](size);
  return SVG_ICONS.layers(size);
}

const BUILTIN_CATEGORIES = [
  { id: 'diverse', name: 'منوعة', icon: 'compass' },
  { id: 'global', name: 'عالمية', icon: 'globe' },
  { id: 'news', name: 'أخبار', icon: 'newspaper' },
  { id: 'private', name: 'خاصة', icon: 'shield' },
  { id: 'programs', name: 'البرامج', icon: 'apps' }
];

function normalizeSiteCategory(cat) {
  if (cat === 'local') return 'diverse';
  if (['diverse', 'global', 'news', 'private', 'programs'].includes(cat)) return cat;
  return 'diverse';
}

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

function extractCleanHostname(urlInput, domainFallback = '') {
  const candidates = [urlInput, domainFallback];
  for (const raw of candidates) {
    const trimmed = (raw || '').trim();
    if (!trimmed) continue;
    try {
      const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
      const parsed = new URL(normalized);
      if (parsed.hostname && parsed.hostname.includes('.')) {
        return parsed.hostname.replace(/^www\./i, '').toLowerCase();
      }
      if (parsed.hostname) {
        return parsed.hostname.toLowerCase();
      }
    } catch (e) {
      // Ignore invalid/relative URLs and fall back safely
    }
  }
  return cleanDomain(domainFallback || urlInput || '');
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
  'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
  'linear-gradient(135deg, #10B981 0%, #0D9488 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
  'linear-gradient(135deg, #EC4899 0%, #E11D48 100%)',
  'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)',
  'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)',
  'linear-gradient(135deg, #14B8A6 0%, #059669 100%)'
];

function getInitialsForAvatar(title, hostname) {
  const raw = (title || '').trim();
  const source = raw || (hostname || '').trim();
  if (!source) return '؟';
  const words = source.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return source.charAt(0).toUpperCase();
  const firstChar = words[0].charAt(0);
  if (/[\u0600-\u06FF]/.test(firstChar)) {
    return firstChar;
  }
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return words[0].slice(0, 2).toUpperCase();
}

function computeHashIndex(str, mod) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % mod;
}

function renderLetterAvatar(iconBox, siteTitle, seedKey) {
  iconBox.innerHTML = '';
  iconBox.style.backgroundColor = 'transparent';
  const avatar = document.createElement('div');
  avatar.className = 'site-letter-avatar';
  avatar.style.background = AVATAR_GRADIENTS[computeHashIndex((siteTitle || '') + '|' + (seedKey || ''), AVATAR_GRADIENTS.length)];
  avatar.textContent = getInitialsForAvatar(siteTitle, seedKey);
  iconBox.appendChild(avatar);
}

function attachMultiTierFavicon(iconBox, site, siteTitle, hostname) {
  if (!hostname) {
    renderLetterAvatar(iconBox, siteTitle, site.url || siteTitle);
    return;
  }

  const primaryUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;
  const secondaryUrl = `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico`;

  const img = document.createElement('img');
  img.alt = siteTitle;
  img.loading = 'lazy';
  img.decoding = 'async';

  let tier = 0; // 0 = Google s2, 1 = DuckDuckGo ip3, 2 = Letter Avatar

  const triggerFallback = () => {
    if (tier === 0) {
      tier = 1;
      img.src = secondaryUrl;
    } else {
      tier = 2;
      img.onload = null;
      img.onerror = null;
      renderLetterAvatar(iconBox, siteTitle, hostname || site.url);
    }
  };

  img.onload = () => {
    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
      triggerFallback();
      return;
    }
    // Google returns a generic 16x16 globe when no custom favicon exists
    if (tier === 0 && img.naturalWidth <= 16 && img.naturalHeight <= 16) {
      triggerFallback();
    }
  };

  img.onerror = () => {
    triggerFallback();
  };

  img.src = primaryUrl;
  iconBox.appendChild(img);
}

function extractNameFromDomain(domain) {
  const clean = cleanDomain(domain);
  if (!clean) return 'رابط جديد';
  const parts = clean.split('.');
  let core = (parts[0] === 'm' || parts[0] === 'edition') ? (parts[1] || parts[0]) : parts[0];
  return core ? core.charAt(0).toUpperCase() + core.slice(1) : 'رابط جديد';
}

function getAllCategories() {
  return [...BUILTIN_CATEGORIES];
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
  const counts = { all: 0, favorites: 0, diverse: 0, global: 0, news: 0, private: 0, programs: 0 };
  const visibleSites = isAdminMode ? activeSites : activeSites.filter(s => !s.isHidden);
  counts.all = visibleSites.length;
  visibleSites.forEach(s => {
    const cat = normalizeSiteCategory(s.category);
    const isPrivateSite = cat === 'private' || s.category === 'خاصة';
    if (s.isFavorite && !(isPrivateSite && isPrivateCategoryLocked())) counts.favorites++;
    counts[cat] = (counts[cat] || 0) + 1;
  });
  return counts;
}

const HOME_DASHBOARD_CARDS = [
  { id: 'diverse', name: 'منوعة', icon: 'compass', badgeClass: 'cat-badge-diverse' },
  { id: 'favorites', name: 'المفضلة', icon: 'star', badgeClass: 'cat-badge-favorites' },
  { id: 'global', name: 'عالمية', icon: 'globe', badgeClass: 'cat-badge-global' },
  { id: 'news', name: 'أخبار', icon: 'newspaper', badgeClass: 'cat-badge-news' },
  { id: 'private', name: 'خاصة', icon: 'shield', badgeClass: 'cat-badge-private' },
  { id: 'programs', name: 'البرامج', icon: 'apps', badgeClass: 'cat-badge-programs' }
];

function goHomeDashboard() {
  isPrivateCategoryUnlocked = false;
  const searchInput = document.getElementById('searchInput');
  if (searchInput && searchInput.value) searchInput.value = '';
  savedSearchQuery = '';
  saveCurrentCategory('home');
  updateTriggerBar();
  updateBottomNavActiveState();
  renderSites();
}

const PRIVATE_LOCK_ENABLED_KEY = 'fav_private_category_locked_v1';
const PRIVATE_PROMPT_HIDDEN_KEY = 'fav_hide_private_prompt_v1';
let isPrivateCategoryUnlocked = false;
let pendingPrivateAction = 'open'; // 'open' | 'disable_lock'

function getUnifiedPassword() {
  if (typeof getAdminPassword === 'function') return getAdminPassword();
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ADMIN_PASS);
    if (stored && stored.trim()) return stored;
  } catch (e) {}
  return '1234';
}

function isPrivateCategoryLocked() {
  try {
    return localStorage.getItem(PRIVATE_LOCK_ENABLED_KEY) === '1';
  } catch (e) {
    return false;
  }
}

function updatePrivateLockBadgeUI() {
  const badge = document.getElementById('brandPrivateLockBadge');
  if (!badge) return;
  const locked = isPrivateCategoryLocked();
  badge.textContent = locked ? 'مقفل' : 'مفتوح';
}

function proceedOpenPrivateCategory(fromPopState = false) {
  if (!fromPopState && currentCategory === 'home') {
    try { history.pushState({ appCategory: 'private' }, '', window.location.pathname + window.location.search); } catch (e) {}
  }
  saveCurrentCategory('private');
  updateTriggerBar();
  updateBottomNavActiveState();
  renderSites();
}

function openPrivatePromptModal() {
  const overlay = document.getElementById('privatePromptModalOverlay');
  const cb = document.getElementById('hidePrivatePromptCheckbox');
  if (cb) cb.checked = false;
  if (overlay) {
    overlay.classList.add('active');
    if (typeof pushOverlayToStack === 'function') pushOverlayToStack('privatePromptModalOverlay');
  }
}

function closePrivatePromptModal(fromPopState = false) {
  const overlay = document.getElementById('privatePromptModalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    if (typeof removeOverlayFromStack === 'function') removeOverlayFromStack('privatePromptModalOverlay', fromPopState);
  }
}

function onPrivatePromptConfirm() {
  const cb = document.getElementById('hidePrivatePromptCheckbox');
  if (cb && cb.checked) {
    try { localStorage.setItem(PRIVATE_PROMPT_HIDDEN_KEY, '1'); } catch (e) {}
  }
  closePrivatePromptModal();
  try { localStorage.setItem(PRIVATE_LOCK_ENABLED_KEY, '1'); } catch (e) {}
  isPrivateCategoryUnlocked = true;
  updatePrivateLockBadgeUI();
  showToast('تم تفعيل قفل قسم خاصة بكلمة المرور', 'success');
  proceedOpenPrivateCategory();
}

function onPrivatePromptCancel() {
  const cb = document.getElementById('hidePrivatePromptCheckbox');
  if (cb && cb.checked) {
    try { localStorage.setItem(PRIVATE_PROMPT_HIDDEN_KEY, '1'); } catch (e) {}
  }
  closePrivatePromptModal();
  proceedOpenPrivateCategory();
}

function togglePrivateCategoryLock() {
  if (!isPrivateCategoryLocked()) {
    try { localStorage.setItem(PRIVATE_LOCK_ENABLED_KEY, '1'); } catch (e) {}
    updatePrivateLockBadgeUI();
    showToast('تم قفل قسم خاصة بكلمة المرور', 'success');
    return;
  }
  if (isAdminMode) {
    try { localStorage.setItem(PRIVATE_LOCK_ENABLED_KEY, '0'); } catch (e) {}
    isPrivateCategoryUnlocked = true;
    updatePrivateLockBadgeUI();
    showToast('تم إلغاء قفل قسم خاصة', 'info');
    return;
  }
  openPrivateUnlockModal('disable_lock');
}

function openPrivateUnlockModal(actionMode = 'open') {
  pendingPrivateAction = actionMode;
  const overlay = document.getElementById('privateUnlockModalOverlay');
  const inp = document.getElementById('privateUnlockInput');
  const err = document.getElementById('privateUnlockError');
  if (err) err.classList.add('hidden');
  if (inp) inp.value = '';
  if (overlay) {
    overlay.classList.add('active');
    if (typeof pushOverlayToStack === 'function') pushOverlayToStack('privateUnlockModalOverlay');
  }
  if (inp) setTimeout(() => inp.focus(), 60);
}

function closePrivateUnlockModal(fromPopState = false) {
  pendingPrivateAction = 'open';
  const overlay = document.getElementById('privateUnlockModalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    if (typeof removeOverlayFromStack === 'function') removeOverlayFromStack('privateUnlockModalOverlay', fromPopState);
  }
}

function submitPrivateUnlock() {
  const inp = document.getElementById('privateUnlockInput');
  const err = document.getElementById('privateUnlockError');
  const entered = inp ? inp.value : '';
  if (entered === getUnifiedPassword()) {
    const mode = pendingPrivateAction;
    if (err) err.classList.add('hidden');
    closePrivateUnlockModal();
    if (mode === 'disable_lock') {
      try { localStorage.setItem(PRIVATE_LOCK_ENABLED_KEY, '0'); } catch (e) {}
      isPrivateCategoryUnlocked = true;
      updatePrivateLockBadgeUI();
      showToast('تم إلغاء قفل قسم خاصة بنجاح', 'info');
    } else {
      isPrivateCategoryUnlocked = true;
      proceedOpenPrivateCategory();
    }
  } else {
    if (err) err.classList.remove('hidden');
    showToast('كلمة المرور غير صحيحة', 'error');
    if (inp) { inp.value = ''; inp.focus(); }
  }
}

window.togglePrivateCategoryLock = togglePrivateCategoryLock;
window.onPrivatePromptConfirm = onPrivatePromptConfirm;
window.onPrivatePromptCancel = onPrivatePromptCancel;
window.closePrivateUnlockModal = closePrivateUnlockModal;
window.submitPrivateUnlock = submitPrivateUnlock;

function openCategoryDrillDown(catId) {
  if (catId === 'private') {
    if (isAdminMode) {
      isPrivateCategoryUnlocked = true;
      proceedOpenPrivateCategory();
      return;
    }
    isPrivateCategoryUnlocked = false;
    if (isPrivateCategoryLocked()) {
      openPrivateUnlockModal('open');
      return;
    }
    let hidePrompt = false;
    try { hidePrompt = localStorage.getItem(PRIVATE_PROMPT_HIDDEN_KEY) === '1'; } catch (e) {}
    if (!hidePrompt) {
      openPrivatePromptModal();
      return;
    }
  } else {
    isPrivateCategoryUnlocked = false;
  }
  if (catId !== 'home' && currentCategory === 'home') {
    try { history.pushState({ appCategory: catId }, '', window.location.pathname + window.location.search); } catch (e) {}
  }
  saveCurrentCategory(catId);
  updateTriggerBar();
  updateBottomNavActiveState();
  renderSites();
}

window.goHomeDashboard = goHomeDashboard;
window.openCategoryDrillDown = openCategoryDrillDown;

function renderHomeCategoriesGrid(counts) {
  const homeGrid = document.getElementById('homeCategoriesGrid');
  if (!homeGrid) return;
  homeGrid.innerHTML = '';
  HOME_DASHBOARD_CARDS.forEach(cardDef => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'home-category-square-card';
    btn.onclick = () => openCategoryDrillDown(cardDef.id);

    const iconWrap = document.createElement('div');
    iconWrap.className = `home-cat-icon-wrap ${cardDef.badgeClass}`;
    iconWrap.innerHTML = getCategoryIconHtml(cardDef.icon, 26);

    const titleEl = document.createElement('div');
    titleEl.className = 'home-cat-title';
    titleEl.textContent = cardDef.name;

    const countEl = document.createElement('span');
    countEl.className = 'home-cat-count-pill';
    countEl.textContent = `${formatEnNumber(counts[cardDef.id] || 0)} رابط`;

    btn.appendChild(iconWrap);
    btn.appendChild(titleEl);
    btn.appendChild(countEl);
    homeGrid.appendChild(btn);
  });
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
if (currentCategory === 'home' || currentCategory === 'all') {
if (triggerIcon) triggerIcon.innerHTML = getCategoryIconHtml('layers', 15);
if (triggerName) triggerName.textContent = currentCategory === 'home' ? 'الرئيسية (6 أقسام)' : 'جميع الروابط';
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
if (currentCategory === 'home' || currentCategory === 'all') navAll.classList.add('active');
else navAll.classList.remove('active');
}
if (navFav) {
if (currentCategory === 'favorites') navFav.classList.add('active');
else navFav.classList.remove('active');
}
}
function renderSites() {
const grid = document.getElementById('sitesGrid');
const homeGrid = document.getElementById('homeCategoriesGrid');
const drillHeader = document.getElementById('categoryDrillHeader');
const drillIcon = document.getElementById('drillHeaderIcon');
const drillTitle = document.getElementById('drillHeaderTitle');
const drillCount = document.getElementById('drillHeaderCount');
if (!grid) return;

if (currentCategory === 'private' && isPrivateCategoryLocked() && !isPrivateCategoryUnlocked) {
currentCategory = 'home';
}

const counts = getCategoryCounts();
updateTriggerBar();
renderHomeCategoriesGrid(counts);

const isSearching = Boolean(savedSearchQuery);
const isHomeView = currentCategory === 'home' && !isSearching;

if (isHomeView) {
if (homeGrid) homeGrid.classList.remove('hidden');
if (drillHeader) { drillHeader.classList.add('hidden'); drillHeader.classList.remove('flex'); }
grid.classList.add('hidden');
grid.innerHTML = '';
const emptyEl = document.getElementById('emptyState');
if (emptyEl) { emptyEl.classList.add('hidden'); emptyEl.classList.remove('flex'); }
const clearBtn = document.getElementById('clearSearchBtn');
if (clearBtn) clearBtn.classList.add('hidden');
return;
}

if (homeGrid) homeGrid.classList.add('hidden');
grid.classList.remove('hidden');
grid.innerHTML = '';

const filteredSites = activeSites.filter(s => {
if (!isAdminMode && s.isHidden) return false;
const normCat = normalizeSiteCategory(s.category);
const isPrivateSite = normCat === 'private' || s.category === 'خاصة';
const isInUnlockedPrivateView = currentCategory === 'private' && (!isPrivateCategoryLocked() || isPrivateCategoryUnlocked);

if (isSearching) {
if (isInUnlockedPrivateView) {
if (!isPrivateSite) return false;
} else {
if (isPrivateSite) return false;
}
} else {
if (currentCategory === 'favorites') {
if (!s.isFavorite) return false;
if (isPrivateSite && isPrivateCategoryLocked()) return false;
} else if (currentCategory !== 'all' && currentCategory !== 'home') {
if (normCat !== currentCategory) return false;
}
}
if (!savedSearchQuery) return true;
const q = normalizeArabicText(savedSearchQuery);
const nameMatch = normalizeArabicText(s.name || '').includes(q);
const domainMatch = cleanDomain(s.domain || s.url || '').toLowerCase().includes(q.toLowerCase());
const descMatch = normalizeArabicText(s.description || '').includes(q);
return nameMatch || domainMatch || descMatch;
});

if (drillHeader) {
drillHeader.classList.remove('hidden');
drillHeader.classList.add('flex');
if (isSearching) {
if (drillIcon) {
drillIcon.className = 'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cat-badge-diverse';
drillIcon.innerHTML = getCategoryIconHtml('layers', 18);
}
if (drillTitle) drillTitle.textContent = `نتائج البحث: "${savedSearchQuery}"`;
if (drillCount) drillCount.textContent = `${formatEnNumber(filteredSites.length)} نتيجة`;
} else {
const meta = HOME_DASHBOARD_CARDS.find(c => c.id === currentCategory) || { name: 'جميع الروابط', icon: 'layers', badgeClass: 'cat-badge-diverse' };
if (drillIcon) {
drillIcon.className = `w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.badgeClass}`;
drillIcon.innerHTML = getCategoryIconHtml(meta.icon, 18);
}
if (drillTitle) drillTitle.textContent = meta.name;
if (drillCount) drillCount.textContent = `${formatEnNumber(filteredSites.length)} رابط`;
}
}
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
const domain = extractCleanHostname(site.url, site.domain);
const siteDesc = (site.description && site.description.trim()) ? site.description.trim() : '';
const card = document.createElement('article');
card.className = `apple-site-card flex items-center justify-between gap-3 text-right cursor-pointer select-none group ${site.isHidden ? 'site-card-hidden opacity-50 border-dashed border-neutral-400' : ''}`;
if (site.isHidden) card.setAttribute('data-hidden', 'true');
card.style.borderColor = site.isHidden ? '' : palette.border;
card.onclick = () => openSite(site);
const rightContent = document.createElement('div');
rightContent.className = 'flex items-center gap-3 min-w-0 flex-1';
const iconBox = document.createElement('div');
iconBox.className = 'site-icon-box link-icon-box flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105';
iconBox.style.borderColor = palette.border;
iconBox.style.backgroundColor = palette.bg;
attachMultiTierFavicon(iconBox, site, siteTitle, domain);
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
// تهيئة الثيم وحارس زر الرجوع
initTheme();
try {
  history.replaceState({ appBase: true }, '', window.location.pathname + window.location.search);
  history.pushState({ appHomeGuard: true }, '', window.location.pathname + window.location.search);
} catch (e) {}
updatePrivateLockBadgeUI();
const privUnlockInp = document.getElementById('privateUnlockInput');
if (privUnlockInp) {
privUnlockInp.addEventListener('keydown', (e) => {
if (e.key === 'Enter') { e.preventDefault(); submitPrivateUnlock(); }
});
}
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
if (currentCategory !== 'private') {
isPrivateCategoryUnlocked = false;
}
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
goHomeDashboard();
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