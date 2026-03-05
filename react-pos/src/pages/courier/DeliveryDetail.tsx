/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw, Phone, MapPin } from 'lucide-react'
import { useState } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { apiClient } from '@/api/client'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v)
}

export function Component() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showProofDialog, setShowProofDialog] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofNotes, setProofNotes] = useState('')
  const [uploading, setUploading] = useState(false)

  const { data: delivery, isLoading, refetch } = useQuery({
    queryKey: ['delivery', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/deliveries/${id}`)
      return data.data
    },
  })

  const handleUpdateStatus = async (status: string) => {
    try {
      await apiClient.patch(`/deliveries/${id}`, {
        delivery_status: status,
      })
      toast.success('Status diperbarui')
      queryClient.invalidateQueries({ queryKey: ['delivery', id] })
    } catch (error) {
      toast.error('Gagal memperbarui status')
    }
  }

  const handleUploadProof = async () => {
    if (!proofFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', proofFile)
      await apiClient.post(`/deliveries/${id}/upload-proof`, formData)
      toast.success('Bukti pengiriman berhasil diunggah')
      setShowProofDialog(false)
      setProofFile(null)
      setProofNotes('')
      queryClient.invalidateQueries({ queryKey: ['delivery', id] })
    } catch (error) {
      toast.error('Gagal mengunggah bukti pengiriman')
    }
    setUploading(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!delivery) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Pengiriman tidak ditemukan</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Pengiriman #{delivery.id}</h1>
          <p className="text-muted-foreground text-sm">
            Pesanan {delivery.order?.order_code || 'N/A'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Alamat Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{delivery.address}</p>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Item dalam Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(delivery.order?.items || []).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.menu?.name}</p>
                      <p className="text-sm text-muted-foreground">x{item.qty}</p>
                    </div>
                    <p className="font-semibold">{formatRupiah(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Proof Photo */}
          {delivery.proof_photo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bukti Pengiriman</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={delivery.proof_photo}
                  alt="Bukti pengiriman"
                  className="w-full h-auto rounded-lg"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Nama</p>
                <p className="font-semibold">{delivery.order?.customer?.name || 'Umum'}</p>
              </div>
              {delivery.order?.customer?.phone && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(`tel:${delivery.order.customer.phone}`)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {delivery.order.customer.phone}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Delivery Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Pengiriman</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusBadge status={delivery.delivery_status} type="delivery" />
              <div className="space-y-2">
                {delivery.delivery_status !== 'delivered' && delivery.delivery_status !== 'failed' && (
                  <>
                    {delivery.delivery_status === 'assigned' && (
                      <Button
                        className="w-full"
                        onClick={() => handleUpdateStatus('picked_up')}
                      >
                        Tandai Diambil
                      </Button>
                    )}
                    {delivery.delivery_status === 'picked_up' && (
                      <Button
                        className="w-full"
                        onClick={() => handleUpdateStatus('on_the_way')}
                      >
                        Mulai Pengiriman
                      </Button>
                    )}
                    {delivery.delivery_status === 'on_the_way' && (
                      <>
                        <Button
                          className="w-full"
                          onClick={() => setShowProofDialog(true)}
                        >
                          Kirim Bukti Pengiriman
                        </Button>
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => handleUpdateStatus('failed')}
                        >
                          Pengiriman Gagal
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Total Pesanan</span>
                <span>{formatRupiah(delivery.order?.total_price || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Dibuat</span>
                <span className="text-xs">
                  {formatDistanceToNow(new Date(delivery.created_at), {
                    addSuffix: true,
                    locale: idLocale,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Proof Dialog */}
      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kirim Bukti Pengiriman</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="proof-file">Foto Bukti</Label>
              <input
                id="proof-file"
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <Label htmlFor="proof-notes">Catatan</Label>
              <Textarea
                id="proof-notes"
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
                placeholder="Tambahkan catatan tentang pengiriman (opsional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProofDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleUploadProof}
              disabled={!proofFile || uploading}
            >
              {uploading ? 'Mengunggah...' : 'Kirim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

Component.displayName = 'CourierDeliveryDetailPage'
