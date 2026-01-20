'use client'

import { FiTrash2, FiMinus, FiPlus, FiShoppingCart, FiArrowRight, FiPackage } from 'react-icons/fi'
import Card from '@/components/ui/Card'
import { formatCurrencyPK } from '@/lib/currency'
import { useCart } from '@/lib/CartContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function CartPage() {
  const router = useRouter()
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()

  const total = getCartTotal()

  const handleRemove = (item) => {
    removeFromCart(item.id)
    toast.success(`${item.name} removed from cart`)
  }

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      clearCart()
      toast.success('Cart cleared successfully')
    }
  }

  if (cart.length === 0) {
    return (
      <div className="w-full min-h-[70vh] flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <div className="text-center py-12 px-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiShoppingCart className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Your cart is empty</h3>
            <p className="text-gray-600 mb-8">Discover amazing products and start shopping!</p>
            <Link
              href="/user/shopping"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              <FiPackage className="w-5 h-5" />
              Start Shopping
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">Shopping Cart</h1>
            <p className="text-base text-gray-600 flex items-center gap-2">
              <FiShoppingCart className="w-5 h-5" />
              {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          <button
            onClick={handleClearCart}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold"
          >
            <FiTrash2 className="w-4 h-4" />
            Clear Cart
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Product Image */}
                <div className="w-full sm:w-36 h-36 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden flex-shrink-0 group relative">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiShoppingCart className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  {item.category && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow">
                      {item.category}
                    </span>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description || 'No description available'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-600 mr-2 font-medium">Quantity:</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 rounded-lg transition-all duration-200 shadow-sm"
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>
                      <span className="w-14 text-center font-bold text-lg text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 rounded-lg transition-all duration-200 shadow-sm"
                      >
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Price & Remove */}
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-left sm:text-right">
                        {item.sale_price ? (
                          <div>
                            <p className="text-2xl font-black text-green-600">
                              {formatCurrencyPK(item.sale_price * item.quantity)}
                            </p>
                            <p className="text-sm text-gray-500 line-through">
                              {formatCurrencyPK(item.price * item.quantity)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-2xl font-black text-blue-600">
                            {formatCurrencyPK(item.price * item.quantity)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(item)}
                        className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Remove item"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Action Buttons - Mobile Only */}
          <div className="sm:hidden">
            <button
              onClick={handleClearCart}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold border border-red-200"
            >
              <FiTrash2 className="w-4 h-4" />
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 bg-gradient-to-br from-white to-gray-50">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 -mx-6 -mt-6 rounded-t-2xl mb-6">
              <h2 className="text-2xl font-black">Order Summary</h2>
              <p className="text-blue-100 text-sm mt-1">Review your order details</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Subtotal</span>
                <span className="font-bold text-gray-900 text-lg">{formatCurrencyPK(total)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Items</span>
                <span className="font-bold text-blue-600">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Shipping</span>
                <span className="font-bold text-green-600 flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  FREE
                </span>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-xl border-2 border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-bold text-lg">Total</span>
                  <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatCurrencyPK(total)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/user/checkout')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-5 rounded-xl transition-all shadow-lg hover:shadow-2xl flex items-center justify-center gap-3 group mb-4"
            >
              <span className="text-lg">Proceed to Checkout</span>
              <FiArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>

            <Link
              href="/user/shopping"
              className="block w-full text-center py-3 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              ← Continue Shopping
            </Link>

            <div className="mt-6 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-green-800">100% Secure Checkout</p>
                  <p className="text-xs text-green-700 mt-1">Advance payment required for order processing</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
