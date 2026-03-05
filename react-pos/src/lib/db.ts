import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME    = 'pos-offline-db'
const DB_VERSION = 1

export interface OfflineOrder {
  id          : string        // temporary local ID
  data        : object        // CreateOrderPayload
  createdAt   : string
  synced      : boolean
  syncError?  : string
}

export interface CachedMenu {
  id          : number
  name        : string
  price       : number
  category    : string
  description : string | null
  image_url   : string
  is_available: boolean
  cachedAt    : string
}

export interface OfflineCartItem {
  menu_id  : number
  menu     : CachedMenu
  qty      : number
  note     : string
}

// ─── Open Database ────────────────────────────────────────────
let dbInstance: IDBPDatabase | null = null

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store untuk offline orders (belum sync)
      if (!db.objectStoreNames.contains('offline_orders')) {
        const orderStore = db.createObjectStore('offline_orders', {
          keyPath: 'id',
        })
        orderStore.createIndex('synced',    'synced')
        orderStore.createIndex('createdAt', 'createdAt')
      }

      // Store untuk cache menu
      if (!db.objectStoreNames.contains('menus_cache')) {
        const menuStore = db.createObjectStore('menus_cache', {
          keyPath: 'id',
        })
        menuStore.createIndex('category', 'category')
        menuStore.createIndex('cachedAt', 'cachedAt')
      }

      // Store untuk offline cart (backup IndexedDB)
      if (!db.objectStoreNames.contains('cart_backup')) {
        db.createObjectStore('cart_backup', {
          keyPath: 'menu_id',
        })
      }
    },
  })

  return dbInstance
}

// ─── Offline Orders ───────────────────────────────────────────
export const offlineOrdersDB = {
  async add(orderData: object): Promise<string> {
    const db = await getDB()
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const record: OfflineOrder = {
      id,
      data     : orderData,
      createdAt: new Date().toISOString(),
      synced   : false,
    }
    await db.put('offline_orders', record)
    return id
  },

  async getAll(): Promise<OfflineOrder[]> {
    const db = await getDB()
    return db.getAll('offline_orders')
  },

  async getPending(): Promise<OfflineOrder[]> {
    const db    = await getDB()
    const all   = await db.getAll('offline_orders')
    return all.filter(o => !o.synced)
  },

  async markSynced(id: string): Promise<void> {
    const db    = await getDB()
    const order = await db.get('offline_orders', id)
    if (order) {
      await db.put('offline_orders', { ...order, synced: true })
    }
  },

  async markFailed(id: string, error: string): Promise<void> {
    const db    = await getDB()
    const order = await db.get('offline_orders', id)
    if (order) {
      await db.put('offline_orders', {
        ...order,
        synced   : false,
        syncError: error,
      })
    }
  },

  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('offline_orders', id)
  },

  async clear(): Promise<void> {
    const db = await getDB()
    await db.clear('offline_orders')
  },
}

// ─── Menu Cache ───────────────────────────────────────────────
export const menuCacheDB = {
  async saveAll(menus: CachedMenu[]): Promise<void> {
    const db  = await getDB()
    const tx  = db.transaction('menus_cache', 'readwrite')
    const now = new Date().toISOString()

    await Promise.all([
      ...menus.map(menu =>
        tx.store.put({ ...menu, cachedAt: now })
      ),
      tx.done,
    ])
  },

  async getAll(): Promise<CachedMenu[]> {
    const db = await getDB()
    return db.getAll('menus_cache')
  },

  async getByCategory(category: string): Promise<CachedMenu[]> {
    const db  = await getDB()
    const idx = db
      .transaction('menus_cache')
      .store
      .index('category')
    return idx.getAll(category)
  },

  async getOne(id: number): Promise<CachedMenu | undefined> {
    const db = await getDB()
    return db.get('menus_cache', id)
  },

  async isStale(maxAgeMinutes = 60): Promise<boolean> {
    const db   = await getDB()
    const all  = await db.getAll('menus_cache')
    if (all.length === 0) return true

    const oldest   = all.reduce((a, b) =>
      a.cachedAt < b.cachedAt ? a : b
    )
    const diffMs   = Date.now() - new Date(oldest.cachedAt).getTime()
    return diffMs > maxAgeMinutes * 60 * 1000
  },
}

// ─── Cart Backup ──────────────────────────────────────────────
export const cartBackupDB = {
  async save(items: OfflineCartItem[]): Promise<void> {
    const db = await getDB()
    const tx = db.transaction('cart_backup', 'readwrite')
    await tx.store.clear()
    await Promise.all([
      ...items.map(item => tx.store.put(item)),
      tx.done,
    ])
  },

  async getAll(): Promise<OfflineCartItem[]> {
    const db = await getDB()
    return db.getAll('cart_backup')
  },

  async clear(): Promise<void> {
    const db = await getDB()
    await db.clear('cart_backup')
  },
}