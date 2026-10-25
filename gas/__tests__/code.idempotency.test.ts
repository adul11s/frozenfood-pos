/**
 * Test idempotensi layer GAS (gas/Code.gs).
 *
 * Apps Script tidak bisa di-require langsung: file dimuat ke Node via
 * node:vm dengan mock globals (SpreadsheetApp, dsb) yang meniru perilaku
 * Sheet asli (dataRange/appendRow/getRange().setValue(s)). Semua pemeriksaan
 * idempotensi (duplikat tidak boleh append dua kali, client-side mutation
 * tidak boleh diterapkan dua kali) diuji di sini.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

// === Mock Google Sheets ===

type Row = unknown[];

type MockRange = {
  getValues: () => Row[];
  setValues: (vals: Row[]) => void;
  setValue: (v: unknown) => void;
};

class MockSheet {
  name: string;
  rows: Row[] = [];

  constructor(name: string, headers?: string[]) {
    this.name = name;
    if (headers) this.rows.push(headers.slice());
  }

  getLastRow(): number {
    return this.rows.length;
  }

  getDataRange(): { getValues: () => Row[] } {
    const snapshot = this.rows.map((r) => r.slice());
    return { getValues: () => snapshot };
  }

  getRange(row: number, col: number): MockRange {
    const r0 = row - 1;
    const rows = () => this.rows;
    return {
      getValues: () => rows().slice(r0, r0 + 1).map((r) => r.slice()),
      setValues: (vals: Row[]) => {
        for (let i = 0; i < vals.length; i++) {
          rows()[r0 + i] = vals[i].slice();
        }
      },
      // setValue dipakai untuk sel tunggal, contoh qty stok: getRange(row, 9).setValue(...)
      setValue: (v: unknown) => {
        rows()[r0][col - 1] = v;
      },
    };
  }

  appendRow(row: Row) {
    this.rows.push(row.slice());
  }

  deleteRow(index: number) {
    this.rows.splice(index - 1, 1);
  }

  setFrozenRows() {}
  setFontWeight() {}
}

const SHEET_HEADERS: Record<string, string[]> = {
  PRODUCTS: ['id', 'barcode', 'nama', 'kategori', 'modal', 'ecer', 'grosir', 'min_grosir', 'stock', 'expired'],
  STOCK: ['id', 'tanggal', 'barcode', 'jenis', 'qty', 'keterangan'],
  PURCHASE: ['no', 'supplier', 'tanggal', 'barcode', 'qty', 'modal', 'total_modal'],
  SALES: ['invoice', 'tanggal', 'kasir', 'subtotal', 'diskon', 'total', 'bayar', 'kembali', 'metode'],
  SALES_DETAIL: ['invoice', 'barcode', 'produk', 'qty', 'harga', 'modal', 'profit'],
  EXPENSE: ['id', 'tanggal', 'kategori', 'nominal', 'keterangan'],
  CAPITAL: ['id', 'tanggal', 'jenis', 'nominal', 'keterangan'],
  LOG: ['timestamp', 'aksi', 'detail'],
};

let sheets: Record<string, MockSheet>;

function makeGlobalContext(): vm.Context {
  sheets = {};
  for (const [name, headers] of Object.entries(SHEET_HEADERS)) {
    sheets[name] = new MockSheet(name, headers);
  }

  const spreadsheet = {
    getSheetByName: (name: string) => sheets[name] ?? undefined,
    insertSheet: (name: string) => {
      sheets[name] = new MockSheet(name);
      return sheets[name];
    },
  };

  const mockSpreadsheetApp = { getActiveSpreadsheet: () => spreadsheet };
  const sandbox: vm.Context = {
    SpreadsheetApp: mockSpreadsheetApp,
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => undefined, setProperty: () => undefined }) },
    Utilities: {
      getUuid: () => 'mock-uuid',
      formatDate: (d: Date, _tz: string, fmt: string) => (fmt === 'yyyy-MM-dd' ? d.toISOString().slice(0, 10) : d.toISOString()),
    },
    Session: { getScriptTimeZone: () => 'Asia/Jakarta' },
    Logger: { log: () => undefined },
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: () => ({ setMimeType: () => undefined }) },
  };
  return vm.createContext(sandbox);
}

function loadCode(context: vm.Context): Record<string, (body: Record<string, unknown>) => unknown> {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'Code.gs'),
    'utf8',
  );
  vm.runInContext(source, context, { filename: 'Code.gs' });
  const names = ['createPurchase', 'stockIn', 'stockOut', 'createExpense', 'createCapital'];
  const fns: Record<string, (body: Record<string, unknown>) => unknown> = {};
  for (const name of names) {
    const fn = (context as unknown as Record<string, unknown>)[name];
    if (typeof fn !== 'function') throw new Error(`Function ${name} tidak ditemukan di Code.gs`);
    fns[name] = fn as (body: Record<string, unknown>) => unknown;
  }
  return fns;
}

let fns: ReturnType<typeof loadCode>;

beforeEach(() => {
  // Muat ulang module Code.gs + sheet kosong setiap test.
  const context = makeGlobalContext();
  fns = loadCode(context);
  // Seed satu produk untuk increment/decrement stok.
  sheets.PRODUCTS.appendRow(['p1', 'BRG1', 'Sosis', '-', 8000, 1000, 9000, 10, 5, '-']);
});

describe('Idempotensi GAS sheet (PURCHASE/STOCK/EXPENSE/CAPITAL)', () => {
  it('createPurchase retry dengan `no` sama → duplicate:true, sheet tidak bertambah; payload beda → baris baru', () => {
    const body = { no: 'PUR-100', supplier: 'S1', barcode: 'BRG1', qty: 2, modal: 8000 };
    const first = fns.createPurchase(body) as { success: boolean; duplicate?: boolean };
    expect(first).toMatchObject({ success: true, no: 'PUR-100' });
    const firstRows = sheets.PURCHASE.rows.length;

    const retry = fns.createPurchase(body) as { duplicate?: boolean };
    expect(retry.duplicate).toBe(true);
    expect(sheets.PURCHASE.rows.length).toBe(firstRows); // tidak append lagi

    // Kunci beda → baris baru.
    fns.createPurchase({ ...body, no: 'PUR-101' });
    expect(sheets.PURCHASE.rows.length).toBe(firstRows + 1);
  });

  it('stockIn retry dengan id sama → duplicate:true, qty stok produk tidak di-inc dua kali', () => {
    const body = { id: 'ST-1', barcode: 'BRG1', qty: 3, tanggal: '2026-10-25' };
    const first = fns.stockIn(body) as { success: boolean };
    expect(first.success).toBe(true);
    expect(sheets.PRODUCTS.rows[1][8]).toBe(8); // 5 + 3

    const retry = fns.stockIn(body) as { duplicate?: boolean };
    expect(retry.duplicate).toBe(true);
    expect(sheets.STOCK.rows.length).toBe(2); // header + 1 baris
    expect(sheets.PRODUCTS.rows[1][8]).toBe(8); // tidak 11
  });

  it('stockOut retry dengan id sama → duplicate:true, stok tidak dikurangi dua kali', () => {
    const body = { id: 'ST-OUT-1', barcode: 'BRG1', qty: 2 };
    expect(fns.stockOut(body)).toMatchObject({ success: true });
    expect(sheets.PRODUCTS.rows[1][8]).toBe(3); // 5 - 2

    const retry = fns.stockOut(body) as { duplicate?: boolean };
    expect(retry.duplicate).toBe(true);
    expect(sheets.PRODUCTS.rows[1][8]).toBe(3);
  });

  it('createExpense retry dengan id sama → duplicate:true, sheet tidak bertambah', () => {
    const body = { id: 'EXP-1', tanggal: '2026-10-25', kategori: 'Bensin', nominal: 50000 };
    expect(fns.createExpense(body)).toMatchObject({ success: true, id: 'EXP-1' });
    const rows = sheets.EXPENSE.rows.length;
    expect(fns.createExpense(body)).toMatchObject({ duplicate: true });
    expect(sheets.EXPENSE.rows.length).toBe(rows);
  });

  it('createCapital retry dengan id sama → duplicate:true, sheet tidak bertambah', () => {
    const body = { id: 'CAP-1', tanggal: '2026-10-25', jenis: 'tambah', nominal: 1000000 };
    expect(fns.createCapital(body)).toMatchObject({ success: true, id: 'CAP-1' });
    const rows = sheets.CAPITAL.rows.length;
    expect(fns.createCapital(body)).toMatchObject({ duplicate: true });
    expect(sheets.CAPITAL.rows.length).toBe(rows);
  });
});

describe('Skenario offline → online: mutation mid-sync failure + recovery', () => {
  /**
   * Simulasi antrean offline: PUR-1 & EXP-1 dibuat saat offline lalu disinkron
   * saat online. Sync attempt #1: PURCHASE appendRow sukses, lalu append EXPENSE
   * GAGAL di tengah (network drop). Sync attempt #2 (recovery): dengan kunci
   * sama, PURCHASE dikembalikan sebagai duplicate (tidak append, stok tidak
   * di-inc ulang) dan EXPENSE berhasil append tepat satu kali. Saldo akhir
   * konsisten: satu purchase, satu expense regardless of mid-sync crash.
   */
  it('mid-sync failure + recovery → tiap mutation dilakukan tepat satu kali', () => {
    // Attempt #1
    expect(fns.createPurchase({ no: 'PUR-1', supplier: 'S1', barcode: 'BRG1', qty: 2, modal: 8000 })).toMatchObject({ success: true });
    expect(fns.stockIn({ id: 'ST-1', barcode: 'BRG1', qty: 2, tanggal: '2026-10-25' })).toMatchObject({ success: true });
    expect(sheets.PRODUCTS.rows[1][8]).toBe(7);

    // Mid-sync failure: attempt mengirim EXPENSE gagal karena network drop —
    // GAS tidak pernah menerima request ini (tidak ada baris ditulis).
    let expenseError: unknown;
    try {
      // Inilah titik gagal: network drop sebelum append EXPENSE diproses.
      const willFail = true;
      if (willFail) throw new Error('network drop');
      void fns.createExpense({ id: 'EXP-1', tanggal: '2026-10-25' });
    } catch (err) {
      expenseError = err;
    }
    expect(expenseError).toBeInstanceOf(Error);
    expect(sheets.EXPENSE.rows.length).toBe(1); // masih hanya header

    // Attempt #2 - recovery, kunci sama untuk semua
    const retryPurchase = fns.createPurchase({ no: 'PUR-1', supplier: 'S1', barcode: 'BRG1', qty: 2, modal: 8000 }) as { duplicate?: boolean };
    const retryStock = fns.stockIn({ id: 'ST-1', barcode: 'BRG1', qty: 2, tanggal: '2026-10-25' }) as { duplicate?: boolean };
    expect(retryPurchase.duplicate).toBe(true);
    expect(retryStock.duplicate).toBe(true);
    expect(sheets.PURCHASE.rows.length).toBe(2); // header + tepat 1 baris
    expect(sheets.PRODUCTS.rows[1][8]).toBe(7); // stok tidak naik dua kali

    // Expense yang gagal tadi sekarang sukses, kunci baru diperkenalan.
    expect(fns.createExpense({ id: 'EXP-1', tanggal: '2026-10-25', kategori: 'Bensin', nominal: 50000 })).toMatchObject({ success: true });
    // Dan retry-nya tetap terminal (idempotent).
    expect(fns.createExpense({ id: 'EXP-1', tanggal: '2026-10-25', kategori: 'Bensin', nominal: 50000 })).toMatchObject({ duplicate: true });
    expect(sheets.EXPENSE.rows.length).toBe(2); // header + tepat 1 baris
  });
});
