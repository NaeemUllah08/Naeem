'use client'

import { useState, useEffect } from 'react'
import { FiPackage, FiEye, FiTrash2, FiClock, FiCheck, FiX, FiTruck, FiShoppingCart, FiUser, FiMapPin, FiCreditCard } from 'react-icons/fi'
import Card from '@/components/ui/Card'
import { formatCurrencyPK } from '@/lib/currency'
import toast from 'react-hot-toast'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [viewingOrder, setViewingOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId, status, paymentStatus = null) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId,
          status,
          ...(paymentStatus && { paymentStatus })
        })
      })

      if (res.ok) {
        toast.success('Order updated successfully')
        fetchOrders()
        if (viewingOrder?.id === orderId) {
          const updatedOrder = orders.find(o => o.id === orderId)
          if (updatedOrder) {
            setViewingOrder({ ...updatedOrder, status, payment_status: paymentStatus || updatedOrder.payment_status })
          }
        }
      } else {
        toast.error('Failed to update order')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleDelete = async (orderId) => {
    if (!confirm('Delete this order? This action cannot be undone.')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/orders?orderId=${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        toast.success('Order deleted')
        fetchOrders()
        setShowModal(false)
      } else {
        toast.error('Failed to delete order')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'shipped': return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'completed': return 'bg-green-100 text-green-700 border-green-300'
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    return order.status === filter
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8 w-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-6 mb-4 sm:mb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-2">Manage customer orders and shipments</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FiPackage className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Orders</p>
                <p className="text-xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <FiClock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-xl font-bold text-gray-800">{stats.pending}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FiTruck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Processing</p>
                <p className="text-xl font-bold text-gray-800">{stats.processing}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <FiCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Revenue</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrencyPK(stats.totalRevenue)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Card className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('processing')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Processing ({stats.processing})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({stats.completed})
            </button>
          </div>
        </Card>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 pb-4 border-b">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('en-PK', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <FiUser className="inline w-4 h-4 mr-1" />
                      {order.user?.name || 'Unknown'} ({order.user?.email || 'N/A'})
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Customer</p>
                    <p className="text-sm text-gray-800 font-semibold">{order.customer_name}</p>
                    <p className="text-xs text-gray-600">{order.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrencyPK(order.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Payment Method</p>
                    <p className="text-sm text-gray-800 font-semibold">{order.payment_method?.name || 'N/A'}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      order.payment_status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setViewingOrder(order)
                      setShowModal(true)
                    }}
                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
                  >
                    <FiEye className="w-4 h-4" />
                    View Details
                  </button>
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {order.payment_status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, order.status, 'verified')}
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition"
                    >
                      <FiCheck className="w-4 h-4" />
                      Verify Payment
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <FiPackage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Orders Found</h3>
              <p className="text-gray-600">
                {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && viewingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Customer Info */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiUser className="w-5 h-5 text-blue-600" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Name</p>
                    <p className="text-sm font-semibold text-gray-800">{viewingOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Phone</p>
                    <p className="text-sm font-semibold text-gray-800">{viewingOrder.customer_phone}</p>
                  </div>
                  {viewingOrder.customer_email && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-600">Email</p>
                      <p className="text-sm font-semibold text-gray-800">{viewingOrder.customer_email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiMapPin className="w-5 h-5 text-blue-600" />
                  Shipping Address
                </h3>
                <p className="text-sm text-gray-800 bg-gray-50 p-4 rounded-lg">{viewingOrder.shipping_address}</p>
              </div>

              {/* Payment Info */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiCreditCard className="w-5 h-5 text-blue-600" />
                  Payment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Method</p>
                    <p className="text-sm font-semibold text-gray-800">{viewingOrder.payment_method?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      viewingOrder.payment_status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {viewingOrder.payment_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiShoppingCart className="w-5 h-5 text-blue-600" />
                  Order Items
                </h3>
                <div className="space-y-3">
                  {viewingOrder.items.map((item, index) => (
                    <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-20 h-20 bg-white rounded-lg flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FiShoppingCart className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-800">{item.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">Quantity: {item.quantity}</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Price: {formatCurrencyPK(item.sale_price || item.price)} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrencyPK((item.sale_price || item.price) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrencyPK(viewingOrder.total_amount)}</span>
                </div>
              </div>

              {/* Notes */}
              {viewingOrder.notes && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Customer Notes</h3>
                  <p className="text-sm text-gray-700 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    {viewingOrder.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDelete(viewingOrder.id)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
