/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { 
  Plus, MoreHorizontal, Trash2, Edit2, RefreshCw, X, Image as ImageIcon, Star, ChevronUp, ChevronDown
} from 'lucide-react'
import {
  Card, CardContent, CardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { apiClient } from '@/api/client'
import { toast } from 'sonner'
import type { Menu } from '@/types'

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v)
}

// Tipe untuk form data
type FormData = {
  name: string
  category: string
  price: number | string
  stock: number | string
  is_available: boolean
  description: string
  image_path: string | string[] | null
  new_images: File[]
  sort_order: number
}

export function Component() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)
  const [activeTab, setActiveTab] = useState('basic')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    price: '',
    stock: '',
    is_available: true,
    description: '',
    image_path: null,
    new_images: [],
    sort_order: 0,
  })

  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['manager', 'menus', search],
    queryFn: async () => {
      const { data } = await apiClient.get('/manager/menus', {
        params: { search, per_page: 50 },
      })
      return data
    },
  })

  const createMenuMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const formDataObj = new FormData()
      
      // Append basic fields
      formDataObj.append('name', formData.name)
      formDataObj.append('category', formData.category)
      formDataObj.append('price', formData.price.toString())
      formDataObj.append('is_available', formData.is_available ? '1' : '0')
      formDataObj.append('sort_order', formData.sort_order.toString())
      
      if (formData.stock) {
        formDataObj.append('stock', formData.stock.toString())
      }
      
      if (formData.description) {
        formDataObj.append('description', formData.description)
      }
      
      // Append multiple images
      formData.new_images.forEach((image, index) => {
        formDataObj.append(`images[${index}]`, image)
      })

      const { data } = await apiClient.post('/manager/menus', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return data
    },
    onSuccess: () => {
      toast.success('Menu berhasil ditambahkan')
      resetForm()
      setIsModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['manager', 'menus'] })
    },
    onError: (error: any) => {
      handleApiError(error, 'Gagal menambah menu')
    },
  })

  const updateMenuMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const formDataObj = new FormData()
      formDataObj.append('_method', 'PUT')
      
      // Append basic fields
      formDataObj.append('name', formData.name)
      formDataObj.append('category', formData.category)
      formDataObj.append('price', formData.price.toString())
      formDataObj.append('is_available', formData.is_available ? '1' : '0')
      formDataObj.append('sort_order', formData.sort_order.toString())
      
      if (formData.stock) {
        formDataObj.append('stock', formData.stock.toString())
      }
      
      if (formData.description) {
        formDataObj.append('description', formData.description)
      }
      
      // Append existing images as JSON if they're an array
      if (Array.isArray(formData.image_path) && formData.image_path.length > 0) {
        formDataObj.append('existing_images', JSON.stringify(formData.image_path))
      } else if (typeof formData.image_path === 'string' && formData.image_path) {
        formDataObj.append('existing_images', JSON.stringify([formData.image_path]))
      }
      
      // Append new images
      formData.new_images.forEach((image, index) => {
        formDataObj.append(`new_images[${index}]`, image)
      })

      const { data } = await apiClient.post(`/manager/menus/${id}`, formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return data
    },
    onSuccess: () => {
      toast.success('Menu berhasil diperbarui')
      resetForm()
      setIsModalOpen(false)
      setIsEditMode(false)
      setSelectedMenu(null)
      queryClient.invalidateQueries({ queryKey: ['manager', 'menus'] })
    },
    onError: (error: any) => {
      handleApiError(error, 'Gagal memperbarui menu')
    },
  })

  const deleteMenuMutation = useMutation({
    mutationFn: async (menuId: number) => {
      const { data } = await apiClient.delete(`/manager/menus/${menuId}`)
      return data
    },
    onSuccess: () => {
      toast.success('Menu berhasil dihapus')
      setIsDeleteModalOpen(false)
      setSelectedMenu(null)
      queryClient.invalidateQueries({ queryKey: ['manager', 'menus'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? 'Gagal menghapus menu')
    },
  })

  const handleApiError = (error: any, defaultMessage: string) => {
    console.log('Error response:', error.response?.data)
    
    const errorMessage = error.response?.data?.message ?? defaultMessage
    
    if (error.response?.data?.errors) {
      const validationErrors = error.response.data.errors
      const errorMessages = Object.values(validationErrors).flat().join('\n')
      toast.error(errorMessages)
    } else {
      toast.error(errorMessage)
    }
  }

  const handleEditClick = (menu: Menu) => {
    setSelectedMenu(menu)
    setIsEditMode(true)
    
    // Parse existing images
    let existingImagesArray: string[] = []
    if (menu.image_url) {
      if (Array.isArray(menu.image_url)) {
        existingImagesArray = menu.image_url
      } else if (typeof menu.image_url === 'string') {
        // Check if it's a JSON string
        try {
          const parsed = JSON.parse(menu.image_url)
          existingImagesArray = Array.isArray(parsed) ? parsed : [menu.image_url]
        } catch {
          existingImagesArray = [menu.image_url]
        }
      }
    }
    
    setExistingImages(existingImagesArray)
    setImagePreviews(existingImagesArray)
    
    setFormData({
      name: menu.name,
      category: menu.category,
      price: menu.price,
      stock: menu.stock ?? '',
      is_available: menu.is_available,
      description: menu.description || '',
      image_path: existingImagesArray,
      new_images: [],
      sort_order: menu.sort_order || 0,
    })

    setIsModalOpen(true)
    setActiveTab('basic')
  }

  const handleDeleteClick = (menu: Menu) => {
    setSelectedMenu(menu)
    setIsDeleteModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      stock: '',
      is_available: true,
      description: '',
      image_path: null,
      new_images: [],
      sort_order: 0,
    })
    setImagePreviews([])
    setExistingImages([])
    setPrimaryImageIndex(0)
    setIsEditMode(false)
    setSelectedMenu(null)
    setActiveTab('basic')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    const invalidFiles = files.filter(file => !validTypes.includes(file.type))
    
    if (invalidFiles.length > 0) {
      toast.error('Hanya file gambar (JPEG, PNG, WEBP) yang diperbolehkan')
      return
    }
    
    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    const oversizedFiles = files.filter(file => file.size > maxSize)
    
    if (oversizedFiles.length > 0) {
      toast.error('Ukuran file maksimal 2MB')
      return
    }

    // Max 5 images total
    const totalImages = (isEditMode ? existingImages.length : 0) + formData.new_images.length + files.length
    if (totalImages > 5) {
      toast.error('Maksimal 5 gambar per menu')
      return
    }

    setFormData(prev => ({
      ...prev,
      new_images: [...prev.new_images, ...files],
    }))

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    const isExisting = isEditMode && index < existingImages.length
    
    if (isExisting) {
      // Remove existing image
      const updatedExisting = [...existingImages]
      updatedExisting.splice(index, 1)
      setExistingImages(updatedExisting)
      
      setFormData(prev => ({
        ...prev,
        image_path: updatedExisting,
      }))
    } else {
      // Remove new image
      const newImageIndex = index - existingImages.length
      const updatedNewImages = [...formData.new_images]
      updatedNewImages.splice(newImageIndex, 1)
      setFormData(prev => ({
        ...prev,
        new_images: updatedNewImages,
      }))
    }
    
    // Update previews
    const updatedPreviews = [...imagePreviews]
    updatedPreviews.splice(index, 1)
    setImagePreviews(updatedPreviews)
    
    // Update primary index if needed
    if (index === primaryImageIndex) {
      setPrimaryImageIndex(0)
    } else if (index < primaryImageIndex) {
      setPrimaryImageIndex(prev => prev - 1)
    }
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= imagePreviews.length) return
    
    // Update previews
    const updatedPreviews = [...imagePreviews]
    const temp = updatedPreviews[index]
    updatedPreviews[index] = updatedPreviews[newIndex]
    updatedPreviews[newIndex] = temp
    setImagePreviews(updatedPreviews)
    
    // Update existing images array if in edit mode
    if (isEditMode) {
      const isIndexExisting = index < existingImages.length
      const isNewIndexExisting = newIndex < existingImages.length
      
      if (isIndexExisting && isNewIndexExisting) {
        // Both are existing images
        const updatedExisting = [...existingImages]
        const tempExisting = updatedExisting[index]
        updatedExisting[index] = updatedExisting[newIndex]
        updatedExisting[newIndex] = tempExisting
        setExistingImages(updatedExisting)
        setFormData(prev => ({
          ...prev,
          image_path: updatedExisting,
        }))
      } else if (!isIndexExisting && !isNewIndexExisting) {
        // Both are new images
        const updatedNew = [...formData.new_images]
        const tempNew = updatedNew[index - existingImages.length]
        updatedNew[index - existingImages.length] = updatedNew[newIndex - existingImages.length]
        updatedNew[newIndex - existingImages.length] = tempNew
        setFormData(prev => ({
          ...prev,
          new_images: updatedNew,
        }))
      }
    }
    
    // Update primary index
    if (index === primaryImageIndex) {
      setPrimaryImageIndex(newIndex)
    } else if (newIndex === primaryImageIndex) {
      setPrimaryImageIndex(index)
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Nama menu harus diisi')
      setActiveTab('basic')
      return false
    }
    if (!formData.category.trim()) {
      toast.error('Kategori harus diisi')
      setActiveTab('basic')
      return false
    }
    if (!formData.price) {
      toast.error('Harga harus diisi')
      setActiveTab('basic')
      return false
    }
    const price = Number(formData.price)
    if (isNaN(price) || price <= 0) {
      toast.error('Harga harus berupa angka positif')
      setActiveTab('basic')
      return false
    }
    if (formData.stock && Number(formData.stock) < 0) {
      toast.error('Stok tidak boleh negatif')
      setActiveTab('basic')
      return false
    }
    return true
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    if (isEditMode && selectedMenu) {
      updateMenuMutation.mutate({ id: selectedMenu.id, formData })
    } else {
      createMenuMutation.mutate(formData)
    }
  }

  const apiData = data?.data
  const menus = Array.isArray(apiData?.data) ? apiData.data : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kelola Menu</h1>
          <p className="text-muted-foreground text-sm">Kelola daftar menu makanan dan minuman</p>
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
            Tambah Menu
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <Input
            placeholder="Cari nama menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gambar</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urutan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : menus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Tidak ada menu
                    </TableCell>
                  </TableRow>
                ) : (
                  menus.map((menu: Menu) => {
                    // Parse images for display
                    let displayImage: string | null = null
                    if (menu.image_url) {
                      if (Array.isArray(menu.image_url) && menu.image_url.length > 0) {
                        displayImage = menu.image_url[0]
                      } else if (typeof menu.image_url === 'string') {
                        try {
                          const parsed = JSON.parse(menu.image_url)
                          displayImage = Array.isArray(parsed) ? parsed[0] : menu.image_url
                        } catch {
                          displayImage = menu.image_url
                        }
                      }
                    }
                    
                    return (
                      <TableRow key={menu.id}>
                        <TableCell>
                          <div className="h-10 w-10 rounded overflow-hidden bg-muted">
                            {displayImage ? (
                              <img 
                                src={displayImage} 
                                alt={menu.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{menu.name}</TableCell>
                        <TableCell>{menu.category}</TableCell>
                        <TableCell>{formatRupiah(menu.price)}</TableCell>
                        <TableCell>{menu.stock ?? '∞'}</TableCell>
                        <TableCell>
                          <Badge variant={menu.is_available ? 'default' : 'secondary'}>
                            {menu.is_available ? 'Tersedia' : 'Tidak Tersedia'}
                          </Badge>
                        </TableCell>
                        <TableCell>{menu.sort_order}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditClick(menu)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(menu)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Tambah/Edit Menu dengan Tabs */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) handleCloseModal()
      }}>
        <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Menu' : 'Tambah Menu Baru'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Ubah data menu yang sudah ada'
                : 'Isi form untuk menambahkan menu baru'
              }
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
              <TabsTrigger value="images">
                Gambar Menu {imagePreviews.length > 0 && `(${imagePreviews.length}/5)`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Menu <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  placeholder="Contoh: Nasi Goreng Spesial"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Makanan">Makanan</SelectItem>
                    <SelectItem value="Minuman">Minuman</SelectItem>
                    <SelectItem value="Snack">Snack</SelectItem>
                    <SelectItem value="Desert">Desert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Harga (Rp) <span className="text-red-500">*</span></Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="25000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stok</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    placeholder="Kosongkan jika tidak terbatas"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Kosongkan untuk stok tidak terbatas
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Urutan Tampil</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Deskripsi detail menu..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_available">Status Tersedia</Label>
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-4 py-4">
              <div className="space-y-4">
                <div>
                  <Label>Upload Gambar Menu</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload gambar menu (maksimal 5 gambar, format: JPG, PNG, WEBP, maks. 2MB per gambar)
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      multiple
                      onChange={handleImageUpload}
                      className="flex-1"
                      disabled={imagePreviews.length >= 5}
                    />
                  </div>
                </div>

                {/* Preview Images */}
                {imagePreviews.length > 0 && (
                  <div className="space-y-3">
                    <Label>Preview Gambar</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2"
                            style={{
                              borderColor: index === primaryImageIndex ? '#3b82f6' : 'transparent'
                            }}
                          />
                          
                          {/* Badge for primary image */}
                          {index === primaryImageIndex && (
                            <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              Utama
                            </div>
                          )}
                          
                          {/* Overlay buttons */}
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white hover:text-blue-400"
                              onClick={() => setPrimaryImageIndex(index)}
                              title="Jadikan utama"
                            >
                              <Star className={`h-4 w-4 ${index === primaryImageIndex ? 'fill-blue-400 text-blue-400' : ''}`} />
                            </Button>
                            
                            {index > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:text-blue-400"
                                onClick={() => moveImage(index, 'up')}
                                title="Pindah ke atas"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {index < imagePreviews.length - 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:text-blue-400"
                                onClick={() => moveImage(index, 'down')}
                                title="Pindah ke bawah"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white hover:text-red-400"
                              onClick={() => removeImage(index)}
                              title="Hapus"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      * Gambar pertama akan menjadi gambar utama. Urutan bisa diatur dengan tombol panah.
                    </p>
                  </div>
                )}

                {imagePreviews.length === 0 && (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Belum ada gambar. Klik tombol di atas untuk upload gambar.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseModal}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMenuMutation.isPending || updateMenuMutation.isPending}
            >
              {createMenuMutation.isPending || updateMenuMutation.isPending 
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
              Apakah Anda yakin ingin menghapus menu ini?
            </DialogDescription>
          </DialogHeader>

          {selectedMenu && (
            <div className="py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Detail Menu:</p>
                <div className="bg-muted p-3 rounded-md space-y-1">
                  <p className="text-sm"><span className="font-medium">Nama:</span> {selectedMenu.name}</p>
                  <p className="text-sm"><span className="font-medium">Kategori:</span> {selectedMenu.category}</p>
                  <p className="text-sm"><span className="font-medium">Harga:</span> {formatRupiah(selectedMenu.price)}</p>
                </div>
              </div>
              <p className="text-sm text-red-600 mt-4">
                Tindakan ini tidak dapat dibatalkan. Data menu akan dihapus permanen.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setSelectedMenu(null)
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedMenu && deleteMenuMutation.mutate(selectedMenu.id)}
              disabled={deleteMenuMutation.isPending}
            >
              {deleteMenuMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

Component.displayName = 'ManagerMenusPage'