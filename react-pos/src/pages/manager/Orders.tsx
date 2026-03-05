/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import {
  Card, CardContent, CardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { apiClient } from '@/api/client'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v)
}

const ORDER_TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Diproses' },
  { value: 'cooking', label: 'Dimasak' },
  { value: 'ready', label: 'Siap' },
  { value: 'completed', label: 'Selesai' },
  { value: '', label: 'Semua' },
]

export function Component() {
  const [tab, setTab] = useState('pending')
  const [search, setSearch] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['manager', 'orders', tab, search],
    queryFn: async () => {
      const { data } = await apiClient.get('/manager/orders', {
        params: { 
          status: tab || undefined,
          search,
          per_page: 50,
        },
      })
      return data  // Return full paginated response { data: [...], links, meta }
    },
    refetchInterval: 30_000,
  })

  const apiData = data?.data;
  const orders = Array.isArray(apiData?.data) ? apiData.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kelola Pesanan</h1>
          <p className="text-muted-foreground text-sm">Lihat dan kelola semua pesanan</p>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-6">
              {ORDER_TABS.map(t => (
                <TabsTrigger key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Cari pesanan atau kode pesanan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada pesanan
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.order_code}</TableCell>
                      <TableCell>{order.customer?.name || 'Umum'}</TableCell>
                      <TableCell>{order.order_type}</TableCell>
                      <TableCell>{formatRupiah(order.total_price)}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} type="order" />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(order.created_at), {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

Component.displayName = 'ManagerOrdersPage'
