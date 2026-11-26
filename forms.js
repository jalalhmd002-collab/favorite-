/* ==========================================================================
   forms.js - إدارة النوافذ المنبثقة، النماذج، التصنيفات، ورموز الباركود QR
   مشروع روابطي المفضلة (PWA)
   ========================================================================== */

// ========================================================
// إدارة النوافذ المنبثقة وزر الرجوع بالمتصفح (MODAL STACK)
// ========================================================
let modalStack = [];
let hasModalHistoryEntry = false;
let suppressPopstateCount = 0;
let lastBackExitAttemptTs = 0;
let backExitResetTimer = null;

function pushGuardHistoryState(stateObj = { appHomeGuard: true }) {
  try {
    history.pushState(stateObj, '', window.location.pathname + window.location.search);
  } catch (e) {}
}

function safeSetClass(id, className, add = true) {
  const el = document.getElementById(id);
  if (el) {
    if (add) el.classList.add(className);
    else el.classList.remove(className);
  }
}

function pushOverlayToStack(overlayId) {
  if (!modalStack.includes(overlayId)) modalStack.push(overlayId);
  document.body.classList.add('modal-open');
  if (!hasModalHistoryEntry) {
    try {
      history.pushState({ appModal: true }, '', window.location.pathname + window.location.search);
      hasModalHistoryEntry = true;
    } catch (e) {}
  }
}

function removeOverlayFromStack(overlayId, fromPopState = false) {
  modalStack = modalStack.filter(id => id !== overlayId);
  if (modalStack.length === 0) document.body.classList.remove('modal-open');
  if (!fromPopState) {
    setTimeout(() => {
      if (modalStack.length === 0 && hasModalHistoryEntry) {
        hasModalHistoryEntry = false;
        suppressPopstateCount++;
        try { history.back(); } catch (e) { suppressPopstateCount = Math.max(0, suppressPopstateCount - 1); }
      }
    }, 0);
  }
}

function closeOverlayById(overlayId, fromPopState = false) {
  if (overlayId === 'categoryCurtainOverlay') closeCurtain(fromPopState);
  else if (overlayId === 'addModalOverlay') closeAddModal(fromPopState);
  else if (overlayId === 'manageModalOverlay') closeManageModal(fromPopState);
  else if (overlayId === 'addCategoryModalOverlay') closeAddCategoryModal(fromPopState);
  else if (overlayId === 'backupModalOverlay') closeBackupModal(fromPopState);
  else if (overlayId === 'deleteModalOverlay') closeDeleteModal(fromPopState);
  else if (overlayId === 'pasteModalOverlay') closeManualPasteModal(fromPopState);
  else if (overlayId === 'qrModalOverlay') closeQrModal(fromPopState);
  else if (overlayId === 'adminLoginModalOverlay') closeAdminLoginModal(fromPopState);
  else if (overlayId === 'changePassModalOverlay') closeChangePassModal(fromPopState);
  else if (overlayId === 'privatePromptModalOverlay' && typeof closePrivatePromptModal === 'function') closePrivatePromptModal(fromPopState);
  else if (overlayId === 'privateUnlockModalOverlay' && typeof closePrivateUnlockModal === 'function') closePrivateUnlockModal(fromPopState);
}

window.addEventListener('popstate', () => {
  if (suppressPopstateCount > 0) { suppressPopstateCount--; return; }

  // 1. إغلاق القائمة المنسدلة العلوية إن كانت مفتوحة
  const brandDd = document.getElementById('brandDropdown');
  if (brandDd && brandDd.classList.contains('active')) {
    if (typeof closeBrandDropdown === 'function') closeBrandDropdown();
    pushGuardHistoryState({ appHomeGuard: true });
    return;
  }

  // 2. إغلاق أي نافذة منبثقة مفتوحة خطوة بخطوة
  if (modalStack.length > 0) {
    hasModalHistoryEntry = false;
    const topOverlayId = modalStack[modalStack.length - 1];
    closeOverlayById(topOverlayId, true);
    if (modalStack.length > 0) {
      pushGuardHistoryState({ appModal: true });
      hasModalHistoryEntry = true;
    } else {
      pushGuardHistoryState({ appHomeGuard: true });
    }
    return;
  }

  // 3. الرجوع من داخل أي قسم أو بحث إلى الشاشة الرئيسية
  const inSubView = (typeof currentCategory !== 'undefined' && currentCategory !== 'home') || (typeof savedSearchQuery !== 'undefined' && Boolean(savedSearchQuery));
  if (inSubView && typeof goHomeDashboard === 'function') {
    goHomeDashboard(true);
    pushGuardHistoryState({ appHomeGuard: true });
    return;
  }

  // 4. تأكيد الخروج بالضغط مرتين على زر الرجوع في الشاشة الرئيسية
  const now = Date.now();
  if (lastBackExitAttemptTs && (now - lastBackExitAttemptTs) < 2000) {
    if (backExitResetTimer) clearTimeout(backExitResetTimer);
    lastBackExitAttemptTs = 0;
    suppressPopstateCount++;
    try { history.back(); } catch (e) { suppressPopstateCount = Math.max(0, suppressPopstateCount - 1); }
    return;
  }

  lastBackExitAttemptTs = now;
  if (backExitResetTimer) clearTimeout(backExitResetTimer);
  backExitResetTimer = setTimeout(() => {
    lastBackExitAttemptTs = 0;
  }, 2000);

  if (typeof showToast === 'function') {
    showToast('اضغط رجوع مرة أخرى للخروج من البرنامج', 'info');
  }
  pushGuardHistoryState({ appHomeGuard: true });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllCustomSelects();
    if (modalStack.length > 0) {
      closeOverlayById(modalStack[modalStack.length - 1], false);
    }
  }
});

