import { WifiOff, RefreshCw, ShoppingCart } from 'lucide-react'
import { Button }      from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function OfflinePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-sm text-center space-y-6">

        {/* Icon */}
        <div className="flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Tidak Ada Koneksi</h1>
          <p className="text-muted-foreground">
            Anda sedang offline. Beberapa fitur mungkin tidak tersedia,
            tetapi Anda masih bisa melihat menu dan keranjang belanja.
          </p>
        </div>

        {/* Available offline features */}
        <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
          <p className="text-sm font-medium">Tersedia offline:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Lihat daftar menu
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Tambah item ke keranjang
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Lihat riwayat pesanan
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              Buat pesanan (akan sync saat online)
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Coba Lagi
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/customer/menu')}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Lihat Menu Offline
          </Button>
        </div>
      </div>
    </div>
  )
}