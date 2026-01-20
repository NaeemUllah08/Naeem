'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import toast from 'react-hot-toast'
import { formatCurrencyPK } from '@/lib/currency'

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchDeposits()
  }, [filter])

  const fetchDeposits = async () => {
    setFetching(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/deposits', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        const filteredDeposits = (data.deposits || []).filter(d => d.status === filter)
        setDeposits(filteredDeposits)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to load deposits')
      }
    } catch (error) {
      console.error('Error fetching deposits:', error)
      toast.error('Failed to load deposits')
    } finally {
      setFetching(false)
    }
  }

  const handleApprove = async (depositId) => {
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/deposits', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ depositId, status: 'approved' }),
      })

      if (res.ok) {
        toast.success('Deposit approved successfully')
        fetchDeposits()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to approve deposit')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (depositId) => {
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/deposits', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ depositId, status: 'rejected' }),
      })

      if (res.ok) {
        toast.success('Deposit rejected')
        fetchDeposits()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to reject deposit')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Manage Deposits</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Approve or reject deposit requests</p>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <button
            onClick={() => setFilter('pending')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg font-semibold transition text-sm sm:text-base ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg font-semibold transition text-sm sm:text-base ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg font-semibold transition text-sm sm:text-base ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Rejected
          </button>
        </div>
      </Card>

      {fetching ? (
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading deposits...</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                    <th className="hidden xl:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deposits.length > 0 ? (
                    deposits.map((deposit) => (
                      <tr key={deposit.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-800">{deposit.userName}</span>
                            <span className="md:hidden text-xs text-gray-500 mt-1">{deposit.userEmail}</span>
                            <span className="sm:hidden text-xs text-gray-500 mt-1">
                              {new Date(deposit.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-3 sm:px-6 py-4 text-sm text-gray-600">{deposit.userEmail}</td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-800">
                              {formatCurrencyPK(deposit.amount)}
                            </span>
                            <span className="lg:hidden text-xs text-gray-500 mt-1">{deposit.payment_method}</span>
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-3 sm:px-6 py-4 text-sm text-gray-600">{deposit.payment_method}</td>
                        <td className="hidden xl:table-cell px-3 sm:px-6 py-4 text-sm text-gray-600">{deposit.transaction_id || 'N/A'}</td>
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-4 text-sm text-gray-600">
                          {new Date(deposit.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          {deposit.status === 'pending' ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => handleApprove(deposit.id)}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition disabled:opacity-50 whitespace-nowrap"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(deposit.id)}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition disabled:opacity-50 whitespace-nowrap"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              deposit.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {deposit.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-3 sm:px-6 py-8 text-center text-gray-500 text-sm">
                        No {filter} deposits
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
