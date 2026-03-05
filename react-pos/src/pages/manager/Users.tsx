/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Plus, MoreHorizontal, Trash2, Edit2, RefreshCw } from 'lucide-react'
import {
  Card, CardContent, CardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiClient } from '@/api/client'
import { toast } from 'sonner'

const roleColors: Record<string, string> = {
  manager: 'bg-purple-100 text-purple-800',
  kasir: 'bg-blue-100 text-blue-800',
  kurir: 'bg-orange-100 text-orange-800',
}

// Tipe untuk form data
type FormData = {
  name: string
  email: string
  phone: string
  password: string
  role: string
}

// Tipe untuk user
type User = {
  id: number
  name: string
  email: string
  phone: string
  role: string
  status: string
}

export function Component() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'kasir',
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['manager', 'users', search],
    queryFn: async () => {
      const { data } = await apiClient.get('/manager/users', {
        params: { search, per_page: 50 },
      })
      return data
    },
  })

  const createUserMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      const { data } = await apiClient.post('/manager/users', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Pengguna berhasil ditambahkan')
      resetForm()
      setIsModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['manager', 'users'] })
    },
    onError: (error: any) => {
      handleApiError(error, 'Gagal menambah pengguna')
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<FormData> }) => {
      const { data } = await apiClient.put(`/manager/users/${id}`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Pengguna berhasil diperbarui')
      resetForm()
      setIsModalOpen(false)
      setIsEditMode(false)
      setSelectedUser(null)
      queryClient.invalidateQueries({ queryKey: ['manager', 'users'] })
    },
    onError: (error: any) => {
      handleApiError(error, 'Gagal memperbarui pengguna')
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await apiClient.delete(`/manager/users/${userId}`)
      return data
    },
    onSuccess: () => {
      toast.success('Pengguna berhasil dihapus')
      setIsDeleteModalOpen(false)
      setSelectedUser(null)
      queryClient.invalidateQueries({ queryKey: ['manager', 'users'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? 'Gagal menghapus pengguna')
    },
  })

  const handleApiError = (error: any, defaultMessage: string) => {
    console.log('Error response:', error.response?.data)
    console.log('Error status:', error.response?.status)
    
    const errorMessage = error.response?.data?.message ?? defaultMessage
    
    if (error.response?.data?.errors) {
      const validationErrors = error.response.data.errors
      const errorMessages = Object.values(validationErrors).flat().join('\n')
      toast.error(errorMessages)
    } else {
      toast.error(errorMessage)
    }
  }

  const handleEditClick = (user: User) => {
    setSelectedUser(user)
    setIsEditMode(true)
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '', // Kosongkan password untuk edit
      role: user.role,
    })
    setIsModalOpen(true)
  }

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'kasir',
    })
    setIsEditMode(false)
    setSelectedUser(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Nama harus diisi')
      return false
    }
    if (!formData.email.trim()) {
      toast.error('Email harus diisi')
      return false
    }
    if (!formData.email.includes('@')) {
      toast.error('Email tidak valid')
      return false
    }
    if (!formData.phone.trim()) {
      toast.error('Nomor telepon harus diisi')
      return false
    }
    
    // Validasi password hanya jika mode tambah atau password diisi (untuk mode edit)
    if (!isEditMode) {
      if (!formData.password.trim()) {
        toast.error('Password harus diisi')
        return false
      }
      if (formData.password.length < 8) {
        toast.error('Password minimal 8 karakter')
        return false
      }
    } else if (formData.password && formData.password.length < 8) {
      toast.error('Password minimal 8 karakter')
      return false
    }
    
    return true
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    if (isEditMode && selectedUser) {
      // Untuk edit, kirim hanya field yang diubah
      const payload: Partial<FormData> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
      }
      
      // Hanya kirim password jika diisi
      if (formData.password) {
        payload.password = formData.password
      }
      
      updateUserMutation.mutate({ id: selectedUser.id, payload })
    } else {
      createUserMutation.mutate(formData)
    }
  }

  const apiData = data?.data;
  const users = Array.isArray(apiData?.data) ? apiData.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kelola Pengguna</h1>
          <p className="text-muted-foreground text-sm">Kelola semua pengguna sistem</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              resetForm()
              setIsModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pengguna
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>No. Telepon</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada pengguna
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role] || ''}>
                          {user.role.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(user)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(user)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Tambah/Edit Pengguna */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) handleCloseModal()
      }}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Ubah data pengguna yang sudah ada'
                : 'Isi form untuk menambahkan pengguna baru ke sistem'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                placeholder="Nama pengguna"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">No. Telepon</Label>
              <Input
                id="phone"
                placeholder="081234567890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {isEditMode && '(Kosongkan jika tidak diubah)'}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={isEditMode ? "Biarkan kosong jika tidak diubah" : "Minimal 8 karakter"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(role) => setFormData({ ...formData, role })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kasir">Kasir</SelectItem>
                  <SelectItem value="kurir">Kurir</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseModal}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
            >
              {createUserMutation.isPending || updateUserMutation.isPending 
                ? 'Menyimpan...' 
                : 'Simpan'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Konfirmasi Hapus */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle className="text-red-600">Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengguna ini?
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Detail Pengguna:</p>
                <div className="bg-muted p-3 rounded-md space-y-1">
                  <p className="text-sm"><span className="font-medium">Nama:</span> {selectedUser.name}</p>
                  <p className="text-sm"><span className="font-medium">Email:</span> {selectedUser.email}</p>
                  <p className="text-sm"><span className="font-medium">Role:</span> {selectedUser.role}</p>
                </div>
              </div>
              <p className="text-sm text-red-600 mt-4">
                Tindakan ini tidak dapat dibatalkan. Data pengguna akan dihapus permanen.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setSelectedUser(null)
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

Component.displayName = 'ManagerUsersPage'