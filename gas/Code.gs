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
 * CHANGES (Role-based access):
 * - 3 role: owner, admin, kasir
 * - Default users: owner/owner123, admin/admin123, kasir/kasir123
 * - Pembatasan menu ada di frontend (src/config/permissions.ts)
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();

var SHEETS = {
  USERS:        ['id', 'username', 'password', 'nama', 'role'],
  PRODUCTS:     ['id', 'barcode', 'nama', 'kategori', 'modal', 'ecer', 'grosir', 'min_grosir', 'stock', 'expired'],
  STOCK:        ['id', 'tanggal', 'barcode', 'jenis', 'qty', 'keterangan'],
  PURCHASE:     ['no', 'supplier', 'tanggal', 'barcode', 'qty', 'modal'],
  SALES:        ['invoice', 'tanggal', 'kasir', 'subtotal', 'diskon', 'total', 'bayar', 'kembali', 'metode'],
  SALES_DETAIL: ['invoice', 'barcode', 'produk', 'qty', 'harga', 'modal', 'profit'],
  EXPENSE:      ['id', 'tanggal', 'kategori', 'nominal', 'keterangan'],
  CAPITAL:      ['id', 'tanggal', 'jenis', 'nominal', 'keterangan'],
  SUPPLIER:     ['id', 'nama', 'telepon', 'alamat'],
  CUSTOMER:     ['id', 'nama', 'telepon', 'poin'],
  LOG:          ['timestamp', 'aksi', 'detail']
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

// === LOGIN ===
function login(p, body) {
  var username = body.username || p.username;
  var password = body.password || p.password;
  var sheet = SS.getSheetByName('USERS');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === username && data[i][2] === password) {
      return {
        success: true,
        user: { id: String(data[i][0]), username: data[i][1], nama: data[i][3], role: data[i][4] }
      };
    }
  }
  return { success: false, message: 'Username atau password salah' };
}

// === PRODUCTS ===
function getProducts(body) {
  var sheet = SS.getSheetByName('PRODUCTS');
  var data = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    result.push({
      id: String(data[i][0]),
      barcode: String(data[i][1]),
      nama: data[i][2],
      kategori: data[i][3],
      modal: Number(data[i][4]),
      ecer: Number(data[i][5]),
      grosir: Number(data[i][6]),
      minGrosir: Number(data[i][7]),
      stock: Number(data[i][8]),
      expired: formatDate(data[i][9])
    });
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
  var data = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    result.push({
      id: String(data[i][0]), tanggal: formatDate(data[i][1]),
      barcode: String(data[i][2]), jenis: data[i][3], qty: Number(data[i][4]), keterangan: data[i][5]
    });
  }
  return result;
}

function stockIn(body) {
  var sheet = SS.getSheetByName('STOCK');
  var tanggal = body.tanggal ? new Date(body.tanggal) : new Date();
  sheet.appendRow([String(Date.now()), tanggal, body.barcode, 'in', Number(body.qty), body.keterangan || '']);

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
  sheet.appendRow([String(Date.now()), tanggal, body.barcode, 'out', Number(body.qty), body.keterangan || '']);

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
  var tanggal = body.tanggal ? new Date(body.tanggal) : new Date();
  sheet.appendRow([no, body.supplier, tanggal, body.barcode, Number(body.qty), Number(body.modal)]);
  log('CREATE_PURCHASE', body.supplier + ' - ' + body.barcode);
  return { success: true, no: no };
}

function getPurchases(body) {
  var sheet = SS.getSheetByName('PURCHASE');
  var data = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    result.push({
      no: String(data[i][0]), supplier: data[i][1], tanggal: formatDate(data[i][2]),
      barcode: String(data[i][3]), qty: Number(data[i][4]), modal: Number(data[i][5])
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