// ========================================================
// القوائم المنسدلة المخصصة (CUSTOM SELECT DROPDOWNS)
// ========================================================
function closeAllCustomSelects(exceptWrapperId = null) {
  document.querySelectorAll('.custom-select-wrapper.open').forEach(w => {
    if (w.id !== exceptWrapperId) {
      w.classList.remove('open');
      const btn = w.querySelector('.custom-select-trigger');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  });
}

function populateCustomSelect(wrapperId, inputId, menuId, items, selectedId) {
  const wrapper = document.getElementById(wrapperId);
  const input = document.getElementById(inputId);
  const menu = document.getElementById(menuId);
  if (!wrapper || !input || !menu) return;

  const targetId = (selectedId && items.some(i => i.id === selectedId))
    ? selectedId
    : (items.some(i => i.id === input.value) ? input.value : (items[0]?.id || ''));

  input.value = targetId;
  menu.innerHTML = '';

  items.forEach(item => {
    const isSelected = item.id === targetId;
    const opt = document.createElement('button');
    opt.type = 'button';
    opt.className = `custom-select-option ${isSelected ? 'selected' : ''}`;
    opt.innerHTML = `
      <span class="flex items-center gap-2 min-w-0">
        <span class="text-amber-500 flex items-center shrink-0">${getCategoryIconHtml(item.icon, 15)}</span>
        <span class="truncate">${item.name}</span>
      </span>
      ${isSelected ? '<span class="text-amber-500 font-normal text-sm shrink-0">✓</span>' : ''}
    `;
    opt.onclick = (e) => {
      e.stopPropagation();
      input.value = item.id;
      updateCustomSelectDisplay(wrapperId, item);
      populateCustomSelect(wrapperId, inputId, menuId, items, item.id);
      wrapper.classList.remove('open');
      const trig = wrapper.querySelector('.custom-select-trigger');
      if (trig) trig.setAttribute('aria-expanded', 'false');
    };
    menu.appendChild(opt);
  });

  const activeItem = items.find(i => i.id === targetId) || items[0];
  if (activeItem) updateCustomSelectDisplay(wrapperId, activeItem);
}

function updateCustomSelectDisplay(wrapperId, item) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper || !item) return;
  const iconSpan = wrapper.querySelector('.custom-select-icon');
  const labelSpan = wrapper.querySelector('.custom-select-label');
  if (iconSpan) iconSpan.innerHTML = getCategoryIconHtml(item.icon, 15);
  if (labelSpan) labelSpan.textContent = item.name;
}

function setupCustomSelectTrigger(wrapperId, triggerId) {
  const wrapper = document.getElementById(wrapperId);
  const trigger = document.getElementById(triggerId);
  if (!wrapper || !trigger) return;
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !wrapper.classList.contains('open');
    closeAllCustomSelects(willOpen ? wrapperId : null);
    wrapper.classList.toggle('open', willOpen);
    trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  });
}

function populateCategoryDropdowns(selectedVal = '') {
  const allCats = getAllCategories();
  populateCustomSelect('quickCategorySelectWrapper', 'quickCategorySelect', 'quickCategoryMenu', allCats, selectedVal);
  populateCustomSelect('manageCategorySelectWrapper', 'manageSiteCategory', 'manageCategoryMenu', allCats, selectedVal);
}

// ========================================================
// قائمة التصنيفات الشاملة (CURTAIN)
// ========================================================
function openCurtain() {
  renderCurtainCategories();
  const overlay = document.getElementById('categoryCurtainOverlay');
  const trigger = document.getElementById('categoryCurtainTrigger');
  const arrow = document.getElementById('triggerArrowIcon');
  if (overlay) overlay.classList.add('active');
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
  if (arrow) arrow.classList.add('rotate-180');
  pushOverlayToStack('categoryCurtainOverlay');
}

function closeCurtain(fromPopState = false) {
  const overlay = document.getElementById('categoryCurtainOverlay');
  const trigger = document.getElementById('categoryCurtainTrigger');
  const arrow = document.getElementById('triggerArrowIcon');
  if (overlay) overlay.classList.remove('active');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  if (arrow) arrow.classList.remove('rotate-180');
  removeOverlayFromStack('categoryCurtainOverlay', fromPopState);
}

function renderCurtainCategories() {
  const grid = document.getElementById('curtainCategoriesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const counts = getCategoryCounts();
  const fragment = document.createDocumentFragment();

  fragment.appendChild(createCatCard('all', 'الكل (جميع الروابط)', 'layers', counts.all));
  fragment.appendChild(createCatCard('favorites', 'المفضلة', 'star', counts.favorites));

  getAllCategories().forEach(cat => {
    fragment.appendChild(createCatCard(cat.id, cat.name, cat.icon, counts[cat.id] || 0, true));
  });

  grid.appendChild(fragment);
}

function deleteCategoryById(catId) {
  showToast('التصنيفات الأساسية ثابتة ولا يمكن حذفها', 'info');
}

function createCatCard(id, name, icon, count, isDeletable = false) {
  const isActive = currentCategory === id;
  const card = document.createElement('div');
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.className = `ios-pressable w-full rounded-xl px-3 py-2.5 border text-right flex items-center justify-between gap-2 cursor-pointer ${
    isActive
      ? 'surface-card border-neutral-900/30 text-main ring-1 ring-black/10'
      : 'surface-sub text-main hover:border-neutral-400/50'
  }`;

  card.innerHTML = `
    <span class="flex items-center gap-2 min-w-0 flex-1">
      <span class="w-7 h-7 rounded-lg surface-card border text-main flex items-center justify-center shrink-0">
        ${getCategoryIconHtml(icon, 15)}
      </span>
      <span class="text-sm font-normal truncate">${name}</span>
    </span>
    <span class="flex items-center gap-1.5 shrink-0">
      <span class="text-[13px] font-normal px-2 py-0.5 rounded-lg ${isActive ? 'bg-neutral-950 text-white' : 'surface-card border text-muted'}">${formatEnNumber(count)}</span>
    </span>
  `;

  if (isDeletable) {
    const endGroup = card.querySelector('span:last-child');
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'w-5 h-5 rounded-full surface-card border text-muted hover:text-rose-600 hover:border-rose-400 flex items-center justify-center text-sm font-normal leading-none cursor-pointer transition-colors';
    delBtn.setAttribute('aria-label', `حذف تصنيف ${name}`);
    delBtn.title = 'حذف التصنيف';
    delBtn.textContent = '×';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteCategoryById(id);
    };
    endGroup.appendChild(delBtn);
  }

  card.onclick = () => {
    saveCurrentCategory(id);
    updateTriggerBar();
    renderSites();
    closeCurtain();
  };

  return card;
}

