/* ==========================================================================
   cloud.js - إدارة المزامنة السحابية والتخزين المحلي والنسخ الاحتياطي
   مشروع روابطي المفضلة (PWA)
   ========================================================================== */

// رابط Google Apps Script للمزامنة السحابية
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzUsxDpzb0Iv40teHqgctOXbx1bzjXWFnzHeUtxGBL0oP6rAktemZGHU0-SZi-Y6e550Q/exec";

// مفاتيح التخزين المحلي (LocalStorage & IndexedDB)
const STORAGE_KEY_SITES = 'news_app_empty_sites_v7';
const STORAGE_KEY_CURRENT_CAT = 'news_app_empty_current_cat_v7';
const THEME_STORAGE_KEY = 'news_app_theme_v7';
const STORAGE_KEY_QR_URL = 'news_app_qr_custom_url_v7';
const STORAGE_KEY_ADMIN_PASS = 'news_app_admin_password_v7';
const STORAGE_KEY_ADMIN_STATE = 'news_app_admin_state_v7';
const STORAGE_KEY_DEVICE_ID = 'news_app_device_id_v7';
const DB_NAME = 'NewsAppEmptyStorage_v7';
const DB_STORE = 'app_store';

// المتغيرات العامة المشتركة لحالة التطبيق
var activeSites = window.activeSites || [];
var currentCategory = window.currentCategory || 'home';
var savedSearchQuery = window.savedSearchQuery || '';
var isAdminMode = false;
var isAppInitialized = false;
var hasFetchedCloud = false;

// مؤقت المزامنة السحابية
let cloudSyncTimer = null;

