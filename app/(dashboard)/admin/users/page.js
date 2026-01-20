'use client'

import { useState, useEffect } from 'react'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import toast from 'react-hot-toast'
import { formatCurrencyPK } from '@/lib/currency'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [expandedUserId, setExpandedUserId] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setFetching(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to load users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setFetching(false)
    }
  }

  const handleBlockUser = async (userId, isBlocked) => {
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, isBlocked: !isBlocked }),
      })

      if (res.ok) {
        toast.success(`User ${!isBlocked ? 'blocked' : 'unblocked'} successfully`)
        fetchUsers()
      } else {
        toast.error('Failed to update user status')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId)
  }

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Manage Users</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">View and manage user accounts</p>
      </div>

      {fetching ? (
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
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
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                  <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Investments</th>
                  <th className="hidden xl:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Referrals</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length > 0 ? (
                  users.map((user) => (
                    <>
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                            <span className="md:hidden text-xs text-gray-500 mt-1">{user.email}</span>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-3 sm:px-6 py-4 text-sm text-gray-600">{user.email}</td>
                        <td className="hidden lg:table-cell px-3 sm:px-6 py-4 text-sm text-gray-600">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-800">
                              {formatCurrencyPK(user.walletBalance)}
                            </span>
                            <span className="sm:hidden text-xs text-purple-600 mt-1">
                              Inv: {formatCurrencyPK(user.totalInvestments)}
                            </span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-4 text-sm font-semibold text-purple-600">
                          {formatCurrencyPK(user.totalInvestments)}
                        </td>
                        <td className="hidden xl:table-cell px-3 sm:px-6 py-4">
                          <button
                            onClick={() => toggleExpand(user.id)}
                            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                          >
                            {user.referralsCount}
                            {user.referralsCount > 0 && (
                              expandedUserId === user.id ? <FiChevronUp /> : <FiChevronDown />
                            )}
                          </button>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {user.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <button
                            onClick={() => handleBlockUser(user.id, user.isBlocked)}
                            disabled={loading}
                            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition disabled:opacity-50 whitespace-nowrap ${
                              user.isBlocked
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            {user.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </td>
                      </tr>
                      {expandedUserId === user.id && user.referrals.length > 0 && (
                        <tr>
                          <td colSpan="8" className="px-3 sm:px-6 py-4 bg-gray-50">
                            <div className="sm:pl-8">
                              <h3 className="text-sm font-semibold text-gray-700 mb-3">Referrals ({user.referralsCount})</h3>
                              <div className="overflow-x-auto">
                                <table className="w-full bg-white rounded-lg overflow-hidden shadow">
                                  <thead className="bg-blue-50">
                                    <tr>
                                      <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-blue-700">Name</th>
                                      <th className="hidden sm:table-cell px-3 sm:px-4 py-2 text-left text-xs font-semibold text-blue-700">Email</th>
                                      <th className="hidden md:table-cell px-3 sm:px-4 py-2 text-left text-xs font-semibold text-blue-700">Joined Date</th>
                                      <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-blue-700">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {user.referrals.map((referral) => (
                                      <tr key={referral.id} className="hover:bg-gray-50">
                                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-800">{referral.name}</td>
                                        <td className="hidden sm:table-cell px-3 sm:px-4 py-3 text-sm text-gray-600">{referral.email}</td>
                                        <td className="hidden md:table-cell px-3 sm:px-4 py-3 text-sm text-gray-600">
                                          {new Date(referral.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 sm:px-4 py-3">
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            referral.status === 'Active'
                                              ? 'bg-green-100 text-green-700'
                                              : 'bg-yellow-100 text-yellow-700'
                                          }`}>
                                            {referral.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-3 sm:px-6 py-8 text-center text-gray-500 text-sm">
                      No users found
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
