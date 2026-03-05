import { useCallback }   from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast }                 from 'sonner'
import { apiClient }             from '@/api/client'
import type { ReceiptData }      from '@/components/features/receipt/ThermalReceipt'

export function useReceiptData(orderId: number) {
  return useQuery({
    queryKey: ['receipt', orderId],
    queryFn : async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ReceiptData }>(
        `/cashier/orders/${orderId}/receipt`
      )
      return data.data
    },
    enabled: !!orderId,
    staleTime: Infinity, // receipt data tidak perlu refetch
  })
}

// ─── Print 2 copies ──────────────────────────────────────────
export function usePrintReceipt() {
  return useCallback((receiptData: ReceiptData) => {
    const printWindow = window.open('', '_blank', 'width=320,height=600')
    if (!printWindow) {
      toast.error('Popup diblokir. Izinkan popup untuk print struk.')
      return
    }

    const customerHtml = buildReceiptHtml(receiptData, 'customer')
    const kitchenHtml  = buildReceiptHtml(receiptData, 'kitchen')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Struk ${receiptData.receipt_number}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.3;
          }
          .receipt {
            width: 80mm;
            padding: 4mm;
          }
          .page-break {
            page-break-after: always;
          }
          .center { text-align: center; }
          .right  { text-align: right; }
          .bold   { font-weight: bold; }
          .small  { font-size: 10px; }
          .divider {
            border-top: 1px dashed #666;
            margin: 4px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
          }
          .italic { font-style: italic; }
        </style>
      </head>
      <body>
        <div class="receipt page-break">
          ${customerHtml}
        </div>
        <div class="receipt">
          ${kitchenHtml}
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)

    toast.success('Struk dikirim ke printer (2 lembar)')
  }, [])
}

// ─── Build HTML string untuk print ───────────────────────────
function buildReceiptHtml(data: ReceiptData, copy: 'customer' | 'kitchen'): string {
  const isKitchen = copy === 'kitchen'
  const fmtRp = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(v)

  const itemsHtml = data.items.map(item => `
    <div>
      <div class="row">
        <span>${item.name}</span>
        ${!isKitchen ? `<span>${fmtRp(item.subtotal)}</span>` : ''}
      </div>
      <div class="small" style="padding-left:8px">
        ${item.qty} x ${!isKitchen ? fmtRp(item.price) : `${item.qty} porsi`}
      </div>
      ${item.note ? `<div class="small italic" style="padding-left:8px">* ${item.note}</div>` : ''}
    </div>
  `).join('')

  return `
    <div class="center bold">${data.store.name}</div>
    <div class="center small">${data.store.address}</div>
    <div class="center small">Tel: ${data.store.phone}</div>
    <div class="divider"></div>
    <div class="center bold">${isKitchen ? '*** COPY DAPUR ***' : '*** STRUK PELANGGAN ***'}</div>
    <div class="divider"></div>

    <div class="row"><span>No.</span><span>${data.receipt_number}</span></div>
    <div class="row"><span>Tgl</span><span>${data.date}</span></div>
    <div class="row"><span>Kasir</span><span>${data.cashier}</span></div>
    <div class="row"><span>Tipe</span><span>${data.order_type}</span></div>
    <div class="row"><span>Nama</span><span>${data.customer.name}</span></div>

    <div class="divider"></div>

    ${itemsHtml}

    ${isKitchen ? `
      <div class="divider"></div>
      ${data.notes ? `<div class="italic small">Catatan: ${data.notes}</div>` : ''}
      <div class="center bold">--- Selesai ---</div>
    ` : `
      <div class="divider"></div>
      <div class="row"><span>Subtotal</span><span>${fmtRp(data.subtotal)}</span></div>
      ${data.discount > 0 ? `<div class="row"><span>Diskon</span><span>-${fmtRp(data.discount)}</span></div>` : ''}
      ${data.delivery_fee > 0 ? `<div class="row"><span>Ongkir</span><span>${fmtRp(data.delivery_fee)}</span></div>` : ''}
      <div class="divider"></div>
      <div class="row bold" style="font-size:12px"><span>TOTAL</span><span>${fmtRp(data.total)}</span></div>
      <div class="divider"></div>
      <div class="row"><span>Metode</span><span>${data.payment.method}</span></div>
      ${data.payment.cash_received ? `
        <div class="row"><span>Bayar</span><span>${fmtRp(data.payment.cash_received)}</span></div>
        <div class="row"><span>Kembali</span><span>${fmtRp(data.payment.change ?? 0)}</span></div>
      ` : ''}
      ${data.payment.dp_amount ? `
        <div class="row"><span>DP</span><span>${fmtRp(data.payment.dp_amount)}</span></div>
        <div class="row"><span>Sisa</span><span>${fmtRp(data.payment.remaining ?? 0)}</span></div>
      ` : ''}
      <div class="divider"></div>
      <div class="center small">${data.footer}</div>
      ${data.wifi_info ? `<div class="center small">${data.wifi_info}</div>` : ''}
      <div class="center bold">*** Terima Kasih ***</div>
    `}
  `
}