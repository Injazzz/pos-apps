/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Settings, LogOut, Mail, Phone, MapPin} from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { apiClient } from '@/api/client'
import { useLogout } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { User } from '@/types'

export function Component() {
  const logout = useLogout()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })

  const { data: profile, isLoading } = useQuery<User>({
    queryKey: ['customer-profile'],
    queryFn: async () => {
      const { data } = await apiClient.get('/customer/profile')
      return data.data
    },
  })

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        password: '',
      })
    }
  }, [profile])

  const { data: stats } = useQuery<{
    total_orders: number
    completed_orders: number
    total_spent: number
  }>({
    queryKey: ['customer-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/customer/stats')
      return data.data
    },
  })

  const { data: addresses } = useQuery<any[]>({
    queryKey: ['customer-addresses'],
    queryFn: async () => {
      const { data } = await apiClient.get('/customer/addresses')
      return data.data ?? []
    },
  })

  const handleUpdateProfile = async () => {
    try {
      await apiClient.put('/customer/profile', {
        name: formData.name,
        phone: formData.phone,
        ...(formData.password && { password: formData.password }),
      })
      toast.success('Profil diperbarui')
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] })
    } catch {
      toast.error('Gagal memperbarui profil')
    }
  }

  const handleLogout = () => {
    logout.mutate()
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback>{profile?.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{profile?.name}</h1>
                <p className="text-muted-foreground">{profile?.email}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Member sejak {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID') : '-'}
                </p>
              </div>
            </div>
            <Button
              variant="outline" size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {isEditing ? 'Batal' : 'Edit'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{stats.total_orders ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Pesanan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency', currency: 'IDR',
                  maximumFractionDigits: 0,
                }).format(stats.total_spent ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total Belanja</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{stats.completed_orders ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Selesai</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Profile Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="mt-1 bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Ubah Password (opsional)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password baru"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateProfile} className="flex-1">
                Simpan Perubahan
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Alamat Pengiriman
          </CardTitle>
          <CardDescription>Kelola alamat pengiriman Anda</CardDescription>
        </CardHeader>
        <CardContent>
          {!addresses || addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada alamat tersimpan</p>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr: any) => (
                <div key={addr.id} className="p-3 border rounded-lg">
                  <p className="font-semibold text-sm">{addr.address}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {addr.city}, {addr.province} {addr.postal_code}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Kontak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-semibold">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Nomor Telepon</p>
              <p className="text-sm font-semibold">{profile?.phone || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Keluar
      </Button>
    </div>
  )
}

Component.displayName = 'CustomerProfilePage'
