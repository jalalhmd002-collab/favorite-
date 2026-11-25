/* ==========================================================================
   cloud.js - إدارة المزامنة السحابية والتخزين المحلي والنسخ الاحتياطي
   مشروع روابطي المفضلة (PWA)
   ========================================================================== */

// رابط Google Apps Script للمزامنة السحابية
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzUsxDpzb0Iv40teHqgctOXbx1bzjXWFnzHeUtxGBL0oP6rAktemZGHU0-SZi-Y6e550Q/exec";

// مفاتيح التخزين المحلي (LocalStorage & IndexedDB)
const STORAGE_KEY_SITES = 'news_app_empty_sites_v7';
const STORAGE_KEY_CATS = 'news_app_empty_cats_v7';
const STORAGE_KEY_DELETED_CATS = 'news_app_deleted_builtin_cats_v7';
const STORAGE_KEY_CURRENT_CAT = 'news_app_empty_current_cat_v7';
const THEME_STORAGE_KEY = 'news_app_theme_v7';
const STORAGE_KEY_QR_URL = 'news_app_qr_custom_url_v7';
const STORAGE_KEY_ADMIN_PASS = 'news_app_admin_password_v7';
const STORAGE_KEY_QR_MSG = 'news_app_qr_display_msg_v7';
const STORAGE_KEY_ADMIN_STATE = 'news_app_admin_state_v7';
const DB_NAME = 'NewsAppEmptyStorage_v7';
const DB_STORE = 'app_store';

// المتغيرات العامة المشتركة لحالة التطبيق
var activeSites = window.activeSites || [];
var customCategories = window.customCategories || [];
var deletedBuiltinCatIds = window.deletedBuiltinCatIds || [];
var currentCategory = window.currentCategory || 'home';
var savedSearchQuery = window.savedSearchQuery || '';
var isAdminMode = false;
var isAppInitialized = false;

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
function loadDeletedBuiltinCats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_CATS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function saveDeletedBuiltinCats() {
  try { localStorage.setItem(STORAGE_KEY_DELETED_CATS, JSON.stringify(deletedBuiltinCatIds)); } catch (e) {}
}

function loadCustomCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function saveCustomCategories() {
  try { localStorage.setItem(STORAGE_KEY_CATS, JSON.stringify(customCategories)); } catch (e) {}
}

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
  saveCustomCategories();
  try { sessionStorage.setItem(STORAGE_KEY_SITES, JSON.stringify(activeSites)); } catch (e) {}
  saveToIndexedDB(activeSites, customCategories);
  if (typeof updateTriggerBar === 'function') updateTriggerBar();
  if (!skipCloudSync && isAdminMode) {
    scheduleCloudSync(true);
  }
}

