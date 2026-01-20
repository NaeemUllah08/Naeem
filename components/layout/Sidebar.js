'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  FiHome,
  FiDollarSign,
  FiTrendingUp,
  FiLogOut,
  FiShoppingCart,
  FiCreditCard,
  FiUsers,
  FiCheckCircle,
  FiSettings,
  FiFileText,
  FiUser,
  FiPackage,
  FiMail,
  FiMenu,
  FiX,
  FiShoppingBag,
  FiLayers
} from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function Sidebar({ isAdmin = false, isMobileOpen, setIsMobileOpen }) {
  const pathname = usePathname()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }, [])

  const userMenuItems = [
    { icon: FiHome, label: 'Dashboard', href: '/user' },
    { icon: FiCreditCard, label: 'Deposit History', href: '/user/wallet' },
    { icon: FiTrendingUp, label: 'Browse Plans', href: '/user/investments' },
    { icon: FiLayers, label: 'My Investments', href: '/user/my-investments' },
    { icon: FiFileText, label: 'Withdrawals', href: '/user/withdrawals' },
    { icon: FiUsers, label: 'Referrals', href: '/user/referrals' },
    { icon: FiShoppingBag, label: 'Shopping', href: '/user/shopping' },
    { icon: FiShoppingCart, label: 'My Orders', href: '/user/orders' },
    { icon: FiMail, label: 'Email Submissions', href: '/user/email-submissions' },
    { icon: FiUser, label: 'Profile', href: '/user/profile' },
  ]

  const adminMenuItems = [
    { icon: FiHome, label: 'Dashboard', href: '/admin' },
    { icon: FiCheckCircle, label: 'Deposits', href: '/admin/deposits' },
    { icon: FiCheckCircle, label: 'Withdrawals', href: '/admin/withdrawals' },
    { icon: FiTrendingUp, label: 'Investments', href: '/admin/investments' },
    { icon: FiUsers, label: 'Users', href: '/admin/users' },
    { icon: FiPackage, label: 'Products', href: '/admin/products' },
    { icon: FiShoppingCart, label: 'Orders', href: '/admin/orders' },
    { icon: FiCreditCard, label: 'Payment Methods', href: '/admin/payment-methods' },
    { icon: FiMail, label: 'Emails', href: '/admin/emails' },
    { icon: FiFileText, label: 'Reports', href: '/admin/reports' },
    { icon: FiSettings, label: 'Settings', href: '/admin/settings' },
  ]

  const menuItems = isAdmin ? adminMenuItems : userMenuItems

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    router.push('/login')
  }

  const handleLinkClick = () => {
    // Close mobile menu when a link is clicked
    if (setIsMobileOpen) {
      setIsMobileOpen(false)
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`h-screen w-64 bg-gray-900 text-white flex flex-col fixed left-0 top-0 shadow-xl z-50 transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {isAdmin ? 'Admin Panel' : 'Investment'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {isAdmin ? 'Management System' : 'Platform'}
          </p>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          className="lg:hidden text-gray-400 hover:text-white transition"
        >
          <FiX className="w-6 h-6" />
        </button>
      </div>

      {/* User Info */}
      {currentUser && (
        <div className="px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {currentUser.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {currentUser.name || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {currentUser.email}
              </p>
              {isAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900 text-purple-200 mt-1">
                  Administrator
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-6 py-3 transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-r-4 border-blue-400 shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:pl-7'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-6 py-3 w-full text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200 hover:shadow-lg"
        >
          <FiLogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
    </>
  )
}
