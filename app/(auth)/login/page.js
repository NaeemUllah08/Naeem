'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { FiEye, FiEyeOff, FiMail, FiLock, FiArrowRight, FiDollarSign, FiTrendingUp, FiShield } from 'react-icons/fi'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Attempting login with:', { email: formData.email })

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      console.log('Login response:', { status: res.status, data })

      if (res.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        toast.success('Login successful!')

        if (data.user.isAdmin) {
          router.push('/admin')
        } else {
          router.push('/user')
        }
      } else {
        toast.error(data.error || 'Login failed')
        console.error('Login failed:', data.error)
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Back to Home Link */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-50 flex items-center space-x-2 text-white/90 hover:text-white transition-colors group"
      >
        <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="font-semibold">Back to Home</span>
      </Link>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">

          {/* Left Side - Branding & Info */}
          <div className="hidden lg:block text-white space-y-8 animate-fadeIn">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl border border-white/30">
                  <FiDollarSign className="w-10 h-10" />
                </div>
                <h1 className="text-4xl font-bold">Investment Platform</h1>
              </div>
              <p className="text-xl text-white/90 mb-8">
                Welcome back! Login to access your investment dashboard and continue growing your wealth.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-transform">
                <div className="bg-blue-500 p-3 rounded-xl">
                  <FiTrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Multiple Income Streams</h3>
                  <p className="text-white/80">5 different ways to earn and grow your portfolio</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-transform">
                <div className="bg-purple-500 p-3 rounded-xl">
                  <FiShield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Secure & Reliable</h3>
                  <p className="text-white/80">Bank-level security for your investments</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-transform">
                <div className="bg-green-500 p-3 rounded-xl">
                  <FiDollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Real-Time Tracking</h3>
                  <p className="text-white/80">Monitor your earnings and investments live</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="animate-slideUp">
            <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 md:p-12 border border-gray-100 relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-3xl opacity-10"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full blur-3xl opacity-10"></div>

              <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
                    WELCOME BACK
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
                    Login to Your Account
                  </h2>
                  <p className="text-gray-600">
                    Enter your credentials to access your dashboard
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <FiMail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:border-gray-300"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <FiLock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-12 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:border-gray-300"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <FiEyeOff className="w-5 h-5" />
                        ) : (
                          <FiEye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2 group"
                  >
                    <span>{loading ? 'Logging in...' : 'Login to Dashboard'}</span>
                    {!loading && (
                      <FiArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="mt-8 mb-6 flex items-center">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="px-4 text-sm text-gray-500 font-medium">OR</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>

                {/* Register Link */}
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Don't have an account?
                  </p>
                  <Link
                    href="/register"
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-bold text-lg group"
                  >
                    <span>Create New Account</span>
                    <FiArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Mobile Features - Show below form on small screens */}
            <div className="lg:hidden mt-6 space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 text-white">
                <div className="flex items-center space-x-3">
                  <FiTrendingUp className="w-6 h-6" />
                  <div>
                    <h4 className="font-bold">5 Income Streams</h4>
                    <p className="text-sm text-white/80">Multiple ways to earn</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
