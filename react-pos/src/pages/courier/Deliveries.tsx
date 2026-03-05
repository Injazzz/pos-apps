/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState }      from 'react'
import { useNavigate }   from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MapPin, Phone, Camera,
  Package, Truck, CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button }        from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea }      from '@/components/ui/textarea'
import { Label }         from '@/components/ui/label'
import { StatusBadge }   from '@/components/shared/StatusBadge'
import { apiClient }     from '@/api/client'
import { toast }         from 'sonner'

const DELIVERY_TABS = [
  { value: '',          label: 'Semua' },
  { value: 'assigned',  label: 'Ditugaskan' },
  { value: 'picked_up', label: 'Diambil' },
  { value: 'on_the_way',label: 'Dikirim' },
  { value: 'delivered', label: 'Selesai' },
]

export function Component() {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const [tab, setTab]= useState('assigned')
  const [proofModal, setProofModal]   = useState<any>(null)
  const [proofFile, setProofFile]     = useState<File | null>(null)
  const [proofNotes, setProofNotes]   = useState('')
  const [uploading, setUploading]     = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['courier-deliveries', tab],
    queryFn : async () => {
      const { data } = await apiClient.get('/courier/deliveries', {
        params: { delivery_status: tab || undefined, per_page: 20 },
      })
      return data.data.data
    },
    refetchInterval: 30_000,
  })

  const updateStatus = async (deliveryId: number, status: string) => {
    try {
      await apiClient.patch(`/courier/deliveries/${deliveryId}/status`, {
        delivery_status: status,
      })
      toast.success('Status pengiriman diperbarui')
      queryClient.invalidateQueries({ queryKey: ['courier-deliveries'] })
    } catch {
      toast.error('Gagal memperbarui status')
    }
  }

  const uploadProof = async () => {
    if (!proofFile || !proofModal) return
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('proof_photo', proofFile)
      if (proofNotes) formData.append('notes', proofNotes)

      await apiClient.post(
        `/courier/deliveries/${proofModal.id}/proof`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      toast.success('Bukti pengiriman berhasil diupload!')
      setProofModal(null)
      setProofFile(null)
      setProofNotes('')
      queryClient.invalidateQueries({ queryKey: ['courier-deliveries'] })
    } catch {
      toast.error('Gagal upload bukti pengiriman')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Pengiriman Saya</h1>
        <p className="text-sm text-muted-foreground">
          Kelola pengiriman yang ditugaskan kepada Anda
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full overflow-x-auto justify-start">
          {DELIVERY_TABS.map(t => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (data ?? []).length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Tidak ada pengiriman</p>
            </div>
          ) : (
            (data ?? []).map((delivery: any) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onUpdateStatus={updateStatus}
                onUploadProof={() => setProofModal(delivery)}
                onClick={() => navigate(`/courier/deliveries/${delivery.id}`)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Proof Modal */}
      <Dialog
        open={!!proofModal}
        onOpenChange={() => setProofModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Bukti Pengiriman</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Foto Bukti</Label>
              <div
                className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50"
                onClick={() => document.getElementById('proof-input')?.click()}
              >
                {proofFile ? (
                  <div>
                    <img
                      src={URL.createObjectURL(proofFile)}
                      alt="Preview"
                      className="max-h-40 mx-auto rounded-lg object-cover"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {proofFile.name}
                    </p>
                  </div>
                ) : (
                  <>
                    <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Klik untuk ambil/pilih foto
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG max 5MB
                    </p>
                  </>
                )}
                <input
                  id="proof-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => setProofFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <div>
              <Label>Catatan (opsional)</Label>
              <Textarea
                placeholder="cth: Diserahkan ke satpam, dll"
                value={proofNotes}
                onChange={e => setProofNotes(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProofModal(null)}>
              Batal
            </Button>
            <Button
              onClick={uploadProof}
              disabled={!proofFile || uploading}
            >
              {uploading ? 'Mengupload...' : 'Upload Bukti'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Delivery Card ────────────────────────────────────────────
function DeliveryCard({
  delivery, onUpdateStatus, onUploadProof, onClick,
}: {
  delivery       : any
  onUpdateStatus : (id: number, status: string) => void
  onUploadProof  : () => void
  onClick        : () => void
}) {
  const status = delivery.delivery_status

  const nextAction: Record<string, { label: string; status: string; icon: any }> = {
    assigned  : { label: 'Ambil Pesanan',   status: 'picked_up',  icon: Package },
    picked_up : { label: 'Mulai Antar',     status: 'on_the_way', icon: Truck },
    on_the_way: { label: 'Konfirmasi Tiba', status: 'delivered',  icon: CheckCircle2 },
  }

  const action = nextAction[status]

  return (
    <Card className="cursor-pointer hover:shadow-md transition-all">
      <CardHeader
        className="pb-2"
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {delivery.order?.order_code}
            </p>
            <p className="font-semibold text-sm mt-0.5">
              {delivery.recipient_name ?? delivery.order?.customer_name ?? 'Pelanggan'}
            </p>
          </div>
          <StatusBadge status={status} type="delivery" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Address */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <span className="text-muted-foreground line-clamp-2">
            {delivery.address}
          </span>
        </div>

        {/* Phone */}
        {delivery.recipient_phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <a
              href={`tel:${delivery.recipient_phone}`}
              className="text-primary"
              onClick={e => e.stopPropagation()}
            >
              {delivery.recipient_phone}
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {action && (
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={e => {
                e.stopPropagation()
                if (action.status === 'delivered') {
                  onUploadProof()
                } else {
                  onUpdateStatus(delivery.id, action.status)
                }
              }}
            >
              <action.icon className="h-3.5 w-3.5 mr-1.5" />
              {action.label}
            </Button>
          )}
          {status === 'on_the_way' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={e => { e.stopPropagation(); onUploadProof() }}
            >
              <Camera className="h-3.5 w-3.5 mr-1" />
              Foto
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}