function openAddCategoryModal() {
  const nCatInput = document.getElementById('newCategoryNameInput');
  if (nCatInput) nCatInput.value = '';
  populateCustomSelect('newCategoryIconWrapper', 'newCategoryIconSelect', 'newCategoryIconMenu', CATEGORY_ICON_OPTIONS, 'layers');
  closeAllCustomSelects();
  safeSetClass('addCategoryModalOverlay', 'active', true);
  pushOverlayToStack('addCategoryModalOverlay');
  if (nCatInput) nCatInput.focus();
}

function closeAddCategoryModal(fromPopState = false) {
  closeAllCustomSelects();
  safeSetClass('addCategoryModalOverlay', 'active', false);
  removeOverlayFromStack('addCategoryModalOverlay', fromPopState);
}

function saveNewCategory() {
  const nameInput = document.getElementById('newCategoryNameInput');
  const iconInput = document.getElementById('newCategoryIconSelect');
  const catName = nameInput.value.trim();
  const catIcon = iconInput.value || 'layers';

  if (!catName) {
    showToast('يرجى كتابة اسم التصنيف', 'error');
    nameInput.focus();
    return;
  }

  const exists = getAllCategories().some(c => c.name.toLowerCase() === catName.toLowerCase());
  if (exists) {
    showToast('يوجد تصنيف آخر بنفس الاسم مسبقاً', 'error');
    nameInput.focus();
    return;
  }

  closeAddCategoryModal();
  showToast('التصنيفات الأساسية ثابتة في اللوحة', 'info');
}

// ========================================================
// نافذة إضافة وتعديل الروابط (ADD & MANAGE MODALS)
// ========================================================
let addModalFavorite = false;

function updateAddFavButton() {
  const favBtn = document.getElementById('addFavToggleBtn');
  const favStarIcon = document.getElementById('addFavStarIcon');
  const favActionText = document.getElementById('addFavActionText');
  if (addModalFavorite) {
    favBtn.classList.add('border-amber-500', 'bg-amber-500/10', 'text-amber-600');
    if (favStarIcon) favStarIcon.innerHTML = SVG_ICONS.star(15, true);
    if (favActionText) favActionText.textContent = 'في المفضلة';
  } else {
    favBtn.classList.remove('border-amber-500', 'bg-amber-500/10', 'text-amber-600');
    if (favStarIcon) favStarIcon.innerHTML = SVG_ICONS.star(15, false);
    if (favActionText) favActionText.textContent = 'المفضلة';
  }
}

function openAddModal() {
  const defaultCat = (['diverse', 'news', 'private', 'programs'].includes(currentCategory))
    ? currentCategory
    : 'diverse';
  addModalFavorite = (currentCategory === 'favorites');
  updateAddFavButton();
  populateCategoryDropdowns(defaultCat);
  closeAllCustomSelects();
  safeSetClass('addModalOverlay', 'active', true);
  pushOverlayToStack('addModalOverlay');
  const qHidden = document.getElementById('quickHiddenInput');
  if (qHidden) qHidden.checked = false;
  const qUrl = document.getElementById('quickUrlInput'); if (qUrl) qUrl.focus();
}

function closeAddModal(fromPopState = false) {
  closeAllCustomSelects();
  safeSetClass('addModalOverlay', 'active', false);
  removeOverlayFromStack('addModalOverlay', fromPopState);
}

function addCustomSite() {
  const urlInput = document.getElementById('quickUrlInput');
  const nameInput = document.getElementById('quickNameInput');
  const descInput = document.getElementById('quickDescInput');
  const translateInput = document.getElementById('quickTranslateInput');
  const hiddenInput = document.getElementById('quickHiddenInput');
  const catInput = document.getElementById('quickCategorySelect');

  const urlVal = urlInput.value.trim();
  if (!urlVal) {
    showToast('يرجى إدخال الرابط أولاً', 'error');
    urlInput.focus();
    return;
  }

  const fullUrl = formatUrl(urlVal);
  const domain = cleanDomain(fullUrl);
  if (!domain) {
    showToast('يرجى إدخال رابط صحيح (مثل: example.com)', 'error');
    urlInput.focus();
    return;
  }

  const nameVal = nameInput.value.trim() || extractNameFromDomain(domain);
  const descVal = descInput.value.trim();
  const catVal = (catInput && catInput.value) ? catInput.value : 'diverse';

  const existing = activeSites.find(s => s.url === fullUrl);
  if (existing) {
    existing.name = nameVal;
    existing.description = descVal;
    existing.category = catVal;
    existing.translate = Boolean(translateInput.checked);
    existing.isFavorite = addModalFavorite;
    existing.isHidden = isAdminMode && hiddenInput ? Boolean(hiddenInput.checked) : Boolean(existing.isHidden);
    sortActiveSites();
    persistActiveSites();
    saveCurrentCategory(catVal);
    renderSites();
    closeAddModal();
    showToast(`تم تحديث "${nameVal}" بنجاح`, 'success');
    return;
  }

  const newSite = {
    id: 'custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    name: nameVal,
    description: descVal,
    url: fullUrl,
    domain: domain,
    category: catVal,
    translate: Boolean(translateInput.checked),
    visits: 0,
    lastVisited: Date.now(),
    isUserAdded: true,
    isFavorite: addModalFavorite,
    isHidden: isAdminMode && hiddenInput ? Boolean(hiddenInput.checked) : false
  };

  activeSites.unshift(newSite);
  sortActiveSites();
  persistActiveSites();

  if (currentCategory !== 'all' && currentCategory !== catVal) {
    saveCurrentCategory(catVal);
  }
  renderSites();

  urlInput.value = '';
  nameInput.value = '';
  descInput.value = '';
  translateInput.checked = false;
  if (hiddenInput) hiddenInput.checked = false;
  addModalFavorite = false;
  closeAddModal();

  showToast(`تمت إضافة "${nameVal}" بنجاح`, 'success');
}

