'use client'

import { useEffect, useState } from 'react'
import { FiUsers, FiDollarSign, FiTrendingUp, FiAlertCircle } from 'react-icons/fi'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { formatCurrencyPK } from '@/lib/currency'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalInvestments: 0,
    pendingWithdrawals: 0,
    pendingDeposits: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (usersError) {
        console.error('Error fetching users count:', usersError)
      }

      // Fetch total deposits amount (approved only)
      const { data: depositsData, error: depositsError } = await supabase
        .from('deposits')
        .select('amount')
        .eq('status', 'approved')

      const totalDeposits = depositsData?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0

      if (depositsError) {
        console.error('Error fetching deposits:', depositsError)
      }

      // Fetch pending deposits count
      const { count: pendingDeposits, error: pendingDepositsError } = await supabase
        .from('deposits')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (pendingDepositsError) {
        console.error('Error fetching pending deposits:', pendingDepositsError)
      }

      // Fetch total investments amount (active only)
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('investments')
        .select('amount')
        .eq('status', 'active')

      const totalInvestments = investmentsData?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

      if (investmentsError) {
        console.error('Error fetching investments:', investmentsError)
      }

      // Fetch pending withdrawals count
      const { count: pendingWithdrawals, error: pendingWithdrawalsError } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (pendingWithdrawalsError) {
        console.error('Error fetching pending withdrawals:', pendingWithdrawalsError)
      }

      setStats({
        totalUsers: totalUsers || 0,
        totalDeposits: totalDeposits,
        totalInvestments: totalInvestments,
        pendingDeposits: pendingDeposits || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold text-gray-600">Loading...</div>
      </div>
    )
  }

  // Calculate percentages for charts
  const totalAmount = stats.totalDeposits + stats.totalInvestments
  const depositPercentage = totalAmount > 0 ? (stats.totalDeposits / totalAmount * 100).toFixed(1) : 0
  const investmentPercentage = totalAmount > 0 ? (stats.totalInvestments / totalAmount * 100).toFixed(1) : 0

  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Overview of platform statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          icon={FiUsers}
          label="Total Users"
          value={stats.totalUsers}
          bgColor="bg-blue-500"
          iconColor="text-blue-500"
        />
        <StatCard
          icon={FiDollarSign}
          label="Total Deposits"
          value={formatCurrencyPK(stats.totalDeposits)}
          bgColor="bg-green-500"
          iconColor="text-green-500"
        />
        <StatCard
          icon={FiTrendingUp}
          label="Total Investments"
          value={formatCurrencyPK(stats.totalInvestments)}
          bgColor="bg-purple-500"
          iconColor="text-purple-500"
        />
        <StatCard
          icon={FiAlertCircle}
          label="Pending Approvals"
          value={stats.pendingDeposits + stats.pendingWithdrawals}
          bgColor="bg-orange-500"
          iconColor="text-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Financial Overview Chart */}
        <Card className="xl:col-span-1">
          <h2 className="text-sm sm:text-base font-bold text-gray-800 mb-2 sm:mb-3">Financial Overview</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600">Deposits</span>
                <span className="text-xs font-semibold text-green-600">{depositPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${depositPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{formatCurrencyPK(stats.totalDeposits)}</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600">Investments</span>
                <span className="text-xs font-semibold text-purple-600">{investmentPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${investmentPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{formatCurrencyPK(stats.totalInvestments)}</p>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700">Total Amount</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrencyPK(totalAmount)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Pending Actions */}
        <Card className="xl:col-span-1">
          <h2 className="text-sm sm:text-base font-bold text-gray-800 mb-2 sm:mb-3">Pending Actions</h2>
          <div className="space-y-2">
            <a
              href="/admin/deposits"
              className="block p-2 sm:p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-yellow-900">Pending Deposits</h3>
                  <p className="text-xs text-yellow-700 hidden sm:block">Review and approve deposits</p>
                </div>
                <span className="bg-yellow-200 text-yellow-800 font-bold px-2 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                  {stats.pendingDeposits}
                </span>
              </div>
            </a>

            <a
              href="/admin/withdrawals"
              className="block p-2 sm:p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-red-900">Pending Withdrawals</h3>
                  <p className="text-xs text-red-700 hidden sm:block">Process withdrawal requests</p>
                </div>
                <span className="bg-red-200 text-red-800 font-bold px-2 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                  {stats.pendingWithdrawals}
                </span>
              </div>
            </a>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="xl:col-span-1">
          <h2 className="text-sm sm:text-base font-bold text-gray-800 mb-2 sm:mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <a
              href="/admin/users"
              className="block p-2 sm:p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <h3 className="text-xs sm:text-sm font-semibold text-blue-900">Manage Users</h3>
              <p className="text-xs text-blue-700 hidden sm:block">View and manage user accounts</p>
            </a>
            <a
              href="/admin/investments"
              className="block p-2 sm:p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <h3 className="text-xs sm:text-sm font-semibold text-green-900">Investment Plans</h3>
              <p className="text-xs text-green-700 hidden sm:block">Configure profit percentages</p>
            </a>
            <a
              href="/admin/reports"
              className="block p-2 sm:p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <h3 className="text-xs sm:text-sm font-semibold text-purple-900">View Reports</h3>
              <p className="text-xs text-purple-700 hidden sm:block">Access system logs and reports</p>
            </a>
          </div>
        </Card>
      </div>

      {/* Activity Overview */}
      <Card>
        <h2 className="text-sm sm:text-base font-bold text-gray-800 mb-2 sm:mb-3">Activity Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-xs text-gray-600 mt-1">Total Users</div>
            <div className="mt-1 sm:mt-2 flex justify-center">
              <FiUsers className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
          </div>

          <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.pendingDeposits}</div>
            <div className="text-xs text-gray-600 mt-1">Pending Deposits</div>
            <div className="mt-1 sm:mt-2 flex justify-center">
              <FiDollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
            </div>
          </div>

          <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.pendingWithdrawals}</div>
            <div className="text-xs text-gray-600 mt-1">Pending Withdrawals</div>
            <div className="mt-1 sm:mt-2 flex justify-center">
              <FiTrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            </div>
          </div>

          <div className="text-center p-2 sm:p-3 bg-orange-50 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.pendingDeposits + stats.pendingWithdrawals}</div>
            <div className="text-xs text-gray-600 mt-1">Total Pending</div>
            <div className="mt-1 sm:mt-2 flex justify-center">
              <FiAlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
