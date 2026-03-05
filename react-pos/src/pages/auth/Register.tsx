import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'

import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Card, CardContent, CardDescription,
         CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useRegister } from '@/hooks/useAuth'

const registerSchema = z.object({
  name                : z.string().min(2, 'Nama minimal 2 karakter'),
  email               : z.string().email('Format email tidak valid'),
  phone               : z.string().optional(),
  password            : z.string().min(8, 'Password minimal 8 karakter'),
  password_confirmation: z.string(),
}).refine(
  (d) => d.password === d.password_confirmation,
  { message: 'Konfirmasi password tidak cocok', path: ['password_confirmation'] }
)

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const register = useRegister()

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const onSubmit = (data: RegisterForm) => register.mutate(data)

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md space-y-6">

        <div className="flex flex-col items-center gap-2 text-white">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg">
            <UtensilsCrossed className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Daftar Akun</h1>
          <p className="text-slate-400 text-sm">Buat akun pelanggan baru</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-xl">Registrasi</CardTitle>
            <CardDescription className="text-slate-400">
              Isi data di bawah untuk membuat akun
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">

              {/* Nama */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">Nama Lengkap</Label>
                <Input
                  id="name"
                  placeholder="Nama lengkap Anda"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  {...formRegister('name')}
                />
                {errors.name && (
                  <p className="text-red-400 text-xs">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contoh@email.com"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  {...formRegister('email')}
                />
                {errors.email && (
                  <p className="text-red-400 text-xs">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-200">
                  No. HP <span className="text-slate-500">(opsional)</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  {...formRegister('phone')}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 karakter"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                    {...formRegister('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs">{errors.password.message}</p>
                )}
              </div>

              {/* Konfirmasi Password */}
              <div className="space-y-2">
                <Label htmlFor="password_confirmation" className="text-slate-200">
                  Konfirmasi Password
                </Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  placeholder="Ulangi password"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  {...formRegister('password_confirmation')}
                />
                {errors.password_confirmation && (
                  <p className="text-red-400 text-xs">
                    {errors.password_confirmation.message}
                  </p>
                )}
              </div>

            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full"
                disabled={register.isPending}
              >
                {register.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {register.isPending ? 'Mendaftar...' : 'Daftar Sekarang'}
              </Button>

              <p className="text-slate-400 text-sm text-center">
                Sudah punya akun?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Masuk di sini
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}