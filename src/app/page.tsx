'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { School, Mail, Lock, Eye, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast, Toaster } from '@/components/ui/toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        toast.error('Login failed', error.message)
        return
      }

      toast.success('Welcome back!', 'Redirecting to dashboard...')

      // The middleware will handle the redirect based on role
      // But we need to give it a moment to get the profile
      setTimeout(() => {
        window.location.href = '/owner/dashboard'
      }, 1000)
    } catch (err) {
      toast.error('An error occurred', 'Please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl animate-pulse-glow">
              <School className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">EduManager</h1>
              <p className="text-white/70">School Management System</p>
            </div>
          </div>

          <h2 className="text-5xl font-bold leading-tight mb-6">
            Manage Your School
            <br />
            <span className="text-white/80">Efficiently & Easily</span>
          </h2>

          <p className="text-lg text-white/70 max-w-md mb-8">
            Complete solution for admissions, fees, attendance, exams, and more.
            All in one powerful platform designed for modern schools.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            {[
              'Student Admissions',
              'Fee Management',
              'Attendance Tracking',
              'Exam Results',
              'Report Cards',
              'Staff Management',
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-sm text-white/80"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Decorative grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <School className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">EduManager</h1>
              <p className="text-sm text-slate-500">School Management</p>
            </div>
          </div>

          {/* Form header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500">Sign in to access your dashboard</p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-12 pr-12 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
              <div
                onMouseEnter={() => setShowPassword(true)}
                onMouseLeave={() => setShowPassword(false)}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer transition-all"
                title="Hover or click to show password"
              >
                <Eye className="h-5 w-5" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
            <p className="text-sm font-medium text-indigo-900 mb-2">Demo Credentials</p>
            <div className="space-y-1 text-sm text-indigo-700">
              <p><span className="font-medium">Email:</span> owner@school.com</p>
              <p><span className="font-medium">Password:</span> Owner@12345</p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-slate-500">
            Secure login for school administrators only.
            <br />
            Contact your school owner for access.
          </p>
        </div>
      </div>

      <Toaster />
    </div>
  )
}
