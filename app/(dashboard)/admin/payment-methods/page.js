'use client'

import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiCreditCard, FiX } from 'react-icons/fi'
import Card from '@/components/ui/Card'
import toast from 'react-hot-toast'

export default function AdminPaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMethod, setEditingMethod] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    accountTitle: '',
    accountNumber: '',
    bankName: '',
    instructions: '',
    isActive: true
  })

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    setFetching(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/payment-methods', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setPaymentMethods(data.paymentMethods || [])
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const url = '/api/admin/payment-methods'
      const method = editingMethod ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingMethod ? { id: editingMethod.id, ...formData } : formData)
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(editingMethod ? 'Payment method updated' : 'Payment method created')
        resetForm()
        fetchPaymentMethods()
      } else {
        toast.error(data.error || 'Failed to save payment method')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete payment method "${name}"?`)) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/payment-methods?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        toast.success('Payment method deleted')
        fetchPaymentMethods()
      } else {
        toast.error('Failed to delete payment method')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const editMethod = (method) => {
    setEditingMethod(method)
    setFormData({
      name: method.name,
      accountTitle: method.account_title || '',
      accountNumber: method.account_number,
      bankName: method.bank_name || '',
      instructions: method.instructions || '',
      isActive: method.is_active
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      accountTitle: '',
      accountNumber: '',
      bankName: '',
      instructions: '',
      isActive: true
    })
    setEditingMethod(null)
    setShowModal(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8 w-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-6 mb-4 sm:mb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-2">Manage payment methods for orders</p>

          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium shadow-sm text-sm"
          >
            <FiPlus className="w-4 h-4" />
            Add Payment Method
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {fetching ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : paymentMethods.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <FiCreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Payment Methods</h3>
              <p className="text-gray-600 mb-6">Add your first payment method to start accepting orders</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((method) => (
              <Card key={method.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FiCreditCard className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-800">{method.name}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    method.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {method.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {method.bank_name && (
                    <div>
                      <p className="text-xs text-gray-600">Bank</p>
                      <p className="text-sm text-gray-800 font-semibold">{method.bank_name}</p>
                    </div>
                  )}
                  {method.account_title && (
                    <div>
                      <p className="text-xs text-gray-600">Account Title</p>
                      <p className="text-sm text-gray-800">{method.account_title}</p>
                    </div>
                  )}
                  {method.account_number && (
                    <div>
                      <p className="text-xs text-gray-600">Account Number</p>
                      <p className="text-sm text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded">
                        {method.account_number}
                      </p>
                    </div>
                  )}
                  {method.instructions && (
                    <div>
                      <p className="text-xs text-gray-600">Instructions</p>
                      <p className="text-xs text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                        {method.instructions}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => editMethod(method)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(method.id, method.name)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </h2>
              <button
                onClick={resetForm}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Method Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                  placeholder="e.g., Bank Transfer, EasyPaisa, JazzCash"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                  placeholder="e.g., Meezan Bank, HBL"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Account Title
                </label>
                <input
                  type="text"
                  value={formData.accountTitle}
                  onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                  placeholder="Account holder name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-mono"
                  placeholder="e.g., 1234567890123456"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none text-sm"
                  placeholder="Special instructions for customers..."
                />
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2.5 text-sm font-medium text-gray-700 cursor-pointer">
                  Active (visible to customers)
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition disabled:opacity-50 text-sm"
                >
                  {loading ? 'Saving...' : editingMethod ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
