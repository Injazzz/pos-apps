/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Activity } from 'lucide-react'
import {
  Card, CardContent, CardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/api/client'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const eventColors: Record<string, string> = {
  created: 'bg-green-100 text-green-800',
  updated: 'bg-blue-100 text-blue-800',
  deleted: 'bg-red-100 text-red-800',
}

export function Component() {
  const [search, setSearch] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['manager', 'activity-logs', search],
    queryFn: async () => {
      const { data } = await apiClient.get('/manager/activity-logs', {
        params: { search, per_page: 100 },
      })
      return data.data ?? []
    },
  })

  const logs = Array.isArray(data) ? data : data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Log Aktivitas</h1>
          <p className="text-muted-foreground text-sm">Pantau semua aktivitas di sistem</p>
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
          <Input
            placeholder="Cari aktivitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="flex items-start gap-4 p-3 border rounded-lg">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-64 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              ))
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 opacity-30 mb-2" />
                <p>Belum ada aktivitas</p>
              </div>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-4 p-3 border rounded-lg hover:bg-muted/30 transition">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">
                        {log.causer?.name || 'System'}
                      </p>
                      <Badge className={eventColors[log.event] || ''}>
                        {log.event.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {log.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                        locale: idLocale,
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

Component.displayName = 'ManagerActivityLogsPage'
