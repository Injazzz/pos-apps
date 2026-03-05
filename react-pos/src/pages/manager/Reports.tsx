import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, RefreshCw, BarChart3 } from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/api/client'

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v)
}

// Stat Card
function ReportCard({
  title, value, sub, loading,
}: {
  title: string; value: string | number; sub?: string; loading?: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-2">{title}</p>
        {loading
          ? <Skeleton className="h-8 w-32 mb-2" />
          : <p className="text-3xl font-bold">{value}</p>
        }
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export function Component() {
  const [tab, setTab] = useState('summary')

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['manager', 'reports'],
    queryFn: async () => {
      const { data } = await apiClient.get('/manager/reports/summary')
      return data.data
    },
    refetchInterval: 60_000,
  })

  const today = reportData?.today ?? {}
  const overall = reportData?.overall ?? {}
  const monthly = reportData?.monthly ?? {}

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/manager/reports/export', {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `laporan-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link?.parentNode?.removeChild(link)
    } catch (error) {
      console.error('Export failed', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan & Analitik</h1>
          <p className="text-muted-foreground text-sm">Lihat ringkasan penjualan dan performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="summary">Ringkasan</TabsTrigger>
          <TabsTrigger value="daily">Harian</TabsTrigger>
          <TabsTrigger value="monthly">Bulanan</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportCard
              title="Pesanan Hari Ini"
              value={today.total_orders ?? 0}
              sub={`Rp ${formatRupiah(today.total_revenue ?? 0)}`}
              loading={isLoading}
            />
            <ReportCard
              title="Pendapatan (Total)"
              value={formatRupiah(overall.total_revenue ?? 0)}
              sub="semua waktu"
              loading={isLoading}
            />
            <ReportCard
              title="Total Pesanan"
              value={overall.total_orders ?? 0}
              sub="orders dibuat"
              loading={isLoading}
            />
            <ReportCard
              title="Rata-rata Order"
              value={formatRupiah((overall.total_revenue ?? 0) / (overall.total_orders ?? 1))}
              sub="per pesanan"
              loading={isLoading}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistik Bulanan</CardTitle>
              <CardDescription>
                {monthly.year} - Penjualan per bulan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center min-h-75 text-muted-foreground">
                <BarChart3 className="h-12 w-12 opacity-30 mr-2" />
                <p>Grafik data sedang dimuat...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Laporan Harian</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Data laporan harian dapat diakses melalui fitur export</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Laporan Bulanan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Data laporan bulanan dapat diakses melalui fitur export</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

Component.displayName = 'ManagerReportsPage'
