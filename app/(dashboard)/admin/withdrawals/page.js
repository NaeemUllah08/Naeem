'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { formatCurrencyPK } from '@/lib/currency'
import { FiSearch, FiTrash2, FiX, FiCheck, FiMail, FiDollarSign, FiCalendar } from 'react-icons/fi'

export default function AdminWithdrawalsPage() {
  const [allWithdrawals, setAllWithdrawals] = useState([])
  const [filteredWithdrawals, setFilteredWithdrawals] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [typeFilter, setTypeFilter] = useState('email') // 'email' or 'other'
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showApproveModal, setShowApproveModal] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(null)
  const [transactionId, setTransactionId] = useState('')
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    fetchWithdrawals(true) // Initial load with spinner

    // Set up auto-refresh every 5 seconds for real-time updates
    const interval = setInterval(() => {
      fetchWithdrawals(false) // Background refresh without spinner
    }, 5000) // Refresh every 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    applyFilters()
  }, [allWithdrawals, statusFilter, typeFilter, searchQuery, startDate, endDate])

  const fetchWithdrawals = async (showLoader = true) => {
    if (showLoader) setFetching(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/withdrawals', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        console.log('Fetched withdrawals:', data.withdrawals)
        setAllWithdrawals(data.withdrawals || [])
        setLastUpdated(new Date())
      } else {
        const error = await res.json()
        // Only show error toast on initial load, not on background refresh
        if (showLoader) {
          toast.error(error.error || 'Failed to load withdrawals')
        }
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
      // Only show error toast on initial load, not on background refresh
      if (showLoader) {
        toast.error('Failed to load withdrawals')
      }
    } finally {
      if (showLoader) setFetching(false)
    }
  }

  const applyFilters = () => {
    let result = [...allWithdrawals]

    // Status filter
    result = result.filter(w => w.status === statusFilter)

    // Type filter (email vs other)
    if (typeFilter === 'email') {
      // Email earnings: profit_amount > 0 AND referral_amount == 0
      result = result.filter(w => {
        const hasProfit = parseFloat(w.profit_amount || 0) > 0
        const noReferral = parseFloat(w.referral_amount || 0) === 0
        return hasProfit && noReferral
      })
    } else if (typeFilter === 'other') {
      // Other: has referral_amount OR (profit from deposits, not email)
      result = result.filter(w => {
        const hasReferral = parseFloat(w.referral_amount || 0) > 0
        return hasReferral || w.withdrawal_type === 'both'
      })
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(w =>
        w.userName?.toLowerCase().includes(query) ||
        w.userEmail?.toLowerCase().includes(query) ||
        w.amount?.toString().includes(query) ||
        w.payment_method?.toLowerCase().includes(query)
      )
    }

    // Date range filter
    if (startDate) {
      result = result.filter(w =>
        new Date(w.created_at) >= new Date(startDate)
      )
    }
    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      result = result.filter(w =>
        new Date(w.created_at) <= endDateTime
      )
    }

    setFilteredWithdrawals(result)
  }

  const handleApprove = async (withdrawalId) => {
    if (!transactionId || transactionId.trim() === '') {
      toast.error('Transaction ID is required')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          withdrawalId,
          status: 'approved',
          transactionId: transactionId
        }),
      })

      if (res.ok) {
        toast.success('Withdrawal approved successfully')
        setShowApproveModal(null)
        setTransactionId('')
        fetchWithdrawals(false) // Immediate background refresh
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to approve withdrawal')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (withdrawalId, reason) => {
    if (!reason || reason.trim() === '') {
      toast.error('Please provide a rejection reason')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          withdrawalId,
          status: 'rejected',
          rejectedReason: reason
        }),
      })

      if (res.ok) {
        toast.success('Withdrawal rejected and amount refunded')
        setShowRejectModal(null)
        setRejectReason('')
        fetchWithdrawals(false) // Immediate background refresh
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to reject withdrawal')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (withdrawalId) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/withdrawals', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ withdrawalId }),
      })

      if (res.ok) {
        toast.success('Withdrawal deleted successfully')
        setShowDeleteConfirm(null)
        fetchWithdrawals(false) // Immediate background refresh
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete withdrawal')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStartDate('')
    setEndDate('')
  }

  // Count withdrawals by type for each status
  const emailCount = allWithdrawals.filter(w =>
    w.status === statusFilter &&
    parseFloat(w.profit_amount || 0) > 0 &&
    parseFloat(w.referral_amount || 0) === 0
  ).length

  const otherCount = allWithdrawals.filter(w =>
    w.status === statusFilter &&
    (parseFloat(w.referral_amount || 0) > 0 || w.withdrawal_type === 'both')
  ).length

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Withdrawals</h1>
          <p className="text-sm text-gray-600 mt-1">Process withdrawal requests</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Auto-refreshing</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Status Filter Tabs - Compact */}
      <Card className="mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
              statusFilter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
              statusFilter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
              statusFilter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Rejected
          </button>
        </div>
      </Card>

      {/* Type Filter & Search - Compact */}
      <Card className="mb-4">
        <div className="space-y-3">
          {/* Withdrawal Type - Only 2 Buttons */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Withdrawal Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTypeFilter('email')}
                className={`flex-1 px-3 py-2 rounded-lg font-semibold transition text-sm flex items-center justify-center gap-2 ${
                  typeFilter === 'email'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FiMail /> Email Withdrawals ({emailCount})
              </button>
              <button
                onClick={() => setTypeFilter('other')}
                className={`flex-1 px-3 py-2 rounded-lg font-semibold transition text-sm flex items-center justify-center gap-2 ${
                  typeFilter === 'other'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FiDollarSign /> Other Withdrawals ({otherCount})
              </button>
            </div>
          </div>

          {/* Search Bar - Compact */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, amount..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Date Range - Compact */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                <FiCalendar className="inline mr-1" size={12} /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                <FiCalendar className="inline mr-1" size={12} /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              />
            </div>
          </div>

          {/* Clear Filters & Results - Compact */}
          <div className="flex items-center justify-between">
            {(searchQuery || startDate || endDate) && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <FiX size={12} /> Clear filters
              </button>
            )}
            <div className="text-xs text-gray-600 ml-auto">
              Showing <span className="font-bold">{filteredWithdrawals.length}</span> withdrawals
            </div>
          </div>
        </div>
      </Card>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Reject Withdrawal</h2>
            <p className="text-xs text-gray-600 mb-3">
              Provide rejection reason. Amount will be refunded.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows="3"
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleReject(showRejectModal, rejectReason)}
                disabled={loading || !rejectReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition text-sm disabled:opacity-50"
              >
                {loading ? 'Rejecting...' : 'Reject & Refund'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(null)
                  setRejectReason('')
                }}
                disabled={loading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-lg transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-100 p-2 rounded-full">
                <FiTrash2 className="text-red-600" size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Delete Withdrawal</h2>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              Permanently delete this withdrawal? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition text-sm disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={loading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-lg transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 p-2 rounded-full">
                <FiCheck className="text-green-600" size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Approve Withdrawal</h2>
            </div>

            {/* Withdrawal Details */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">User:</span>
                <span className="font-semibold text-gray-800">{showApproveModal.userName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-800">{formatCurrencyPK(showApproveModal.amount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Method:</span>
                <span className="font-semibold text-gray-800">{showApproveModal.payment_method}</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-3">
              Enter the transaction ID to approve this withdrawal.
            </p>

            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter transaction ID..."
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm mb-3"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(showApproveModal.id)}
                disabled={loading || !transactionId.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(null)
                  setTransactionId('')
                }}
                disabled={loading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-lg transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Withdrawal Details</h2>
              <button
                onClick={() => setShowDetailsModal(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-3">
              {/* User Information */}
              <div className="bg-blue-50 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-blue-800 mb-2">User Information</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-semibold text-gray-800">{showDetailsModal.userName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold text-gray-800">{showDetailsModal.userEmail}</span>
                  </div>
                </div>
              </div>

              {/* Withdrawal Information */}
              <div className="bg-green-50 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-green-800 mb-2">Withdrawal Information</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-green-700 text-sm">{formatCurrencyPK(showDetailsModal.amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-semibold text-gray-800">
                      {parseFloat(showDetailsModal.profit_amount || 0) > 0 && parseFloat(showDetailsModal.referral_amount || 0) === 0 ? (
                        <span className="text-green-600">Email Earnings</span>
                      ) : (
                        <span className="text-purple-600">Other (Deposits/Referrals)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      showDetailsModal.status === 'approved' ? 'bg-green-100 text-green-700' :
                      showDetailsModal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {showDetailsModal.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(showDetailsModal.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-purple-50 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-purple-800 mb-2">Payment Information</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Method:</span>
                    <span className="font-semibold text-gray-800">{showDetailsModal.payment_method}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-600 block mb-1">Account Details:</span>
                    <div className="bg-white p-2 rounded border border-purple-200">
                      <p className="font-semibold text-gray-800 whitespace-pre-wrap">{showDetailsModal.account_details}</p>
                    </div>
                  </div>
                  {showDetailsModal.transaction_id && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono font-semibold text-gray-800">{showDetailsModal.transaction_id}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Reason (if rejected) */}
              {showDetailsModal.status === 'rejected' && showDetailsModal.rejected_reason && (
                <div className="bg-red-50 rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-red-800 mb-2">Rejection Reason</h3>
                  <p className="text-xs text-gray-800">{showDetailsModal.rejected_reason}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDetailsModal(null)}
              className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-lg transition text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Withdrawals Table - Compact */}
      {fetching ? (
        <Card>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Loading...</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Method</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWithdrawals.length > 0 ? (
                  filteredWithdrawals.map((withdrawal) => {
                    const isEmail = parseFloat(withdrawal.profit_amount || 0) > 0 &&
                                   parseFloat(withdrawal.referral_amount || 0) === 0

                    return (
                      <tr key={withdrawal.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs font-semibold text-gray-800">{withdrawal.userName}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">{withdrawal.userEmail}</td>
                        <td className="px-3 py-2 text-xs font-semibold text-gray-800">
                          {formatCurrencyPK(withdrawal.amount)}
                        </td>
                        <td className="px-3 py-2">
                          {isEmail ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                              <FiMail size={10} /> Email
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium w-fit">
                              Other
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600">{withdrawal.payment_method}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">
                          {new Date(withdrawal.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">
                          {withdrawal.status === 'pending' ? (
                            <div className="flex flex-wrap gap-1">
                              <button
                                onClick={() => setShowDetailsModal(withdrawal)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-semibold transition"
                                title="View Details"
                              >
                                View
                              </button>
                              <button
                                onClick={() => setShowApproveModal(withdrawal)}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-semibold transition disabled:opacity-50"
                              >
                                <FiCheck size={12} />
                              </button>
                              <button
                                onClick={() => setShowRejectModal(withdrawal.id)}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-semibold transition disabled:opacity-50"
                              >
                                <FiX size={12} />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(withdrawal.id)}
                                disabled={loading}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs font-semibold transition disabled:opacity-50"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1 items-center">
                              <button
                                onClick={() => setShowDetailsModal(withdrawal)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-semibold transition"
                              >
                                View
                              </button>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                withdrawal.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {withdrawal.status}
                              </span>
                              <button
                                onClick={() => setShowDeleteConfirm(withdrawal.id)}
                                disabled={loading}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs transition disabled:opacity-50"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-3 py-6 text-center text-gray-500 text-sm">
                      No {statusFilter} {typeFilter} withdrawals found
                      {(searchQuery || startDate || endDate) && (
                        <div className="mt-2">
                          <button
                            onClick={clearFilters}
                            className="text-blue-600 hover:text-blue-700 font-semibold text-xs"
                          >
                            Clear filters
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
