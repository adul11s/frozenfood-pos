export interface User {
  id: string;
  username: string;
  nama: string;
  role: 'admin' | 'kasir';
}

export interface Product {
  id: string;
  barcode: string;
  nama: string;
  kategori: string;
  modal: number;
  ecer: number;
  grosir: number;
  minGrosir: number;
  stock: number;
  expired: string;
}

export interface Sale {
  invoice: string;
  tanggal: string;
  kasir: string;
  subtotal: number;
  diskon: number;
  total: number;
  bayar: number;
  kembali: number;
  metode: 'cash' | 'qris' | 'transfer';
}

export interface SaleDetail {
  invoice: string;
  barcode: string;
  produk: string;
  qty: number;
  harga: number;
  modal: number;
  profit: number;
}

export interface Purchase {
  no: string;
  supplier: string;
  tanggal: string;
  barcode: string;
  qty: number;
  modal: number;
}

export interface Expense {
  id: string;
  tanggal: string;
  kategori: string;
  nominal: number;
  keterangan: string;
}

export interface Capital {
  id: string;
  tanggal: string;
  jenis: 'tambah' | 'kurang';
  nominal: number;
  keterangan: string;
}

export interface Supplier {
  id: string;
  nama: string;
  telepon: string;
  alamat: string;
}

export interface Customer {
  id: string;
  nama: string;
  telepon: string;
  poin: number;
}

export interface DashboardSummary {
  capital: number;
  stockValue: number;
  todaySales: number;
  todayProfit: number;
}

export interface CartItem extends Product {
  qty: number;
  subtotal: number;
  harga: number;
  modal: number;
}

export interface ReportData {
  omzet: number;
  profit: number;
  pengeluaran: number;
  modal: number;
  produkTerlaris: string;
  stockValue: number;
}

export interface ChartDataPoint {
  day: string;
  value: number;
}