import { forwardRef } from 'react'

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style            : 'currency',
    currency         : 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export interface ReceiptData {
  store          : { name: string; address: string; phone: string; tagline: string }
  receipt_number : string
  date           : string
  cashier        : string
  order_type     : string
  customer       : { name: string; phone: string }
  items          : Array<{
    name: string; qty: number; price: number
    subtotal: number; note?: string
  }>
  subtotal       : number
  discount       : number
  delivery_fee   : number
  total          : number
  payment        : {
    method: string; status: string; paid_amount: number
    cash_received?: number; change?: number
    dp_amount?: number; remaining?: number
  }
  notes?         : string
  footer         : string
  wifi_info?     : string
  copy?          : 'customer' | 'kitchen'
}

interface ThermalReceiptProps {
  data  : ReceiptData
  copy? : 'customer' | 'kitchen'
}

// ─── Thermal Receipt Component ─────────────────────────────────
// Lebar standar thermal printer 58mm = ~32 karakter
// Lebar standar thermal printer 80mm = ~48 karakter

const ThermalReceipt = forwardRef<HTMLDivElement, ThermalReceiptProps>(
  ({ data, copy = 'customer' }, ref) => {
    const isKitchenCopy = copy === 'kitchen'

    return (
      <div
        ref={ref}
        className="font-mono text-[11px] leading-tight bg-white text-black"
        style={{
          width      : '80mm',
          padding    : '4mm',
          fontFamily : "'Courier New', Courier, monospace",
        }}
      >
        {/* ── Store Header ──────────────────────────────────── */}
        <div className="text-center mb-2">
          <p className="text-sm font-bold uppercase">{data.store.name}</p>
          <p className="text-[10px]">{data.store.address}</p>
          <p className="text-[10px]">Tel: {data.store.phone}</p>
        </div>

        <DividerLine />

        {/* ── Copy Label ────────────────────────────────────── */}
        <div className="text-center mb-1">
          <p className="font-bold text-[11px]">
            {isKitchenCopy ? '*** COPY DAPUR ***' : '*** STRUK PELANGGAN ***'}
          </p>
        </div>

        <DividerLine />

        {/* ── Order Info ────────────────────────────────────── */}
        <div className="space-y-0.5 mb-2">
          <Row label="No." value={data.receipt_number} />
          <Row label="Tgl"  value={data.date} />
          <Row label="Kasir" value={data.cashier} />
          <Row label="Tipe" value={data.order_type} />
          <Row label="Nama" value={data.customer.name} />
          {data.customer.phone && (
            <Row label="HP" value={data.customer.phone} />
          )}
        </div>

        <DividerLine />

        {/* ── Items ─────────────────────────────────────────── */}
        <div className="space-y-1 mb-2">
          {data.items.map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between">
                <span className="flex-1 truncate pr-1">
                  {item.name}
                </span>
                {!isKitchenCopy && (
                  <span>{formatRupiah(item.subtotal)}</span>
                )}
              </div>
              <div className="text-[10px] text-gray-600 pl-1">
                {item.qty} x {!isKitchenCopy
                  ? formatRupiah(item.price)
                  : `${item.qty} porsi`
                }
              </div>
              {item.note && (
                <div className="text-[10px] italic pl-1">
                  * {item.note}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Kitchen copy hanya sampai sini */}
        {isKitchenCopy ? (
          <>
            <DividerLine />
            <div className="text-center text-[10px] mt-1">
              {data.notes && <p className="italic">Catatan: {data.notes}</p>}
              <p className="font-bold mt-1">--- Selesai ---</p>
            </div>
          </>
        ) : (
          <>
            <DividerLine />

            {/* ── Totals ─────────────────────────────────────── */}
            <div className="space-y-0.5 mb-2">
              <Row label="Subtotal"    value={formatRupiah(data.subtotal)} />
              {data.discount > 0 && (
                <Row label="Diskon"    value={`-${formatRupiah(data.discount)}`} />
              )}
              {data.delivery_fee > 0 && (
                <Row label="Ongkir"    value={formatRupiah(data.delivery_fee)} />
              )}
              <div className="flex justify-between font-bold text-[12px] border-t border-dashed pt-1 mt-1">
                <span>TOTAL</span>
                <span>{formatRupiah(data.total)}</span>
              </div>
            </div>

            <DividerLine />

            {/* ── Payment ────────────────────────────────────── */}
            <div className="space-y-0.5 mb-2">
              <Row label="Metode" value={data.payment.method} />
              <Row label="Status" value={data.payment.status} />
              {data.payment.cash_received != null &&
               data.payment.cash_received > 0 && (
                <>
                  <Row
                    label="Bayar"
                    value={formatRupiah(data.payment.cash_received)}
                  />
                  <Row
                    label="Kembali"
                    value={formatRupiah(data.payment.change ?? 0)}
                  />
                </>
              )}
              {data.payment.dp_amount != null &&
               data.payment.dp_amount > 0 && (
                <>
                  <Row
                    label="DP"
                    value={formatRupiah(data.payment.dp_amount)}
                  />
                  <Row
                    label="Sisa"
                    value={formatRupiah(data.payment.remaining ?? 0)}
                  />
                </>
              )}
            </div>

            {data.notes && (
              <>
                <DividerLine />
                <p className="text-[10px] italic mb-2">
                  Catatan: {data.notes}
                </p>
              </>
            )}

            <DividerLine />

            {/* ── Footer ─────────────────────────────────────── */}
            <div className="text-center mt-1 space-y-0.5">
              <p className="text-[10px]">{data.footer}</p>
              {data.wifi_info && (
                <p className="text-[10px]">{data.wifi_info}</p>
              )}
              <p className="text-[10px] font-semibold mt-1">
                *** Terima Kasih ***
              </p>
            </div>
          </>
        )}
      </div>
    )
  }
)

ThermalReceipt.displayName = 'ThermalReceipt'
export default ThermalReceipt

// ─── Helper Components ────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-1">
      <span className="text-gray-600 shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

function DividerLine() {
  return (
    <div className="border-t border-dashed border-gray-400 my-1.5" />
  )
}