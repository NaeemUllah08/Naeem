'use client'

import { useState, useEffect } from 'react'
import { FiShoppingCart, FiCreditCard, FiMapPin, FiUser, FiPhone, FiMail, FiFileText, FiCheck } from 'react-icons/fi'
import Card from '@/components/ui/Card'
import { formatCurrencyPK } from '@/lib/currency'
import { useCart } from '@/lib/CartContext'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, getCartTotal, clearCart } = useCart()
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMethods, setLoadingMethods] = useState(true)

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    paymentMethodId: '',
    notes: ''
  })

  useEffect(() => {
    if (cart.length === 0) {
      router.push('/user/cart')
      return
    }
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/user/shopping-payment-methods', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setPaymentMethods(data.paymentMethods || [])
        if (data.paymentMethods?.length > 0) {
          setFormData(prev => ({ ...prev, paymentMethodId: data.paymentMethods[0].id }))
        }
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoadingMethods(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/user/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart,
          totalAmount: getCartTotal(),
          ...formData
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Order placed successfully!')
        clearCart()
        router.push('/user/orders')
      } else {
        toast.error(data.error || 'Failed to place order')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const selectedMethod = paymentMethods.find(m => m.id === formData.paymentMethodId)

  if (cart.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">Checkout</h1>
        <p className="text-base text-gray-600">Complete your order and provide delivery details</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
              ✓
            </div>
            <span className="text-sm font-semibold text-green-600 hidden sm:block">Cart</span>
          </div>
          <div className="w-16 h-1 bg-blue-600"></div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <span className="text-sm font-semibold text-blue-600 hidden sm:block">Checkout</span>
          </div>
          <div className="w-16 h-1 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <span className="text-sm font-medium text-gray-500 hidden sm:block">Complete</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-blue-100">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FiUser className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">Customer Information</h2>
                <p className="text-xs text-gray-600">Your contact details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <FiUser className="w-4 h-4" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <FiPhone className="w-4 h-4" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
                  placeholder="+92 300 1234567"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <FiMail className="w-4 h-4" />
                  Email Address <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
          </Card>

          {/* Shipping Address */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-purple-100">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FiMapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">Shipping Address</h2>
                <p className="text-xs text-gray-600">Where should we deliver?</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                <FiMapPin className="w-4 h-4" />
                Complete Address <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={formData.shippingAddress}
                onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none hover:border-gray-400"
                placeholder="House/Flat No, Street Name, Area&#10;City Name&#10;Postal/Zip Code"
              />
              <p className="text-xs text-gray-500 mt-2">Please provide complete address for accurate delivery</p>
            </div>
          </Card>

          {/* Payment Method */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-green-100">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <FiCreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">Payment Method</h2>
                <p className="text-xs text-gray-600">Choose how you'll pay</p>
              </div>
            </div>

            {loadingMethods ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading payment methods...</p>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-12 bg-red-50 rounded-xl border border-red-200">
                <FiCreditCard className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-600 font-semibold">No payment methods available</p>
                <p className="text-sm text-gray-600 mt-1">Please contact support for assistance</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`block p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      formData.paymentMethodId === method.id
                        ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg'
                        : 'border-gray-300 hover:border-green-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={formData.paymentMethodId === method.id}
                        onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
                        className="mt-1 w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="font-black text-lg text-gray-900 mb-2">{method.name}</div>
                        <div className="space-y-2">
                          {method.bank_name && (
                            <div className="text-sm text-gray-700">
                              <span className="font-semibold">Bank:</span> {method.bank_name}
                            </div>
                          )}
                          {method.account_title && (
                            <div className="text-sm text-gray-700">
                              <span className="font-semibold">Account Title:</span> {method.account_title}
                            </div>
                          )}
                          {method.account_number && (
                            <div className="mt-3">
                              <span className="text-xs text-gray-600 block mb-1">Account Number</span>
                              <div className="text-base font-bold text-gray-900 font-mono bg-white px-4 py-3 rounded-lg border-2 border-gray-200 inline-block">
                                {method.account_number}
                              </div>
                            </div>
                          )}
                          {method.instructions && (
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-xs font-semibold text-amber-900 mb-1">Payment Instructions:</p>
                              <p className="text-xs text-amber-800 whitespace-pre-wrap">{method.instructions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {selectedMethod && (
              <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg">ℹ</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-900 mb-1">Advance Payment Required</p>
                    <p className="text-xs text-blue-800">
                      Please transfer the full order amount to the selected account before completing your order.
                      Your order will be processed after payment verification.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Additional Notes */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-200">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                <FiFileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">Additional Notes</h2>
                <p className="text-xs text-gray-600">Special instructions (Optional)</p>
              </div>
            </div>

            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition-all resize-none hover:border-gray-400"
              placeholder="Example: Please deliver after 5 PM, or any special packaging requests..."
            />
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 bg-gradient-to-br from-white to-gray-50 shadow-xl">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-6 -mx-6 -mt-6 rounded-t-2xl mb-6">
              <h2 className="text-2xl font-black">Order Summary</h2>
              <p className="text-blue-100 text-sm mt-1">Review before placing order</p>
            </div>

            <div className="space-y-3 mb-6 max-h-72 overflow-y-auto custom-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-200 last:border-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiShoppingCart className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate mb-1">{item.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">Quantity: {item.quantity}</p>
                    <p className="text-base font-black text-blue-600">
                      {formatCurrencyPK((item.sale_price || item.price) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Subtotal</span>
                <span className="font-bold text-gray-900 text-lg">{formatCurrencyPK(getCartTotal())}</span>
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
                  <span className="text-gray-700 font-bold text-lg">Total Amount</span>
                  <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatCurrencyPK(getCartTotal())}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || paymentMethods.length === 0}
              className="w-full bg-gradient-to-r from-green-600 via-green-600 to-emerald-600 hover:from-green-700 hover:via-green-700 hover:to-emerald-700 text-white font-black py-5 rounded-xl transition-all shadow-lg hover:shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group mb-4"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                  <span className="text-lg">Processing Order...</span>
                </>
              ) : (
                <>
                  <FiCheck className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-lg">Place Order Now</span>
                </>
              )}
            </button>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-600 text-center leading-relaxed">
                By placing this order, you agree to our{' '}
                <span className="text-blue-600 font-semibold">terms and conditions</span>
              </p>
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}