function openManageModal(site) {
  const mId = document.getElementById('manageSiteId'); if (mId) mId.value = site.id;
  const mName = document.getElementById('manageSiteName'); if (mName) mName.value = site.name || '';
  const mDesc = document.getElementById('manageSiteDesc'); if (mDesc) mDesc.value = site.description || '';
  const mUrl = document.getElementById('manageSiteUrl'); if (mUrl) mUrl.value = site.url || '';
  const mTrans = document.getElementById('manageSiteTranslate'); if (mTrans) mTrans.checked = Boolean(site.translate);

  const mHidden = document.getElementById('manageSiteHidden');
  if (mHidden) mHidden.checked = Boolean(site.isHidden);

  updateManageFavButton(Boolean(site.isFavorite));
  populateCategoryDropdowns(site.category || 'general');
  closeAllCustomSelects();

  safeSetClass('manageModalOverlay', 'active', true);
  pushOverlayToStack('manageModalOverlay');
}

function updateManageFavButton(isFav) {
  const favBtn = document.getElementById('manageFavToggleBtn');
  const favStarIcon = document.getElementById('favStarIcon') || document.getElementById('manageFavStarIcon');
  const favActionText = document.getElementById('favActionText') || document.getElementById('manageFavActionText');
  favBtn.setAttribute('data-favorite', isFav ? 'true' : 'false');
  if (isFav) {
    favBtn.classList.add('border-amber-500', 'bg-amber-500/10', 'text-amber-600');
    if (favStarIcon) favStarIcon.innerHTML = SVG_ICONS.star(15, true);
    if (favActionText) favActionText.textContent = 'في المفضلة';
  } else {
    favBtn.classList.remove('border-amber-500', 'bg-amber-500/10', 'text-amber-600');
    if (favStarIcon) favStarIcon.innerHTML = SVG_ICONS.star(15, false);
    if (favActionText) favActionText.textContent = 'المفضلة';
  }
}

function closeManageModal(fromPopState = false) {
  closeAllCustomSelects();
  safeSetClass('manageModalOverlay', 'active', false);
  removeOverlayFromStack('manageModalOverlay', fromPopState);
}

function toggleFavoriteFromManage() {
  const id = document.getElementById('manageSiteId').value;
  const site = activeSites.find(s => s.id === id);
  const currentFav = document.getElementById('manageFavToggleBtn').getAttribute('data-favorite') === 'true';
  const newFav = !currentFav;
  updateManageFavButton(newFav);
  if (site) {
    site.isFavorite = newFav;
    persistActiveSites();
    renderSites();
    showToast(newFav ? `تمت إضافة "${site.name}" للمفضلة` : `تمت إزالة "${site.name}" من المفضلة`, 'info');
  }
}

function applyMoveCategoryFromManage() {
  const id = document.getElementById('manageSiteId').value;
  const site = activeSites.find(s => s.id === id);
  if (!site) return;
  const targetCat = document.getElementById('manageSiteCategory').value;
  site.category = targetCat;
  persistActiveSites();
  renderSites();
  const catObj = getAllCategories().find(c => c.id === targetCat);
  showToast(`تم نقل الرابط إلى قسم "${catObj?.name || targetCat}"`, 'success');
}

function saveManageEdits() {
  const id = document.getElementById('manageSiteId').value;
  const site = activeSites.find(s => s.id === id);
  if (!site) return;

  const newName = document.getElementById('manageSiteName').value.trim();
  const newDesc = document.getElementById('manageSiteDesc').value.trim();
  const newUrl = document.getElementById('manageSiteUrl').value.trim();
  const newTranslate = document.getElementById('manageSiteTranslate').checked;
  const newHidden = document.getElementById('manageSiteHidden') ? document.getElementById('manageSiteHidden').checked : false;
  const newCategory = document.getElementById('manageSiteCategory').value;

  if (!newUrl) {
    showToast('يرجى إدخال الرابط', 'error');
    return;
  }

  site.name = newName || extractNameFromDomain(cleanDomain(newUrl));
  site.description = newDesc;
  site.url = formatUrl(newUrl);
  site.domain = cleanDomain(site.url);
  site.translate = Boolean(newTranslate);
  site.category = newCategory || 'general';
  site.isHidden = Boolean(newHidden);

  sortActiveSites();
  persistActiveSites();
  renderSites();
  closeManageModal();
  showToast('تم حفظ التعديلات بنجاح', 'success');
}

function openDeleteModalFromManage() {
  const id = document.getElementById('manageSiteId').value;
  const site = activeSites.find(s => s.id === id);
  if (!site) return;
  closeManageModal();
  const delIdInput = document.getElementById('deleteSiteId') || document.getElementById('deleteTargetSiteId');
  if (delIdInput) delIdInput.value = site.id;
  const promptEl = document.getElementById('deletePromptText') || document.getElementById('deleteSiteNamePrompt');
  if (promptEl) promptEl.textContent = `هل أنت متأكد من حذف الرابط "${site.name}" نهائياً؟`;
  safeSetClass('deleteModalOverlay', 'active', true);
  pushOverlayToStack('deleteModalOverlay');
}

