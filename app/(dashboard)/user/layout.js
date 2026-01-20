'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { FiMenu, FiShoppingCart } from 'react-icons/fi'
import { CartProvider, useCart } from '@/lib/CartContext'
import Link from 'next/link'

function UserLayoutContent({ children, isMobileSidebarOpen, setIsMobileSidebarOpen }) {
  const { getCartCount } = useCart()
  const cartCount = getCartCount()
  const pathname = usePathname()

  // Only show cart icon on shopping-related pages
  const showCartIcon = pathname?.includes('/shopping') || pathname?.includes('/cart') || pathname?.includes('/checkout')

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        isAdmin={false}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header with Hamburger Menu */}
        <header className="lg:hidden bg-white shadow-md sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="text-gray-700 hover:text-gray-900 transition"
              aria-label="Open menu"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Investment Platform
            </h1>
            {showCartIcon && (
              <Link href="/user/cart" className="relative">
                <FiShoppingCart className="w-6 h-6 text-gray-700 hover:text-blue-600 transition" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </header>

        {/* Desktop Cart Icon */}
        {showCartIcon && (
          <div className="hidden lg:block fixed top-6 right-6 z-40">
            <Link href="/user/cart" className="relative bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition">
              <FiShoppingCart className="w-6 h-6 text-gray-700 hover:text-blue-600 transition" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function UserLayout({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <CartProvider>
      <UserLayoutContent
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      >
        {children}
      </UserLayoutContent>
    </CartProvider>
  )
}