async function loadActiveSites() {
  customCategories = loadCustomCategories();
  deletedBuiltinCatIds = loadDeletedBuiltinCats();
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
    if (idbData) {
      if (Array.isArray(idbData.sites)) loaded = idbData.sites;
      if (Array.isArray(idbData.cats) && idbData.cats.length > 0 && customCategories.length === 0) {
        customCategories = idbData.cats;
        saveCustomCategories();
      }
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
// المزامنة السحابية (GOOGLE APPS SCRIPT WEB APP)
// ========================================================
async function syncToCloud(showNotify = true) {
  const url = (typeof GOOGLE_SCRIPT_URL === 'string') ? GOOGLE_SCRIPT_URL.trim() : '';
  if (!url || !isAdminMode) return;
  try {
    const payload = {
      sites: activeSites,
      categories: customCategories,
      deletedBuiltinCats: deletedBuiltinCatIds,
      qrMessage: (typeof getQrDisplayMessage === 'function') ? getQrDisplayMessage() : ''
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
  if (!url || !isAdminMode) return;
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(() => {
    syncToCloud(showNotify);
  }, 150);
}

async function fetchFromCloud() {
  const url = (typeof GOOGLE_SCRIPT_URL === 'string') ? GOOGLE_SCRIPT_URL.trim() : '';
  if (!url) return;
  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data || data.ok === false) return;

    if (Array.isArray(data.categories)) {
      customCategories = data.categories;
      saveCustomCategories();
    }
    if (Array.isArray(data.deletedBuiltinCats)) {
      deletedBuiltinCatIds = data.deletedBuiltinCats;
      saveDeletedBuiltinCats();
    }
    if (typeof data.qrMessage === 'string') {
      try {
        if (data.qrMessage.trim()) localStorage.setItem(STORAGE_KEY_QR_MSG, data.qrMessage.trim());
        else localStorage.removeItem(STORAGE_KEY_QR_MSG);
      } catch (e) {}
      if (typeof updateQrDisplayMessageUI === 'function') updateQrDisplayMessageUI();
    }
    if (Array.isArray(data.sites)) {
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
    persistActiveSites(true);
    if (typeof populateCategoryDropdowns === 'function') populateCategoryDropdowns();
    if (typeof updateTriggerBar === 'function') updateTriggerBar();
    if (typeof renderSites === 'function') renderSites();
  } catch (err) {}
}

// ========================================================
// تصدير واستيراد النسخ الاحتياطية
// ========================================================
function openBackupModal() {
  const bEl = document.getElementById('backupModalOverlay'); if (bEl) { bEl.classList.add('active'); }
  if (typeof pushOverlayToStack === 'function') pushOverlayToStack('backupModalOverlay');
}

function closeBackupModal(fromPopState = false) {
  const bEl = document.getElementById('backupModalOverlay'); if (bEl) { bEl.classList.remove('active'); }
  if (typeof removeOverlayFromStack === 'function') removeOverlayFromStack('backupModalOverlay', fromPopState);
}

function exportBackupData() {
  try {
    const backupObj = {
      version: 7,
      exportDate: new Date().toISOString(),
      sites: activeSites,
      categories: customCategories,
      deletedBuiltinCats: deletedBuiltinCatIds
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `my_favorites_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (typeof showToast === 'function') showToast('تم تصدير النسخة الاحتياطية بنجاح', 'success');
  } catch (e) {
    if (typeof showToast === 'function') showToast('حدث خطأ أثناء تصدير النسخة', 'error');
  }
}

function importBackupData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      const importedSites = Array.isArray(imported) ? imported : (Array.isArray(imported.sites) ? imported.sites : null);
      const importedCats = (imported && Array.isArray(imported.categories)) ? imported.categories : [];

      if (!importedSites) {
        if (typeof showToast === 'function') showToast('الملف لا يحتوي على بيانات روابط صالحة', 'error');
        return;
      }

      importedCats.forEach(newCat => {
        if (newCat && newCat.id && newCat.name) {
          const existingCat = customCategories.find(c => c.id === newCat.id);
          if (!existingCat) customCategories.push(newCat);
        }
      });
      saveCustomCategories();

      let addedCount = 0;
      let updatedCount = 0;

      importedSites.forEach(s => {
        if (!s.url) return;
        const fullUrl = (typeof formatUrl === 'function') ? formatUrl(s.url) : s.url;
        const domain = (typeof cleanDomain === 'function') ? cleanDomain(fullUrl) : '';
        const existingSite = activeSites.find(x => x.url === fullUrl);

        if (existingSite) {
          existingSite.name = s.name || existingSite.name;
          existingSite.description = s.description !== undefined ? s.description : existingSite.description;
          existingSite.category = s.category || existingSite.category;
          existingSite.translate = Boolean(s.translate);
          existingSite.isFavorite = Boolean(s.isFavorite !== undefined ? s.isFavorite : existingSite.isFavorite);
          existingSite.isHidden = Boolean(s.isHidden !== undefined ? s.isHidden : existingSite.isHidden);
          updatedCount++;
        } else {
          activeSites.unshift({
            id: s.id || ('site_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
            name: s.name || (typeof extractNameFromDomain === 'function' ? extractNameFromDomain(domain) : 'رابط جديد'),
            description: s.description || '',
            url: fullUrl,
            domain: domain,
            category: s.category || 'general',
            translate: Boolean(s.translate),
            visits: Number(s.visits) || 0,
            lastVisited: Number(s.lastVisited) || Date.now(),
            isUserAdded: true,
            isFavorite: Boolean(s.isFavorite),
            isHidden: Boolean(s.isHidden)
          });
          addedCount++;
        }
      });

      if (typeof sortActiveSites === 'function') sortActiveSites();
      persistActiveSites();
      if (typeof populateCategoryDropdowns === 'function') populateCategoryDropdowns();
      if (typeof updateTriggerBar === 'function') updateTriggerBar();
      if (typeof renderSites === 'function') renderSites();
      closeBackupModal();
      if (typeof showToast === 'function') showToast(`تم الاستيراد: ${addedCount} جديد، ${updatedCount} تم تحديثه`, 'success');
    } catch (err) {
      if (typeof showToast === 'function') showToast('فشل قراءة الملف. يرجى التأكد من أنه ملف JSON صالح', 'error');
    }
  };
  reader.readAsText(file);
}

// تهيئة أحداث النسخ الاحتياطي والمزامنة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  ['exportBackupBtn', 'exportDataBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', exportBackupData);
  });

  ['importBackupInput', 'importFileInput'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          importBackupData(e.target.files[0]);
          e.target.value = '';
        }
      });
    }
  });

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
      if (!isAdminMode) {
        if (typeof showToast === 'function') showToast('المزامنة اليدوية متاحة للمدير فقط', 'error');
        return;
      }
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