function closeDeleteModal(fromPopState = false) {
  safeSetClass('deleteModalOverlay', 'active', false);
  removeOverlayFromStack('deleteModalOverlay', fromPopState);
}

function confirmDelete() {
  const delIdInput = document.getElementById('deleteSiteId') || document.getElementById('deleteTargetSiteId');
  const id = delIdInput ? delIdInput.value : '';
  const site = activeSites.find(s => s.id === id);
  const siteName = site ? site.name : 'الرابط';
  activeSites = activeSites.filter(s => s.id !== id);
  persistActiveSites();
  renderSites();
  closeDeleteModal();
  showToast(`تم حذف "${siteName}" بنجاح`, 'info');
}

// ========================================================
// اللصق السريع (PASTE MODALS)
// ========================================================
let pasteTargetInputId = null;

async function handlePaste(targetInputId) {
  pasteTargetInputId = targetInputId;
  if (navigator.clipboard && navigator.clipboard.readText) {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const targetEl = document.getElementById(targetInputId);
        if (targetEl) {
          targetEl.value = text.trim();
          targetEl.dispatchEvent(new Event('input', { bubbles: true }));
          showToast('تم اللصق من الحافظة', 'success');
          return;
        }
      }
    } catch (e) {}
  }
  openManualPasteModal(targetInputId);
}

function openManualPasteModal(targetInputId) {
  pasteTargetInputId = targetInputId;
  const modal = document.getElementById('pasteModalOverlay');
  const input = document.getElementById('manualPasteInput');
  if (input) input.value = '';
  modal.classList.add('active');
  pushOverlayToStack('pasteModalOverlay');
  setTimeout(() => { if (input) input.focus(); }, 100);
}

function closeManualPasteModal(fromPopState = false) {
  const modal = document.getElementById('pasteModalOverlay');
  modal.classList.remove('active');
  removeOverlayFromStack('pasteModalOverlay', fromPopState);
  pasteTargetInputId = null;
}

function applyManualPaste() {
  const input = document.getElementById('manualPasteInput');
  const val = input ? input.value.trim() : '';
  if (!val) {
    showToast('يرجى لصق النص في المربع أولاً', 'error');
    return;
  }
  if (pasteTargetInputId) {
    const targetEl = document.getElementById(pasteTargetInputId);
    if (targetEl) {
      targetEl.value = val;
      targetEl.dispatchEvent(new Event('input', { bubbles: true }));
      showToast('تم إدراج الرابط بنجاح', 'success');
    }
  }
  closeManualPasteModal();
}

// ========================================================
// وضع المدير (ADMIN MODE & MODALS)
// ========================================================
let titleClickTimestamps = [];

function setAdminMode(enabled, silent = false) {
  isAdminMode = Boolean(enabled);
  try { localStorage.setItem(STORAGE_KEY_ADMIN_STATE, isAdminMode ? 'true' : 'false'); } catch (e) {}
  document.body.classList.toggle('admin-mode', isAdminMode);
  const adminDot = document.getElementById('adminStatusDot');
  if (adminDot) adminDot.style.display = isAdminMode ? 'inline-block' : 'none';
  renderSites();
  if (!silent) {
    showToast(
      isAdminMode ? 'تم تفعيل وضع المدير (الصلاحيات الكاملة)' : 'تم الخروج من وضع المدير',
      isAdminMode ? 'success' : 'info'
    );
  }
}

function getAdminPassword() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ADMIN_PASS);
    if (stored && stored.trim()) return stored;
  } catch (e) {}
  return '1234';
}

function openAdminLoginModal() {
  const input = document.getElementById('adminPasswordInput');
  if (input) input.value = '';
  safeSetClass('adminLoginModalOverlay', 'active', true);
  pushOverlayToStack('adminLoginModalOverlay');
  if (input) input.focus();
}

function closeAdminLoginModal(fromPopState = false) {
  safeSetClass('adminLoginModalOverlay', 'active', false);
  removeOverlayFromStack('adminLoginModalOverlay', fromPopState);
}

function openChangePassModal() {
  const o = document.getElementById('changePassOldInput');
  const n = document.getElementById('changePassNewInput');
  const c = document.getElementById('changePassConfirmInput');
  if (o) o.value = '';
  if (n) n.value = '';
  if (c) c.value = '';
  safeSetClass('changePassModalOverlay', 'active', true);
  pushOverlayToStack('changePassModalOverlay');
  if (o) o.focus();
}

function closeChangePassModal(fromPopState = false) {
  const o = document.getElementById('changePassOldInput');
  const n = document.getElementById('changePassNewInput');
  const c = document.getElementById('changePassConfirmInput');
  if (o) o.value = '';
  if (n) n.value = '';
  if (c) c.value = '';
  safeSetClass('changePassModalOverlay', 'active', false);
  removeOverlayFromStack('changePassModalOverlay', fromPopState);
}

function saveNewAdminPassword() {
  const o = document.getElementById('changePassOldInput');
  const n = document.getElementById('changePassNewInput');
  const c = document.getElementById('changePassConfirmInput');
  const oldPass = o ? o.value : '';
  const newPass = n ? n.value.trim() : '';
  const confirmPass = c ? c.value.trim() : '';
  if (!oldPass || oldPass !== getAdminPassword()) {
    showToast('كلمة المرور القديمة غير صحيحة', 'error');
    if (o) {
      o.value = '';
      o.focus();
    }
    return;
  }
  if (!newPass) {
    showToast('يرجى إدخال كلمة المرور الجديدة', 'error');
    if (n) n.focus();
    return;
  }
  if (newPass !== confirmPass) {
    showToast('كلمتا المرور غير متطابقتين', 'error');
    if (c) c.focus();
    return;
  }
  try { localStorage.setItem(STORAGE_KEY_ADMIN_PASS, newPass); } catch (e) {}
  closeChangePassModal();
  showToast('تم حفظ كلمة المرور الجديدة بنجاح', 'success');
}

