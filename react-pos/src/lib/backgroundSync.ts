/* eslint-disable @typescript-eslint/no-explicit-any */
import { offlineOrdersDB }   from './db'
import { apiClient }         from '@/api/client'
import { useAuthStore }      from '@/stores/authStore'

export const SYNC_TAG = 'sync-offline-orders'

// ─── Register Background Sync ─────────────────────────────────
export async function registerBackgroundSync(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.warn('[BGSync] Background Sync tidak didukung browser ini')
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    await (registration as any).sync.register(SYNC_TAG)
    console.log('[BGSync] Background sync registered:', SYNC_TAG)
  } catch (err) {
    console.error('[BGSync] Failed to register:', err)
  }
}

// ─── Sync Pending Orders (dipanggil saat online) ──────────────
export async function syncPendingOrders(): Promise<{
  success: number
  failed : number
}> {
  const pending = await offlineOrdersDB.getPending()

  if (pending.length === 0) {
    return { success: 0, failed: 0 }
  }

  console.log(`[BGSync] Syncing ${pending.length} pending orders...`)

  let success = 0
  let failed  = 0

  const token = useAuthStore.getState().token

  for (const order of pending) {
    try {
      // Tentukan endpoint berdasarkan source
      const endpoint = '/cashier/orders'

      await apiClient.post(endpoint, order.data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      await offlineOrdersDB.markSynced(order.id)
      success++
      console.log(`[BGSync] Order ${order.id} synced`)
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? 'Unknown error'
      await offlineOrdersDB.markFailed(order.id, message)
      failed++
      console.error(`[BGSync] Order ${order.id} failed:`, message)
    }
  }

  return { success, failed }
}

// ─── Listen for online event ──────────────────────────────────
export function setupOnlineSyncListener(
  onSyncComplete?: (result: { success: number; failed: number }) => void
): () => void {
  const handler = async () => {
    console.log('[BGSync] Online detected, syncing...')
    const result = await syncPendingOrders()

    if (result.success > 0 || result.failed > 0) {
      onSyncComplete?.(result)
    }
  }

  window.addEventListener('online', handler)
  return () => window.removeEventListener('online', handler)
}