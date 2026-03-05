declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess?    : (result: MidtransResult) => void
          onPending?    : (result: MidtransResult) => void
          onError?      : (result: MidtransResult) => void
          onClose?      : () => void
          language?     : string
          uiMode?       : 'deeplink' | 'qr' | 'auto'
        }
      ) => void
      hide: () => void
    }
  }
}

export interface MidtransResult {
  order_id          : string
  payment_type      : string
  transaction_status: string
  transaction_id    : string
  gross_amount      : string
  fraud_status?     : string
  pdf_url?          : string
  finish_redirect_url?: string
}

// ─── Load Snap Script ─────────────────────────────────────────
let snapScriptLoaded = false

export function loadSnapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (snapScriptLoaded && window.snap) {
      resolve()
      return
    }

    // Remove existing script jika ada
    const existing = document.getElementById('midtrans-snap')
    if (existing) existing.remove()

    const script      = document.createElement('script')
    script.id         = 'midtrans-snap'
    script.src        = import.meta.env.VITE_MIDTRANS_SNAP_URL
    script.setAttribute(
      'data-client-key',
      import.meta.env.VITE_MIDTRANS_CLIENT_KEY
    )

    script.onload  = () => {
      snapScriptLoaded = true
      resolve()
    }
    script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap.'))

    document.body.appendChild(script)
  })
}

// ─── Open Snap Popup ──────────────────────────────────────────
export async function openSnapPayment(
  snapToken: string,
  callbacks: {
    onSuccess?: (result: MidtransResult) => void
    onPending?: (result: MidtransResult) => void
    onError?  : (result: MidtransResult) => void
    onClose?  : () => void
  }
): Promise<void> {
  await loadSnapScript()

  window.snap.pay(snapToken, {
    language  : 'id',
    onSuccess : callbacks.onSuccess,
    onPending : callbacks.onPending,
    onError   : callbacks.onError,
    onClose   : callbacks.onClose,
  })
}