const DB_NAME = 'BiosFrozenFood';
const DB_VERSION = 1;

export const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('pendingSales'))
        db.createObjectStore('pendingSales', { keyPath: 'invoice' });
      if (!db.objectStoreNames.contains('products'))
        db.createObjectStore('products', { keyPath: 'barcode' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

export const savePendingSale = async (sale: unknown) => {
  const db = await openDB();
  const tx = db.transaction('pendingSales', 'readwrite');
  tx.objectStore('pendingSales').put(sale);
  return new Promise<void>((res, rej) => {
    tx.oncomplete = () => {
      db.close();
      res();
    };
    tx.onerror = () => {
      db.close();
      rej(tx.error);
    };
  });
};

export const getPendingSales = async (): Promise<unknown[]> => {
  const db = await openDB();
  const tx = db.transaction('pendingSales', 'readonly');
  return new Promise((res, rej) => {
    const req = tx.objectStore('pendingSales').getAll();
    req.onsuccess = () => {
      db.close();
      res(req.result);
    };
    req.onerror = () => {
      db.close();
      rej(req.error);
    };
  });
};

export const deletePendingSale = async (invoice: string) => {
  const db = await openDB();
  const tx = db.transaction('pendingSales', 'readwrite');
  tx.objectStore('pendingSales').delete(invoice);
  return new Promise<void>((res, rej) => {
    tx.oncomplete = () => {
      db.close();
      res();
    };
    tx.onerror = () => {
      db.close();
      rej(tx.error);
    };
  });
};