// ========================================================
// التخزين المحلي عبر INDEXEDDB
// ========================================================
function openDatabase() {
  return new Promise((resolve) => {
    if (!window.indexedDB) { resolve(null); return; }
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

async function saveToIndexedDB(sitesList, catsList) {
  try {
    const db = await openDatabase();
    if (!db) return;
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    store.put({ key: 'active_sites', payload: JSON.stringify(sitesList) });
    store.put({ key: 'custom_cats', payload: JSON.stringify(catsList) });
  } catch (e) {}
}

async function loadFromIndexedDB() {
  try {
    const db = await openDatabase();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const store = tx.objectStore(DB_STORE);
      const req = store.get('active_sites');
      req.onsuccess = () => {
        let sitesResult = null;
        if (req.result && req.result.payload) {
          try {
            const parsed = JSON.parse(req.result.payload);
            if (Array.isArray(parsed)) sitesResult = parsed;
          } catch (e) {}
        }
        const reqCats = store.get('custom_cats');
        reqCats.onsuccess = () => {
          let catsResult = [];
          if (reqCats.result && reqCats.result.payload) {
            try {
              const parsedCats = JSON.parse(reqCats.result.payload);
              if (Array.isArray(parsedCats)) catsResult = parsedCats;
            } catch (e) {}
          }
          resolve({ sites: sitesResult, cats: catsResult });
        };
        reqCats.onerror = () => resolve({ sites: sitesResult, cats: [] });
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

// ========================================================
// التخزين عبر LOCALSTORAGE
// ========================================================
function saveCurrentCategory(catId) {
  currentCategory = catId || 'home';
  try { localStorage.setItem(STORAGE_KEY_CURRENT_CAT, currentCategory); } catch (e) {}
  try { sessionStorage.setItem(STORAGE_KEY_CURRENT_CAT, currentCategory); } catch (e) {}
  if (typeof updateBottomNavActiveState === 'function') updateBottomNavActiveState();
}

function loadSavedCategory() {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY_CURRENT_CAT) || sessionStorage.getItem(STORAGE_KEY_CURRENT_CAT);
  } catch (e) {}
  if (!saved || saved === 'all') return 'home';
  if (saved === 'local') return 'diverse';
  if (['home', 'favorites', 'diverse', 'global', 'news', 'private', 'programs'].includes(saved)) return saved;
  return 'home';
}

function persistActiveSites(skipCloudSync = false) {
  if (!isAppInitialized || !Array.isArray(activeSites)) return;
  try { localStorage.setItem(STORAGE_KEY_SITES, JSON.stringify(activeSites)); } catch (e) {}
  try { sessionStorage.setItem(STORAGE_KEY_SITES, JSON.stringify(activeSites)); } catch (e) {}
  saveToIndexedDB(activeSites, []);
  if (typeof updateTriggerBar === 'function') updateTriggerBar();
  if (!skipCloudSync) {
    scheduleCloudSync(true);
  }
}

async function loadActiveSites() {
  let loaded = null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SITES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) loaded = parsed;
    }
  } catch (e) {}

  if (loaded === null) {
    const idbData = await loadFromIndexedDB();
    if (idbData && Array.isArray(idbData.sites)) {
      loaded = idbData.sites;
    }
  }

  if (Array.isArray(loaded)) {
    activeSites = loaded.map(item => ({
      id: item.id || ('site_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
      name: item.name || (typeof extractNameFromDomain === 'function' ? extractNameFromDomain(item.domain || item.url) : 'رابط جديد'),
      description: (item.description && item.description.trim()) ? item.description.trim() : '',
      url: (typeof formatUrl === 'function' ? formatUrl(item.url) : item.url),
      domain: item.domain || (typeof cleanDomain === 'function' ? cleanDomain(item.url) : ''),
      category: (typeof normalizeSiteCategory === 'function' ? normalizeSiteCategory(item.category) : (['diverse', 'global', 'news', 'private', 'programs'].includes(item.category) ? item.category : 'diverse')),
      translate: Boolean(item.translate),
      visits: Number(item.visits) || 0,
      lastVisited: Number(item.lastVisited) || Date.now(),
      isUserAdded: true,
      isFavorite: Boolean(item.isFavorite),
      isHidden: Boolean(item.isHidden)
    }));
  } else {
    activeSites = [];
  }

  isAppInitialized = true;
  currentCategory = loadSavedCategory();
  if (typeof sortActiveSites === 'function') sortActiveSites();
  persistActiveSites(true);

  if (typeof populateCategoryDropdowns === 'function') populateCategoryDropdowns();
  if (typeof updateTriggerBar === 'function') updateTriggerBar();
  if (typeof updateBottomNavActiveState === 'function') updateBottomNavActiveState();
  if (typeof renderSites === 'function') renderSites();
  fetchFromCloud();
}

// ========================================================
// معرف الجهاز التلقائي والمزامنة السحابية (GOOGLE APPS SCRIPT)
// ========================================================
function getOrCreateDeviceId() {
  let id = '';
  try { id = (localStorage.getItem(STORAGE_KEY_DEVICE_ID) || '').trim(); } catch (e) {}
  if (!id) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    id = 'dev_' + code;
    try { localStorage.setItem(STORAGE_KEY_DEVICE_ID, id); } catch (e) {}
  }
  return id;
}

function getEffectiveSyncDeviceId() {
  return isAdminMode ? 'admin_master' : getOrCreateDeviceId();
}

function updateDeviceSyncUI() {
  const el = document.getElementById('deviceSyncCodeText');
  if (el) el.textContent = getOrCreateDeviceId();
}

function copyDeviceSyncCode() {
  const code = getOrCreateDeviceId();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      if (typeof showToast === 'function') showToast('تم نسخ رمز الجهاز: ' + code, 'success');
    }).catch(() => {
      if (typeof showToast === 'function') showToast('رمز الجهاز: ' + code, 'info');
    });
  } else if (typeof showToast === 'function') {
    showToast('رمز الجهاز: ' + code, 'info');
  }
}

async function restoreFromOtherDeviceId() {
  const inp = document.getElementById('restoreDeviceIdInput');
  const targetId = inp ? inp.value.trim() : '';
  if (!targetId) {
    if (typeof showToast === 'function') showToast('يرجى إدخال رمز الجهاز المطلوب استعادته', 'error');
    if (inp) inp.focus();
    return;
  }
  try { localStorage.setItem(STORAGE_KEY_DEVICE_ID, targetId); } catch (e) {}
  updateDeviceSyncUI();
  if (inp) inp.value = '';
  await fetchFromCloud(true);
  if (typeof showToast === 'function') showToast('تم ربط الجهاز واستعادة الروابط بنجاح', 'success');
}

async function manualFetchFromCloud() {
  const btn = document.getElementById('manualFetchCloudBtn');
  const txt = document.getElementById('manualFetchCloudBtnText');
  if (btn) btn.disabled = true;
  if (txt) txt.textContent = 'جاري الجلب من السحابة...';
  try {
    const ok = await fetchFromCloud(true);
    if (typeof showToast === 'function') {
      showToast(ok ? 'تم جلب أحدث البيانات بنجاح' : 'تعذر الاتصال بالسحابة حالياً', ok ? 'success' : 'error');
    }
  } finally {
    if (btn) btn.disabled = false;
    if (txt) txt.textContent = 'تحديث / جلب من السحابة';
  }
}

