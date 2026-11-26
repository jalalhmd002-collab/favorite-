/**
 * Code.gs - Google Apps Script Backend with Multi-User Device ID Isolation
 * Sheets: Sites, Categories, Meta
 */

const SITES_HEADERS = [
  'deviceId',
  'id',
  'name',
  'description',
  'url',
  'domain',
  'category',
  'translate',
  'visits',
  'lastVisited',
  'isFavorite',
  'isHidden'
];

const CATEGORIES_HEADERS = ['deviceId', 'id', 'name', 'icon'];
const META_HEADERS = ['deviceId', 'key', 'value'];

function ensureSheetHeaders_(sheet, expectedHeaders) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow === 0 || lastCol === 0) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    return expectedHeaders;
  }
  const existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  if (existingHeaders.indexOf('deviceId') === -1) {
    sheet.insertColumnBefore(1);
    sheet.getRange(1, 1).setValue('deviceId');
    return ['deviceId'].concat(existingHeaders);
  }
  return existingHeaders;
}

function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let sitesSheet = ss.getSheetByName('Sites');
  if (!sitesSheet) sitesSheet = ss.insertSheet('Sites');
  ensureSheetHeaders_(sitesSheet, SITES_HEADERS);

  let catsSheet = ss.getSheetByName('Categories');
  if (!catsSheet) catsSheet = ss.insertSheet('Categories');
  ensureSheetHeaders_(catsSheet, CATEGORIES_HEADERS);

  let metaSheet = ss.getSheetByName('Meta');
  if (!metaSheet) metaSheet = ss.insertSheet('Meta');
  ensureSheetHeaders_(metaSheet, META_HEADERS);

  return { sitesSheet: sitesSheet, catsSheet: catsSheet, metaSheet: metaSheet };
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const sheets = ensureSheets_();
    const deviceId = String((e && e.parameter && e.parameter.deviceId) || 'admin_master').trim() || 'admin_master';

    // Read Sites filtered by deviceId
    const sitesData = sheets.sitesSheet.getDataRange().getValues();
    const sHeaders = sitesData[0] || SITES_HEADERS;
    const sDevIdx = sHeaders.indexOf('deviceId');
    const sites = [];
    for (let i = 1; i < sitesData.length; i++) {
      const row = sitesData[i];
      const rowDevId = String((sDevIdx >= 0 ? row[sDevIdx] : '') || 'admin_master').trim() || 'admin_master';
      if (rowDevId !== deviceId) continue;

      const obj = {};
      for (let c = 0; c < sHeaders.length; c++) {
        if (sHeaders[c] !== 'deviceId') {
          obj[sHeaders[c]] = row[c];
        }
      }
      obj.translate = obj.translate === true || obj.translate === 'true';
      obj.isFavorite = obj.isFavorite === true || obj.isFavorite === 'true';
      obj.isHidden = obj.isHidden === true || obj.isHidden === 'true';
      obj.visits = Number(obj.visits) || 0;
      obj.lastVisited = Number(obj.lastVisited) || Date.now();
      sites.push(obj);
    }

    // Read Categories filtered by deviceId
    const catsData = sheets.catsSheet.getDataRange().getValues();
    const cHeaders = catsData[0] || CATEGORIES_HEADERS;
    const cDevIdx = cHeaders.indexOf('deviceId');
    const categories = [];
    for (let i = 1; i < catsData.length; i++) {
      const row = catsData[i];
      const rowDevId = String((cDevIdx >= 0 ? row[cDevIdx] : '') || 'admin_master').trim() || 'admin_master';
      if (rowDevId !== deviceId) continue;

      const obj = {};
      for (let c = 0; c < cHeaders.length; c++) {
        if (cHeaders[c] !== 'deviceId') {
          obj[cHeaders[c]] = row[c];
        }
      }
      categories.push(obj);
    }

    // Read Meta filtered by deviceId
    let deletedBuiltinCats = [];
    const metaData = sheets.metaSheet.getDataRange().getValues();
    for (let i = 1; i < metaData.length; i++) {
      const rowDevId = String(metaData[i][0] || 'admin_master').trim() || 'admin_master';
      if (rowDevId !== deviceId) continue;
      const k = String(metaData[i][1] || '');
      const v = String(metaData[i][2] || '');
      if (k === 'deletedBuiltinCats') {
        try { deletedBuiltinCats = JSON.parse(v) || []; } catch (err) {}
      }
    }

    return jsonResponse_({
      ok: true,
      deviceId: deviceId,
      sites: sites,
      categories: categories,
      deletedBuiltinCats: deletedBuiltinCats
    });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function replaceRowsForDevice_(sheet, headers, deviceId, newRows) {
  const allValues = sheet.getDataRange().getValues();
  const devIdx = headers.indexOf('deviceId');
  const keptRows = [headers];

  for (let i = 1; i < allValues.length; i++) {
    const row = allValues[i];
    const rowDevId = String((devIdx >= 0 ? row[devIdx] : '') || 'admin_master').trim() || 'admin_master';
    if (rowDevId !== deviceId) {
      keptRows.push(row);
    }
  }

  for (let j = 0; j < newRows.length; j++) {
    keptRows.push(newRows[j]);
  }

  sheet.clearContents();
  if (keptRows.length > 0) {
    sheet.getRange(1, 1, keptRows.length, headers.length).setValues(keptRows);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheets = ensureSheets_();
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const data = JSON.parse(raw);
    const deviceId = String(data.deviceId || 'admin_master').trim() || 'admin_master';

    // Update Sites only for this deviceId
    const sHeaders = sheets.sitesSheet.getRange(1, 1, 1, sheets.sitesSheet.getLastColumn()).getValues()[0].map(String);
    const incomingSites = Array.isArray(data.sites) ? data.sites : [];
    const newSiteRows = incomingSites.map(function (s) {
      return sHeaders.map(function (col) {
        if (col === 'deviceId') return deviceId;
        return s[col] !== undefined ? s[col] : '';
      });
    });
    replaceRowsForDevice_(sheets.sitesSheet, sHeaders, deviceId, newSiteRows);

    // Update Categories only for this deviceId
    const cHeaders = sheets.catsSheet.getRange(1, 1, 1, sheets.catsSheet.getLastColumn()).getValues()[0].map(String);
    const incomingCats = Array.isArray(data.categories) ? data.categories : [];
    const newCatRows = incomingCats.map(function (c) {
      return cHeaders.map(function (col) {
        if (col === 'deviceId') return deviceId;
        return c[col] !== undefined ? c[col] : '';
      });
    });
    replaceRowsForDevice_(sheets.catsSheet, cHeaders, deviceId, newCatRows);

    // Update Meta only for this deviceId
    const metaRows = [
      [deviceId, 'deletedBuiltinCats', JSON.stringify(Array.isArray(data.deletedBuiltinCats) ? data.deletedBuiltinCats : [])]
    ];
    replaceRowsForDevice_(sheets.metaSheet, META_HEADERS, deviceId, metaRows);

    return jsonResponse_({ ok: true, deviceId: deviceId, count: newSiteRows.length });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
