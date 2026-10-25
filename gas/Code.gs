/**
 * FrozenFood POS - Google Apps Script Backend
 *
 * Setup:
 * 1. Buat Google Spreadsheet baru
 * 2. Extensions > Apps Script
 * 3. Paste kode ini
 * 4. Jalankan setup() satu kali untuk membuat semua sheet
 * 5. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy deployment URL ke src/services/api.ts (SCRIPT_URL)
 *
 * CHANGES (Date handling):
 * - Semua kolom "tanggal" sekarang disimpan sebagai Date object (bukan string)
 *   sehingga Google Sheets mengenalnya sebagai Date, bukan plain text
 * - Semua perbandingan tanggal menggunakan Utilities.formatDate() dengan
 *   timezone script (bukan toISOString yang pakai UTC)
 * - Sales: tanggal disimpan sebagai datetime lengkap (new Date())
 * - Purchase/Stock/Expense/Capital: menerima tanggal dari frontend (yyyy-mm-dd),
 *   dikonversi ke Date object sebelum disimpan
 *
 * CHANGES (Auth - token sesi + shared secret):
 * - Password user tidak lagi dipakai sebagai kredensial request.
 *   Login memverifikasi username/password lalu membuat token sesi
 *   (disimpan di sheet SESSIONS, expired 24 jam - pendekatan sama
 *   dengan diary-teachlife). Setiap request lain wajib membawa
 *   `token` (sesi aktif) dan `secret` (shared secret yang disimpan
 *   di Script Properties, bukan di source code).
 * 3 role: owner, admin, kasir
 * - Default users: owner/owner123, admin/admin123, kasir/kasir123
 * - Pembatasan menu ada di frontend (src/config/permissions.ts)
 *
 * CATATAN DEMO: ini model auth demo (bukan produksi). Secret tetap
 * berada di sisi klien (VITE_GAS_SECRET) dan password tersimpan
 * plain di sheet. Cukup untuk mencegah akses tanpa kredensial.
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();

var SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam

var SHEETS = {
  USERS:        ['id', 'username', 'password', 'nama', 'role'],
  PRODUCTS:     ['id', 'barcode', 'nama', 'kategori', 'modal', 'ecer', 'grosir', 'min_grosir', 'stock', 'expired'],
  STOCK:        ['id', 'tanggal', 'barcode', 'jenis', 'qty', 'keterangan'],
  PURCHASE:     ['no', 'supplier', 'tanggal', 'barcode', 'qty', 'modal', 'total_modal'],
  SALES:        ['invoice', 'tanggal', 'kasir', 'subtotal', 'diskon', 'total', 'bayar', 'kembali', 'metode'],
  SALES_DETAIL: ['invoice', 'barcode', 'produk', 'qty', 'harga', 'modal', 'profit'],
  EXPENSE:      ['id', 'tanggal', 'kategori', 'nominal', 'keterangan'],
  CAPITAL:      ['id', 'tanggal', 'jenis', 'nominal', 'keterangan'],
  SUPPLIER:     ['id', 'nama', 'telepon', 'alamat'],
  CUSTOMER:     ['id', 'nama', 'telepon', 'poin'],
  LOG:          ['timestamp', 'aksi', 'detail'],
  SESSIONS:     ['token', 'username', 'created', 'expires']
};

function setup() {
  Object.keys(SHEETS).forEach(function (name) {
    var sheet = SS.getSheetByName(name);
    if (!sheet) sheet = SS.insertSheet(name);
    var headers = SHEETS[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  });

  var users = SS.getSheetByName('USERS');
  if (users.getLastRow() < 2) {
    users.appendRow(['1', 'owner', 'owner123', 'Owner', 'owner']);
    users.appendRow(['2', 'admin', 'admin123', 'Admin', 'admin']);
    users.appendRow(['3', 'kasir', 'kasir123', 'Kasir 1', 'kasir']);
  }

  var suppliers = SS.getSheetByName('SUPPLIER');
  if (suppliers.getLastRow() < 2) {
    suppliers.appendRow(['1', 'Supplier Umum', '-', '-']);
  }

  // Shared secret disimpan di Script Properties (bukan source code).
  // Jalankan setup() sekali, buka Execution log untuk melihat secretnya.
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('SHARED_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('SHARED_SECRET', secret);
  }
  Logger.log('SHARED_SECRET (untuk VITE_GAS_SECRET di .env): ' + secret);

  Logger.log('Setup selesai. Semua sheet dibuat.');
}

function doGet(e) { return handle(e); }
function doPost(e) { return handle(e); }

function handle(e) {
  try {
    var p = e.parameter;
    var body = {};
    if (e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch (ex) { body = {}; }
    }
    var endpoint = p.endpoint || body.endpoint || '';
    endpoint = endpoint.replace(/^\//, '');

    var action = endpoint.replace('api/', '').replace(/^api\//, '');
    if (action !== 'login' && !requireAuth(p, body)) {
      return json({ success: false, message: 'Unauthorized: token/secret tidak valid', code: 401 });
    }
    var result = route(action, p, body);
    return json(result);
  } catch (err) {
    return json({ success: false, message: String(err) });
  }
}

function route(action, p, body) {
  switch (action) {
    case 'api/login':      return login(p, body);
    case 'login':          return login(p, body);

    case 'products':       return getProducts(body);
    case 'products/create': return createProduct(body);
    case 'products/update': return updateProduct(body);
    case 'products/delete': return deleteProduct(body);

    case 'stock':          return getStock(body);
    case 'stock/in':       return stockIn(body);
    case 'stock/out':      return stockOut(body);

    case 'purchase':       return createPurchase(body);
    case 'purchases':      return getPurchases(body);

    case 'sales':          return createSale(body);

    case 'expense':        return getExpenses();
    case 'expense/create': return createExpense(body);
    case 'expenses':       return getExpenses();

    case 'capital':        return getCapitals();
    case 'capital/create': return createCapital(body);
    case 'capitals':       return getCapitals();

    case 'supplier':       return getSuppliers();
    case 'supplier/create': return createSupplier(body);
    case 'supplier/update': return updateSupplier(body);
    case 'supplier/delete': return deleteSupplier(body);
    case 'suppliers':      return getSuppliers();

    case 'report':         return getReport(body);
    case 'summary':        return getSummary();
    case 'chart':          return getChartData(body);

    default:               return { success: false, message: 'Endpoint tidak ditemukan: ' + action };
  }
}

// === AUTH ===
function getSharedSecret() {
  return PropertiesService.getScriptProperties().getProperty('SHARED_SECRET') || '';
}

function requireAuth(p, body) {
  var secret = String(body.secret || p.secret || '');
  if (!getSharedSecret() || secret !== getSharedSecret()) return false;
  return isValidToken(String(body.token || p.token || ''));
}

function isValidToken(token) {
  if (!token) return false;
  var sheet = SS.getSheetByName('SESSIONS');
  var data = sheet.getDataRange().getValues();
  var now = Date.now();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      var expires = data[i][3] instanceof Date ? data[i][3].getTime() : new Date(data[i][3]).getTime();
      if (expires > now) return true;
      sheet.deleteRow(i + 1); // bersihkan token kedaluwarsa
      return false;
    }
  }
  return false;
}

function login(p, body) {
  // Login juga harus membawa shared secret agar password sheet
  // tidak bisa dicoba langsung dari luar aplikasi.
  if (!getSharedSecret() || String(body.secret || p.secret || '') !== getSharedSecret()) {
    return { success: false, message: 'Shared secret tidak valid' };
  }

  var username = body.username || p.username;
  var password = body.password || p.password;
  var sheet = SS.getSheetByName('USERS');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === username && data[i][2] === password) {
      var token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
      var now = new Date();
      var expires = new Date(now.getTime() + SESSION_TTL_MS);
      SS.getSheetByName('SESSIONS').appendRow([token, username, now, expires]);
      return {
        success: true,
        token: token,
        expiresAt: expires.toISOString(),
        user: { id: String(data[i][0]), username: data[i][1], nama: data[i][3], role: data[i][4] }
      };
    }
  }
  return { success: false, message: 'Username atau password salah' };
}

// === PRODUCTS ===
function mapProduct(row) {
  return {
    id: String(row[0]),
    barcode: String(row[1]),
    nama: row[2],
    kategori: row[3],
    modal: Number(row[4]),
    ecer: Number(row[5]),
    grosir: Number(row[6]),
    minGrosir: Number(row[7]),
    stock: Number(row[8]),
    expired: formatDate(row[9])
  };
}

function getProducts(body) {
  var sheet = SS.getSheetByName('PRODUCTS');
  var lastRow = sheet.getLastRow();
  var total = Math.max(0, lastRow - 1);

  if (body && body.page) {
    var page = Number(body.page) || 1;
    var limit = Number(body.limit) || 20;
    var offset = (page - 1) * limit;
    if (offset >= total) return { data: [], total: total, page: page, limit: limit, hasMore: false };
    var numRows = Math.min(limit, total - offset);
    var data = sheet.getRange(2 + offset, 1, numRows, 10).getValues();
    var result = [];
    for (var i = 0; i < data.length; i++) {
      if (!data[i][0]) continue;
      result.push(mapProduct(data[i]));
    }
    return { data: result, total: total, page: page, limit: limit, hasMore: (offset + numRows) < total };
  }

  var allData = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < allData.length; i++) {
    if (!allData[i][0]) continue;
    result.push(mapProduct(allData[i]));
  }
  return result;
}

function createProduct(body) {
  var sheet = SS.getSheetByName('PRODUCTS');
  var id = body.id || String(Date.now());
  sheet.appendRow([
    id, body.barcode, body.nama, body.kategori,
    Number(body.modal), Number(body.ecer), Number(body.grosir), Number(body.minGrosir),
    Number(body.stock), body.expired
  ]);
  log('CREATE_PRODUCT', body.nama);
  return { success: true, id: id };
}

function updateProduct(body) {
  var sheet = SS.getSheetByName('PRODUCTS');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) {
      sheet.getRange(i + 1, 1, 1, 10).setValues([[
        body.id, body.barcode || data[i][1], body.nama || data[i][2], body.kategori || data[i][3],
        Number(body.modal) || data[i][4], Number(body.ecer) || data[i][5], Number(body.grosir) || data[i][6],
        Number(body.minGrosir) || data[i][7], Number(body.stock) || data[i][8], body.expired || data[i][9]
      ]]);
      log('UPDATE_PRODUCT', body.nama || data[i][2]);
      return { success: true };
    }
  }
  return { success: false, message: 'Produk tidak ditemukan' };
}

function deleteProduct(body) {
  var sheet = SS.getSheetByName('PRODUCTS');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) {
      sheet.deleteRow(i + 1);
      log('DELETE_PRODUCT', String(body.id));
      return { success: true };
    }
  }
  return { success: false, message: 'Produk tidak ditemukan' };
}

// === STOCK ===
function getStock(body) {
  var sheet = SS.getSheetByName('STOCK');
  var lastRow = sheet.getLastRow();
  var total = Math.max(0, lastRow - 1);

  if (body && body.page) {
    var page = Number(body.page) || 1;
    var limit = Number(body.limit) || 20;
    var offset = (page - 1) * limit;
    if (offset >= total) return { data: [], total: total, page: page, limit: limit, hasMore: false };
    var numRows = Math.min(limit, total - offset);
    var data = sheet.getRange(2 + offset, 1, numRows, 6).getValues();
    var result = [];
    for (var i = 0; i < data.length; i++) {
      if (!data[i][0]) continue;
      result.push({
        id: String(data[i][0]), tanggal: formatDate(data[i][1]),
        barcode: String(data[i][2]), jenis: data[i][3], qty: Number(data[i][4]), keterangan: data[i][5]
      });
    }
    return { data: result, total: total, page: page, limit: limit, hasMore: (offset + numRows) < total };
  }

  var allData = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < allData.length; i++) {
    if (!allData[i][0]) continue;
    result.push({
      id: String(allData[i][0]), tanggal: formatDate(allData[i][1]),
      barcode: String(allData[i][2]), jenis: allData[i][3], qty: Number(allData[i][4]), keterangan: allData[i][5]
    });
  }
  return result;
}

function stockIn(body) {
  var sheet = SS.getSheetByName('STOCK');
  var tanggal = body.tanggal ? new Date(body.tanggal) : new Date();
  // Idempotensi: kunci = body.id (dikirim frontend saat retry sync offline).
  // Tanpa kunci -> perilaku lama (id timestamp per-call, tidak dedupe).
  var key = body.id || body.key;
  var dup = findRowByKey(sheet, 0, key);
  if (key && dup !== -1) {
    return { success: true, id: String(key), duplicate: true };
  }
  sheet.appendRow([String(key || Date.now()), tanggal, body.barcode, 'in', Number(body.qty), body.keterangan || '']);

  var pSheet = SS.getSheetByName('PRODUCTS');
  var data = pSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(body.barcode)) {
      pSheet.getRange(i + 1, 9).setValue(Number(data[i][8]) + Number(body.qty));
      return { success: true };
    }
  }
  return { success: false, message: 'Barcode tidak ditemukan' };
}

function stockOut(body) {
  var sheet = SS.getSheetByName('STOCK');
  var tanggal = body.tanggal ? new Date(body.tanggal) : new Date();
  // Idempotensi: kunci = body.id (dikirim frontend saat retry sync offline).
  var key = body.id || body.key;
  var dup = findRowByKey(sheet, 0, key);
  if (key && dup !== -1) {
    return { success: true, id: String(key), duplicate: true };
  }
  sheet.appendRow([String(key || Date.now()), tanggal, body.barcode, 'out', Number(body.qty), body.keterangan || '']);

  var pSheet = SS.getSheetByName('PRODUCTS');
  var data = pSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(body.barcode)) {
      pSheet.getRange(i + 1, 9).setValue(Number(data[i][8]) - Number(body.qty));
      return { success: true };
    }
  }
  return { success: false, message: 'Barcode tidak ditemukan' };
}

// === PURCHASE ===
function createPurchase(body) {
  var sheet = SS.getSheetByName('PURCHASE');
  var no = body.no || String(Date.now());
  // Idempotensi: kunci = no pembelian. Retry sync offline / double-submit
  // dengan `no` sama tidak menggandakan baris.
  if (body.no && findRowByKey(sheet, 0, no) !== -1) {
    return { success: true, no: no, duplicate: true };
  }
  var tanggal = body.tanggal ? new Date(body.tanggal) : new Date();
  var qty = Number(body.qty);
  var modal = Number(body.modal);
  var totalModal = qty * modal;
  sheet.appendRow([no, body.supplier, tanggal, body.barcode, qty, modal, totalModal]);
  log('CREATE_PURCHASE', body.supplier + ' - ' + body.barcode);
  return { success: true, no: no };
}

function getPurchases(body) {
  var sheet = SS.getSheetByName('PURCHASE');
  var lastRow = sheet.getLastRow();
  var total = Math.max(0, lastRow - 1);

  if (body && body.page) {
    var page = Number(body.page) || 1;
    var limit = Number(body.limit) || 20;
    var offset = (page - 1) * limit;
    if (offset >= total) return { data: [], total: total, page: page, limit: limit, hasMore: false };
    var numRows = Math.min(limit, total - offset);
    var data = sheet.getRange(2 + offset, 1, numRows, 7).getValues();
    var result = [];
    for (var i = 0; i < data.length; i++) {
      if (!data[i][0]) continue;
      result.push({
        no: String(data[i][0]), supplier: data[i][1], tanggal: formatDate(data[i][2]),
        barcode: String(data[i][3]), qty: Number(data[i][4]), modal: Number(data[i][5]),
        totalModal: Number(data[i][6])
      });
    }
    return { data: result, total: total, page: page, limit: limit, hasMore: (offset + numRows) < total };
  }

  var allData = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < allData.length; i++) {
    if (!allData[i][0]) continue;
    result.push({
      no: String(allData[i][0]), supplier: allData[i][1], tanggal: formatDate(allData[i][2]),
      barcode: String(allData[i][3]), qty: Number(allData[i][4]), modal: Number(allData[i][5]),
      totalModal: Number(allData[i][6])
    });
  }
  return result;
}

// === SALES ===
function createSale(body) {
  var salesSheet = SS.getSheetByName('SALES');
  var detailSheet = SS.getSheetByName('SALES_DETAIL');
  var pSheet = SS.getSheetByName('PRODUCTS');

  var invoice = body.invoice || ('INV' + Date.now());
  var tanggal = new Date();

  // Idempotensi: jika invoice sudah ada di sheet (retry offline sync,
  // double-submit), jangan append lagi - kembalikan sukses.
  var existing = salesSheet.getDataRange().getValues();
  for (var e = 1; e < existing.length; e++) {
    if (String(existing[e][0]) === String(invoice)) {
      return { success: true, invoice: invoice, duplicate: true, profit: 0 };
    }
  }

  var kasir = body.kasir || 'admin';
  var subtotal = Number(body.subtotal) || 0;
  var diskon = Number(body.diskon) || 0;
  var total = Number(body.total) || (subtotal - diskon);
  var bayar = Number(body.bayar) || total;
  var kembali = Number(body.kembali) || Math.max(0, bayar - total);
  var metode = body.metode || 'cash';

  salesSheet.appendRow([invoice, tanggal, kasir, subtotal, diskon, total, bayar, kembali, metode]);

  var details = body.details || [];
  var pData = pSheet.getDataRange().getValues();
  var totalProfit = 0;

  for (var d = 0; d < details.length; d++) {
    var item = details[d];
    var profit = (item.harga - item.modal) * item.qty;
    totalProfit += profit;

    detailSheet.appendRow([
      invoice, item.barcode, item.nama, Number(item.qty),
      Number(item.harga), Number(item.modal), profit
    ]);

    for (var i = 1; i < pData.length; i++) {
      if (String(pData[i][1]) === String(item.barcode)) {
        pSheet.getRange(i + 1, 9).setValue(Number(pData[i][8]) - Number(item.qty));
        break;
      }
    }
  }

  log('CREATE_SALE', invoice + ' total=' + total + ' profit=' + totalProfit);
  return { success: true, invoice: invoice, profit: totalProfit };
}

// === EXPENSE ===
function getExpenses() {
  var sheet = SS.getSheetByName('EXPENSE');
  var data = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    result.push({
      id: String(data[i][0]), tanggal: formatDate(data[i][1]),
      kategori: data[i][2], nominal: Number(data[i][3]), keterangan: data[i][4]
    });
  }
  return result;
}

function createExpense(body) {
  var sheet = SS.getSheetByName('EXPENSE');
  var id = body.id || String(Date.now());
  // Idempotensi: kunci = id pengeluaran.
  if (body.id && findRowByKey(sheet, 0, id) !== -1) {
    return { success: true, id: id, duplicate: true };
  }
  var tanggal = body.tanggal ? new Date(body.tanggal) : new Date();
  sheet.appendRow([id, tanggal, body.kategori, Number(body.nominal), body.keterangan]);
  log('CREATE_EXPENSE', body.kategori + ' ' + body.nominal);
  return { success: true, id: id };
}

// === CAPITAL ===
function getCapitals() {
  var sheet = SS.getSheetByName('CAPITAL');
  var data = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    result.push({
      id: String(data[i][0]), tanggal: formatDate(data[i][1]),
      jenis: data[i][2], nominal: Number(data[i][3]), keterangan: data[i][4]
    });
  }
  return result;
}

function createCapital(body) {
  var sheet = SS.getSheetByName('CAPITAL');
  var id = body.id || String(Date.now());
  // Idempotensi: kunci = id modal.
  if (body.id && findRowByKey(sheet, 0, id) !== -1) {
    return { success: true, id: id, duplicate: true };
  }
  var tanggal = body.tanggal ? new Date(body.tanggal) : new Date();
  sheet.appendRow([id, tanggal, body.jenis, Number(body.nominal), body.keterangan]);
  log('CREATE_CAPITAL', body.jenis + ' ' + body.nominal);
  return { success: true, id: id };
}

// === SUPPLIER ===
function getSuppliers() {
  var sheet = SS.getSheetByName('SUPPLIER');
  var data = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    result.push({
      id: String(data[i][0]), nama: data[i][1], telepon: data[i][2], alamat: data[i][3]
    });
  }
  return result;
}

function createSupplier(body) {
  var sheet = SS.getSheetByName('SUPPLIER');
  var id = body.id || String(Date.now());
  sheet.appendRow([id, body.nama, body.telepon || '', body.alamat || '']);
  log('CREATE_SUPPLIER', body.nama);
  return { success: true, id: id };
}

function updateSupplier(body) {
  var sheet = SS.getSheetByName('SUPPLIER');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) {
      sheet.getRange(i + 1, 1, 1, 4).setValues([[
        body.id, body.nama || data[i][1], body.telepon || data[i][2], body.alamat || data[i][3]
      ]]);
      return { success: true };
    }
  }
  return { success: false, message: 'Supplier tidak ditemukan' };
}

function deleteSupplier(body) {
  var sheet = SS.getSheetByName('SUPPLIER');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'Supplier tidak ditemukan' };
}

// === DASHBOARD SUMMARY ===
function getSummary() {
  var capital = 0;
  var cSheet = SS.getSheetByName('CAPITAL');
  var cData = cSheet.getDataRange().getValues();
  for (var i = 1; i < cData.length; i++) {
    if (!cData[i][0]) continue;
    if (cData[i][2] === 'tambah') capital += Number(cData[i][3]);
    else capital -= Number(cData[i][3]);
  }

  var stockValue = 0;
  var pSheet = SS.getSheetByName('PRODUCTS');
  var pData = pSheet.getDataRange().getValues();
  for (var i = 1; i < pData.length; i++) {
    if (!pData[i][0]) continue;
    stockValue += Number(pData[i][4]) * Number(pData[i][8]);
  }

  var today = dateStr(new Date());
  var todaySales = 0;
  var sSheet = SS.getSheetByName('SALES');
  var sData = sSheet.getDataRange().getValues();
  var todayInvoices = {};
  for (var i = 1; i < sData.length; i++) {
    if (!sData[i][0]) continue;
    var rowDateStr = dateStr(sData[i][1]);
    if (rowDateStr === today) {
      todaySales += Number(sData[i][6]);
      todayInvoices[sData[i][0]] = true;
    }
  }

  var todayProfit = 0;
  var dSheet = SS.getSheetByName('SALES_DETAIL');
  var dData = dSheet.getDataRange().getValues();
  for (var i = 1; i < dData.length; i++) {
    if (todayInvoices[dData[i][0]]) todayProfit += Number(dData[i][6]);
  }

  return {
    capital: capital,
    stockValue: stockValue,
    todaySales: todaySales,
    todayProfit: todayProfit
  };
}

// === REPORT ===
function getReport(body) {
  var filter = body.filter || 'today';
  var now = new Date();
  var start, end;

  if (filter === 'custom') {
    start = new Date(body.startDate + 'T00:00:00');
    end = new Date(body.endDate + 'T23:59:59');
  } else if (filter === 'today') {
    var todayStr = dateStr(now);
    start = new Date(todayStr + 'T00:00:00');
    end = new Date(todayStr + 'T23:59:59');
  } else if (filter === 'week') {
    var day = now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (filter === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  var omzet = 0, profit = 0, pengeluaran = 0;
  var productCount = {};

  var sSheet = SS.getSheetByName('SALES');
  var sData = sSheet.getDataRange().getValues();
  var validInvoices = {};
  for (var i = 1; i < sData.length; i++) {
    if (!sData[i][0]) continue;
    var rowDate = sData[i][1] instanceof Date ? sData[i][1] : new Date(sData[i][1]);
    if (rowDate >= start && rowDate <= end) {
      omzet += Number(sData[i][6]);
      validInvoices[sData[i][0]] = true;
    }
  }

  var dSheet = SS.getSheetByName('SALES_DETAIL');
  var dData = dSheet.getDataRange().getValues();
  for (var i = 1; i < dData.length; i++) {
    if (validInvoices[dData[i][0]]) {
      profit += Number(dData[i][6]);
      var pName = dData[i][2];
      productCount[pName] = (productCount[pName] || 0) + Number(dData[i][3]);
    }
  }

  var eSheet = SS.getSheetByName('EXPENSE');
  var eData = eSheet.getDataRange().getValues();
  for (var i = 1; i < eData.length; i++) {
    if (!eData[i][0]) continue;
    var eDate = eData[i][1] instanceof Date ? eData[i][1] : new Date(eData[i][1]);
    if (eDate >= start && eDate <= end) pengeluaran += Number(eData[i][3]);
  }

  var cSheet = SS.getSheetByName('CAPITAL');
  var cData = cSheet.getDataRange().getValues();
  var modal = 0;
  for (var i = 1; i < cData.length; i++) {
    if (!cData[i][0]) continue;
    if (cData[i][2] === 'tambah') modal += Number(cData[i][3]);
    else modal -= Number(cData[i][3]);
  }

  var totalStock = 0;
  var pSheet = SS.getSheetByName('PRODUCTS');
  var pData = pSheet.getDataRange().getValues();
  for (var i = 1; i < pData.length; i++) {
    if (!pData[i][0]) continue;
    totalStock += Number(pData[i][4]) * Number(pData[i][8]);
  }

  var terlaris = '-';
  var maxCount = 0;
  for (var name in productCount) {
    if (productCount[name] > maxCount) { maxCount = productCount[name]; terlaris = name; }
  }

  return {
    omzet: omzet, profit: profit, pengeluaran: pengeluaran, modal: modal,
    produkTerlaris: terlaris, stockValue: totalStock
  };
}

// === CHART DATA ===
function getChartData(body) {
  var days = body.days || 7;
  var result = [];
  var now = new Date();
  var sSheet = SS.getSheetByName('SALES');
  var sData = sSheet.getDataRange().getValues();

  for (var d = days - 1; d >= 0; d--) {
    var date = new Date(now);
    date.setDate(now.getDate() - d);
    var dateStr = dateStr(date);
    var total = 0;
    var dayLabel = formatDate(date).slice(0, 3);
    for (var i = 1; i < sData.length; i++) {
      if (!sData[i][0]) continue;
      var rowDateStr = dateStr(sData[i][1]);
      if (rowDateStr === dateStr) total += Number(sData[i][6]);
    }
    result.push({ day: dayLabel, value: total });
  }

  return result;
}

// === UTILS ===

/**
 * Cari baris berdasarkan nilai kolom kunci (0-indexed pada array values).
 * Dipakai untuk idempotensi PURCHASE/STOCK/EXPENSE/CAPITAL: jika kunci
 * sudah ada di sheet (retry sync offline, double-submit), jangan append lagi.
 */
function findRowByKey(sheet, colIndex, key) {
  if (key === undefined || key === null || String(key) === '') return -1;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]) === String(key)) return i;
  }
  return -1;
}

function log(aksi, detail) {
  var sheet = SS.getSheetByName('LOG');
  sheet.appendRow([new Date(), aksi, detail || '']);
}

function formatDate(d) {
  if (!d) return '';
  if (typeof d === 'string') return d;
  if (d instanceof Date) {
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return '';
}

function dateStr(d) {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 10);
  if (d instanceof Date) {
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return '';
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}