function submitAdminLogin() {
  const input = document.getElementById('adminPasswordInput');
  const entered = input ? input.value : '';
  if (entered === getAdminPassword()) {
    closeAdminLoginModal();
    setAdminMode(true);
  } else {
    showToast('كلمة المرور غير صحيحة', 'error');
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}

function handleSecretTitleClick() {
  if (isAdminMode) return;
  const now = Date.now();
  titleClickTimestamps = titleClickTimestamps.filter(t => now - t <= 2000);
  titleClickTimestamps.push(now);
  if (titleClickTimestamps.length >= 5) {
    titleClickTimestamps = [];
    openAdminLoginModal();
  }
}

// ========================================================
// توليد ونافذة رمز الباركود QR (SMART QR GENERATOR)
// ========================================================
let qrCountdownTimer = null;
let qrRemainingSeconds = 30;

function getEffectiveQrUrl() {
  return 'https://jalalhmd002-collab.github.io/favorite-/';
}

const MiniQR = (() => {
  const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x; LOG[x] = i;
    x = (x << 1) ^ (x & 0x80 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  const gfMul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];
  function rsGenPoly(deg) {
    let p = [1];
    for (let i = 0; i < deg; i++) {
      const np = new Array(p.length + 1).fill(0);
      for (let j = 0; j < p.length; j++) {
        np[j] ^= p[j];
        np[j + 1] ^= gfMul(p[j], EXP[i]);
      }
      p = np;
    }
    return p;
  }
  function rsEncode(data, ecLen) {
    const gen = rsGenPoly(ecLen);
    const res = new Uint8Array(data.length + ecLen);
    res.set(data);
    for (let i = 0; i < data.length; i++) {
      const coef = res[i];
      if (coef !== 0) {
        for (let j = 0; j < gen.length; j++) res[i + j] ^= gfMul(gen[j], coef);
      }
    }
    return res.slice(data.length);
  }
  const VER_L = [
    null,
    [26, 7, 1], [44, 10, 1], [70, 15, 1], [100, 20, 1], [134, 26, 1],
    [172, 18, 2], [196, 20, 2], [242, 24, 2], [292, 30, 2], [346, 18, 4]
  ];
  const ALIGN = [null, [], [6,18], [6,22], [6,26], [6,30], [6,34], [6,22,38], [6,24,42], [6,26,46], [6,28,50]];

  function makeMatrix(text) {
    const bytes = new TextEncoder().encode(text);
    let ver = 1;
    for (; ver <= 10; ver++) {
      const [tot, ec, blk] = VER_L[ver];
      const cap = tot - ec * blk;
      const hdr = ver >= 10 ? 20 : 12;
      if (bytes.length * 8 + hdr <= cap * 8) break;
    }
    if (ver > 10) ver = 10;
    const [tot, ec, blk] = VER_L[ver];
    const dataCap = tot - ec * blk;
    const bits = [];
    const pushBits = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
    pushBits(0b0100, 4);
    pushBits(bytes.length, ver >= 10 ? 16 : 8);
    for (const b of bytes) pushBits(b, 8);
    pushBits(0, Math.min(4, dataCap * 8 - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);
    const dc = new Uint8Array(dataCap);
    for (let i = 0; i < bits.length / 8; i++) {
      let v = 0;
      for (let j = 0; j < 8; j++) v = (v << 1) | bits[i * 8 + j];
      dc[i] = v;
    }
    const pad = [0xec, 0x11];
    for (let i = bits.length / 8; i < dataCap; i++) dc[i] = pad[(i - bits.length / 8) % 2];

    const bSize = Math.floor(dataCap / blk);
    const blocks = [];
    for (let b = 0; b < blk; b++) {
      const off = b * bSize;
      const len = (b === blk - 1) ? dataCap - off : bSize;
      const slice = dc.slice(off, off + len);
      blocks.push({ data: slice, ec: rsEncode(slice, ec) });
    }
    const finalBytes = [];
    const maxLen = Math.max(...blocks.map(b => b.data.length));
    for (let i = 0; i < maxLen; i++) {
      for (const b of blocks) { if (i < b.data.length) finalBytes.push(b.data[i]); }
    }
    for (let i = 0; i < ec; i++) {
      for (const b of blocks) finalBytes.push(b.ec[i]);
    }

    const N = 17 + 4 * ver;
    const mat = Array.from({ length: N }, () => new Int8Array(N).fill(-1));
    const res = Array.from({ length: N }, () => new Uint8Array(N));
    const setFn = (r, c, v) => { mat[r][c] = v; res[r][c] = 1; };

    const finder = (r0, c0) => {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const rr = r0 + r, cc = c0 + c;
          if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
          const inside = (r >= 0 && r <= 6 && c >= 0 && c <= 6);
          const dark = inside && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
          setFn(rr, cc, dark ? 1 : 0);
        }
      }
    };
    finder(0, 0); finder(0, N - 7); finder(N - 7, 0);

    for (let i = 8; i < N - 8; i++) {
      if (!res[6][i]) setFn(6, i, i % 2 === 0 ? 1 : 0);
      if (!res[i][6]) setFn(i, 6, i % 2 === 0 ? 1 : 0);
    }

    if (!res[4 * ver + 9][8]) setFn(4 * ver + 9, 8, 1);

    const al = ALIGN[ver];
    for (const ar of al) {
      for (const ac of al) {
        if (res[ar][ac]) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const dark = (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0));
            setFn(ar + r, ac + c, dark ? 1 : 0);
          }
        }
      }
    }

    for (let i = 0; i < 9; i++) {
      if (i < N && !res[8][i]) res[8][i] = 1;
      if (i < N && !res[i][8]) res[i][8] = 1;
    }
    for (let i = 0; i < 8; i++) {
      if (!res[8][N - 1 - i]) res[8][N - 1 - i] = 1;
      if (!res[N - 1 - i][8]) res[N - 1 - i][8] = 1;
    }

    let bitIdx = 0;
    const totalBits = finalBytes.length * 8;
    for (let right = N - 1; right > 0; right -= 2) {
      if (right === 6) right--;
      for (let vert = 0; vert < N; vert++) {
        for (let col = 0; col < 2; col++) {
          const c = right - col;
          const r = ((right + 1) & 2) ? (N - 1 - vert) : vert;
          if (res[r][c]) continue;
          let b = 0;
          if (bitIdx < totalBits) {
            const byte = finalBytes[bitIdx >> 3];
            b = (byte >> (7 - (bitIdx & 7))) & 1;
            bitIdx++;
          }
          const mask = ((r + c) % 2 === 0);
          mat[r][c] = mask ? (b ^ 1) : b;
        }
      }
    }

    const fmt = 0b111011111000100;
    const fCoords1 = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
    const fCoords2 = [[N-1,8],[N-2,8],[N-3,8],[N-4,8],[N-5,8],[N-6,8],[N-7,8],[8,N-8],[8,N-7],[8,N-6],[8,N-5],[8,N-4],[8,N-3],[8,N-2],[8,N-1]];
    for (let i = 0; i < 15; i++) {
      const bit = (fmt >> (14 - i)) & 1;
      mat[fCoords1[i][0]][fCoords1[i][1]] = bit;
      mat[fCoords2[i][0]][fCoords2[i][1]] = bit;
    }
    return mat;
  }

  function toSvg(text, size = 260) {
    const mat = makeMatrix(text);
    const N = mat.length;
    const pad = 3;
    const total = N + pad * 2;
    let d = '';
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (mat[r][c] === 1) {
          d += `M${c + pad},${r + pad}h1v1h-1z `;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${size}" height="${size}" shape-rendering="crispEdges">
      <rect width="${total}" height="${total}" fill="#ffffff"/>
      <path d="${d}" fill="#0f172a"/>
    </svg>`;
  }

  return { toSvg };
})();

function renderQrCode(url) {
  const container = document.getElementById('qrCodeContainer');
  const urlText = document.getElementById('qrCurrentUrlText') || document.getElementById('qrUrlText');
  if (!container) return;
  if (urlText) urlText.textContent = url;
  container.innerHTML = MiniQR.toSvg(url, 240);
  const svg = container.querySelector('svg');
  if (svg) {
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';
    svg.style.borderRadius = '12px';
  }
}

function updateQrCountdownUI() {
  const textEl = document.getElementById('qrCountdownText');
  const barEl = document.getElementById('qrCountdownBar');
  if (textEl) textEl.textContent = `الإغلاق التلقائي خلال ${qrRemainingSeconds} ثانية`;
  if (barEl) {
    const pct = Math.max(0, Math.min(100, (qrRemainingSeconds / 30) * 100));
    barEl.style.width = pct + '%';
  }
}

function stopQrTimer() {
  if (qrCountdownTimer) {
    clearInterval(qrCountdownTimer);
    qrCountdownTimer = null;
  }
}

function openQrModal() {
  renderQrCode(getEffectiveQrUrl());
  safeSetClass('qrModalOverlay', 'active', true);
  pushOverlayToStack('qrModalOverlay');

  stopQrTimer();
  qrRemainingSeconds = 30;
  updateQrCountdownUI();

  qrCountdownTimer = setInterval(() => {
    qrRemainingSeconds--;
    updateQrCountdownUI();
    if (qrRemainingSeconds <= 0) {
      stopQrTimer();
      closeQrModal();
    }
  }, 1000);
}

function closeQrModal(fromPopState = false) {
  stopQrTimer();
  safeSetClass('qrModalOverlay', 'active', false);
  removeOverlayFromStack('qrModalOverlay', fromPopState);
}

// ========================================================
// ربط أحداث النماذج والنوافذ المنبثقة عند تحميل الصفحة
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
  // Custom Select Triggers
  setupCustomSelectTrigger('quickCategorySelectWrapper', 'quickCategoryTrigger');
  setupCustomSelectTrigger('manageCategorySelectWrapper', 'manageCategoryTrigger');
  setupCustomSelectTrigger('newCategoryIconWrapper', 'newCategoryIconTrigger');

  // Close Custom Selects on outside click
  document.addEventListener('click', () => closeAllCustomSelects());

  // Add Site Modal Triggers
  ['openAddModalBtn', 'openAddSiteModalBtn', 'brandDropdownAddLinkBtn', 'bottomNavAddBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => {
      closeBrandDropdown();
      openAddModal();
    });
  });

  // Close Add Modal
  ['closeAddModalBtn', 'cancelAddModalBtn', 'cancelAddBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => closeAddModal());
  });

  // Save Add Site
  ['addCustomSiteBtn', 'saveQuickSiteBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', addCustomSite);
  });

  // Favorite toggle in Add Modal
  const addFavToggleBtn = document.getElementById('addFavToggleBtn');
  if (addFavToggleBtn) {
    addFavToggleBtn.addEventListener('click', () => {
      addModalFavorite = !addModalFavorite;
      updateAddFavButton();
    });
  }

  // Paste buttons in Add and Manage Modals
  ['pasteBtn', 'quickPasteBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => handlePaste('quickUrlInput'));
  });
  const managePasteBtn = document.getElementById('managePasteBtn');
  if (managePasteBtn) {
    managePasteBtn.addEventListener('click', () => handlePaste('manageSiteUrl'));
  }

  // New Category button inside Add Modal
  const quickNewCatBtn = document.getElementById('quickNewCatBtn');
  if (quickNewCatBtn) {
    quickNewCatBtn.addEventListener('click', () => {
      closeAddModal();
      openAddCategoryModal();
    });
  }

  const addOverlay = document.getElementById('addModalOverlay');
  if (addOverlay) {
    addOverlay.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeAddModal();
    });
  }

  // Category Curtain
  ['categoryCurtainTrigger', 'navCatsBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        const overlay = document.getElementById('categoryCurtainOverlay');
        if (overlay && overlay.classList.contains('active')) closeCurtain();
        else openCurtain();
      });
    }
  });

  const closeCurtainBtn = document.getElementById('closeCurtainBtn');
  if (closeCurtainBtn) closeCurtainBtn.addEventListener('click', () => closeCurtain());
  const curtainOverlay = document.getElementById('categoryCurtainOverlay');
  if (curtainOverlay) {
    curtainOverlay.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeCurtain();
    });
  }

  const curtainAddCatBtn = document.getElementById('curtainAddCategoryBtn');
  if (curtainAddCatBtn) {
    curtainAddCatBtn.addEventListener('click', () => {
      closeCurtain();
      openAddCategoryModal();
    });
  }

  // Add Category Modal
  ['closeAddCategoryModalBtn', 'cancelAddCategoryBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => closeAddCategoryModal());
  });
  const saveCatBtn = document.getElementById('saveNewCategoryBtn');
  if (saveCatBtn) saveCatBtn.addEventListener('click', saveNewCategory);
  const addCatOverlay = document.getElementById('addCategoryModalOverlay');
  if (addCatOverlay) {
    addCatOverlay.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeAddCategoryModal();
    });
  }

  // Manage Site Modal
  const manageFavBtn = document.getElementById('manageFavToggleBtn');
  if (manageFavBtn) manageFavBtn.addEventListener('click', toggleFavoriteFromManage);
  const manageMoveBtn = document.getElementById('manageMoveApplyBtn');
  if (manageMoveBtn) manageMoveBtn.addEventListener('click', applyMoveCategoryFromManage);
  ['closeManageModalBtn', 'cancelManageBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => closeManageModal());
  });
  const saveManageBtn = document.getElementById('saveManageBtn');
  if (saveManageBtn) saveManageBtn.addEventListener('click', saveManageEdits);
  const manageDeleteBtn = document.getElementById('manageDeleteBtn');
  if (manageDeleteBtn) manageDeleteBtn.addEventListener('click', openDeleteModalFromManage);

  // Delete Modal
  ['closeDeleteModalBtn', 'cancelDeleteBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => closeDeleteModal());
  });
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDelete);
  const deleteOverlay = document.getElementById('deleteModalOverlay');
  if (deleteOverlay) {
    deleteOverlay.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeDeleteModal();
    });
  }

  // Paste Modal
  ['closePasteModalBtn', 'cancelPasteBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => closeManualPasteModal());
  });
  const confirmPasteBtn = document.getElementById('confirmPasteBtn');
  if (confirmPasteBtn) confirmPasteBtn.addEventListener('click', applyManualPaste);
  const pasteOverlay = document.getElementById('pasteModalOverlay');
  if (pasteOverlay) {
    pasteOverlay.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeManualPasteModal();
    });
  }

  // QR Modal
  ['qrCodeTriggerBtn', 'brandDropdownQrBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => {
      closeBrandDropdown();
      openQrModal();
    });
  });
  ['closeQrModalBtn', 'cancelQrModalBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => closeQrModal());
  });
  const qrOverlay = document.getElementById('qrModalOverlay');
  if (qrOverlay) {
    qrOverlay.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeQrModal();
    });
  }
  const copyQrBtn = document.getElementById('copyQrUrlBtn');
  if (copyQrBtn) {
    copyQrBtn.addEventListener('click', () => {
      const url = getEffectiveQrUrl();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          showToast('تم نسخ الرابط بنجاح', 'success');
        }).catch(() => {
          showToast('تعذر النسخ التلقائي للرابط', 'error');
        });
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('تم نسخ الرابط بنجاح', 'success');
      }
    });
  }

  // Admin Login & Password
  ['closeAdminLoginBtn', 'closeAdminLoginModalBtn', 'cancelAdminLoginBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => closeAdminLoginModal());
  });
  ['confirmAdminLoginBtn', 'submitAdminLoginBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', submitAdminLogin);
  });
  const adminPassInput = document.getElementById('adminPasswordInput');
  if (adminPassInput) {
    adminPassInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitAdminLogin();
    });
  }
  const adminOverlay = document.getElementById('adminLoginModalOverlay');
  if (adminOverlay) {
    adminOverlay.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeAdminLoginModal();
    });
  }

  // Change Password Modal
  ['brandDropdownChangePassBtn', 'changeAdminPassBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => {
      closeBrandDropdown();
      openChangePassModal();
    });
  });
  ['closeChangePassBtn', 'closeChangePassModalBtn', 'cancelChangePassBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => closeChangePassModal());
  });
  const savePassBtn = document.getElementById('saveChangePassBtn');
  if (savePassBtn) savePassBtn.addEventListener('click', saveNewAdminPassword);
  const changePassOverlay = document.getElementById('changePassModalOverlay');
  if (changePassOverlay) {
    changePassOverlay.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeChangePassModal();
    });
  }

  // Exit Admin Mode button
  const exitAdminBtn = document.getElementById('brandDropdownExitAdminBtn');
  if (exitAdminBtn) {
    exitAdminBtn.addEventListener('click', () => {
      closeBrandDropdown();
      setAdminMode(false);
    });
  }
});
