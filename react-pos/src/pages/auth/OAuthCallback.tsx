import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import type { AuthUser } from '@/types'

export default function OAuthCallback() {
  const [params]  = useSearchParams()
  const navigate  = useNavigate()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const token = params.get('token')
    const error = params.get('error')
    const userRaw = params.get('user')

    if (error) {
      toast.error('Login Google gagal: ' + decodeURIComponent(error))
      navigate('/login', { replace: true })
      return
    }

    if (token && userRaw) {
      try {
        const user: AuthUser = JSON.parse(decodeURIComponent(userRaw))
        setAuth(user, token)
        toast.success(`Selamat datang, ${user.name}!`)

        const routes: Record<string, string> = {
          manager  : '/manager/dashboard',
          kasir    : '/cashier/dashboard',
          kurir    : '/courier/dashboard',
          pelanggan: '/customer/menu',
        }
        navigate(routes[user.role] ?? '/', { replace: true })
      } catch {
        toast.error('Terjadi kesalahan saat proses login.')
        navigate('/login', { replace: true })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-3 text-white">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-300">Memproses login Google...</p>
      </div>
    </div>
  )
}