window.copyDeviceSyncCode = copyDeviceSyncCode;
window.restoreFromOtherDeviceId = restoreFromOtherDeviceId;
window.manualFetchFromCloud = manualFetchFromCloud;

async function syncToCloud(showNotify = true) {
  const url = (typeof GOOGLE_SCRIPT_URL === 'string') ? GOOGLE_SCRIPT_URL.trim() : '';
  if (!url || !hasFetchedCloud) return;
  try {
    const payload = {
      deviceId: getEffectiveSyncDeviceId(),
      sites: activeSites
    };
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    if (showNotify && typeof showToast === 'function') {
      showToast('تمت المزامنة مع السحابة بنجاح', 'success');
    }
  } catch (err) {}
}

function scheduleCloudSync(showNotify = true) {
  const url = (typeof GOOGLE_SCRIPT_URL === 'string') ? GOOGLE_SCRIPT_URL.trim() : '';
  if (!url || !hasFetchedCloud) return;
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(() => {
    syncToCloud(showNotify);
  }, 150);
}

async function fetchFromCloud(isRestore = false) {
  const url = (typeof GOOGLE_SCRIPT_URL === 'string') ? GOOGLE_SCRIPT_URL.trim() : '';
  if (!url) return;
  const devId = getEffectiveSyncDeviceId();
  const sep = url.includes('?') ? '&' : '?';
  const fetchUrl = `${url}${sep}deviceId=${encodeURIComponent(devId)}`;
  try {
    const res = await fetch(fetchUrl, { method: 'GET', cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data || data.ok === false) return false;

    hasFetchedCloud = true;

    if (Array.isArray(data.sites)) {
      if (data.sites.length > 0 || isRestore) {
        activeSites = data.sites.map(item => ({
          id: item.id || ('site_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
          name: item.name || (typeof extractNameFromDomain === 'function' ? extractNameFromDomain(item.domain || item.url) : 'رابط'),
          description: (item.description && String(item.description).trim()) ? String(item.description).trim() : '',
          url: (typeof formatUrl === 'function' ? formatUrl(item.url) : item.url),
          domain: item.domain || (typeof cleanDomain === 'function' ? cleanDomain(item.url) : ''),
          category: (typeof normalizeSiteCategory === 'function' ? normalizeSiteCategory(item.category) : (['diverse', 'global', 'news', 'private', 'programs'].includes(item.category) ? item.category : 'diverse')),
          translate: Boolean(item.translate),
          visits: Number(item.visits) || 0,
          lastVisited: Number(item.lastVisited) || Date.now(),
          isUserAdded: true,
          isFavorite: Boolean(item.isFavorite),
          isHidden: Boolean(item.isHidden)
        }));
        if (typeof sortActiveSites === 'function') sortActiveSites();
      }
    }
    persistActiveSites(true);
    if (typeof populateCategoryDropdowns === 'function') populateCategoryDropdowns();
    if (typeof updateTriggerBar === 'function') updateTriggerBar();
    if (typeof renderSites === 'function') renderSites();
    return true;
  } catch (err) {
    return false;
  }
}

// ========================================================
// تصدير واستيراد النسخ الاحتياطية
// ========================================================
function openBackupModal() {
  updateDeviceSyncUI();
  const bEl = document.getElementById('backupModalOverlay'); if (bEl) { bEl.classList.add('active'); }
  if (typeof pushOverlayToStack === 'function') pushOverlayToStack('backupModalOverlay');
}

function closeBackupModal(fromPopState = false) {
  const bEl = document.getElementById('backupModalOverlay'); if (bEl) { bEl.classList.remove('active'); }
  if (typeof removeOverlayFromStack === 'function') removeOverlayFromStack('backupModalOverlay', fromPopState);
}

// تهيئة أحداث النسخ الاحتياطي والمزامنة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  getOrCreateDeviceId();
  updateDeviceSyncUI();

  const openBackupBtn = document.getElementById('brandDropdownBackupBtn');
  if (openBackupBtn) {
    openBackupBtn.addEventListener('click', () => {
      if (typeof closeBrandDropdown === 'function') closeBrandDropdown();
      openBackupModal();
    });
  }

  ['closeBackupModalBtn', 'cancelBackupBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => closeBackupModal());
  });

  const syncBtn = document.getElementById('syncCloudBtn');
  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      syncToCloud(true);
    });
  }

  const backupOverlay = document.getElementById('backupModalOverlay');
  if (backupOverlay) {
    backupOverlay.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeBackupModal();
    });
  }
});
