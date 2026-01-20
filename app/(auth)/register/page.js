'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { FiUser, FiMail, FiLock, FiGift, FiArrowRight, FiDollarSign, FiUsers, FiTrendingUp, FiShoppingBag } from 'react-icons/fi'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: refCode || '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          referredBy: formData.referralCode || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Registration successful! Please login.')
        router.push('/login')
      } else {
        toast.error(data.error || 'Registration failed')
      }
    } catch (error) {
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

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">

          {/* Left Side - Branding & Benefits */}
          <div className="hidden lg:block text-white space-y-8 animate-fadeIn">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl border border-white/30">
                  <FiDollarSign className="w-10 h-10" />
                </div>
                <h1 className="text-4xl font-bold">Investment Platform</h1>
              </div>
              <p className="text-xl text-white/90 mb-8">
                Join thousands of investors and start earning through multiple income streams today!
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-transform">
                <div className="bg-blue-500 p-3 rounded-xl w-fit mb-3">
                  <FiUsers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-1">Referral Earnings</h3>
                <p className="text-white/80 text-sm">Earn from invitations</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-transform">
                <div className="bg-green-500 p-3 rounded-xl w-fit mb-3">
                  <FiMail className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-1">Gmail Earnings</h3>
                <p className="text-white/80 text-sm">Email opportunities</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-transform">
                <div className="bg-purple-500 p-3 rounded-xl w-fit mb-3">
                  <FiTrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-1">Airdrop Rewards</h3>
                <p className="text-white/80 text-sm">Token distributions</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-transform">
                <div className="bg-orange-500 p-3 rounded-xl w-fit mb-3">
                  <FiShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-1">Product Sales</h3>
                <p className="text-white/80 text-sm">Marketplace profits</p>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold mb-1">10K+</div>
                  <div className="text-white/80 text-sm">Active Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">Rs 50M+</div>
                  <div className="text-white/80 text-sm">Total Earnings</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">5</div>
                  <div className="text-white/80 text-sm">Income Methods</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Register Form */}
          <div className="animate-slideUp">
            <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 md:p-12 border border-gray-100 relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-3xl opacity-10"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full blur-3xl opacity-10"></div>

              <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
                    START YOUR JOURNEY
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
                    Create Your Account
                  </h2>
                  <p className="text-gray-600">
                    Join us and unlock multiple income streams
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <FiUser className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:border-gray-300"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  {/* Email */}
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

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <FiLock className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="w-full pl-12 pr-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:border-gray-300"
                        placeholder="Create a password (min 6 characters)"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <FiLock className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:border-gray-300"
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>

                  {/* Referral Code */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Referral Code <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <FiGift className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        name="referralCode"
                        value={formData.referralCode}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:border-gray-300"
                        placeholder="Enter referral code if you have one"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2 group"
                  >
                    <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
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

                {/* Login Link */}
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Already have an account?
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-bold text-lg group"
                  >
                    <span>Login to Your Account</span>
                    <FiArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Mobile Benefits - Show below form on small screens */}
            <div className="lg:hidden mt-6 space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 text-white">
                <div className="flex items-center space-x-3">
                  <FiDollarSign className="w-6 h-6" />
                  <div>
                    <h4 className="font-bold">5 Ways to Earn</h4>
                    <p className="text-sm text-white/80">Multiple income streams</p>
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

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl font-semibold">Loading...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
