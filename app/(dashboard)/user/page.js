'use client'

import { useEffect, useState } from 'react'
import { FiDollarSign, FiTrendingUp, FiUsers, FiGift, FiShoppingBag, FiPackage, FiCreditCard } from 'react-icons/fi'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { formatCurrencyPK } from '@/lib/currency'
import Link from 'next/link'
import PageOverlay from '@/components/ui/PageOverlay'

export default function UserDashboard() {
  const [stats, setStats] = useState({
    walletBalance: 0,
    totalInvestments: 0,
    totalProfit: 0,
    referrals: 0,
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')

      // Fetch dashboard stats
      const res = await fetch('/api/user/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setRecentActivities(data.recentActivities || [])
      }

      // Fetch investment plans
      const plansRes = await fetch('/api/user/investment-plans', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (plansRes.ok) {
        const plansData = await plansRes.json()
        setPlans(plansData.plans || [])
      }
    } catch (error) {
      toast.error('Something went wrong')
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

  return (
    <PageOverlay pageName="dashboard">
      <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Welcome back! Here's your overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          icon={FiDollarSign}
          label="Wallet Balance"
          value={formatCurrencyPK(stats.walletBalance)}
          bgColor="bg-green-500"
          iconColor="text-green-500"
        />
        <StatCard
          icon={FiTrendingUp}
          label="Total Investments"
          value={formatCurrencyPK(stats.totalInvestments)}
          bgColor="bg-blue-500"
          iconColor="text-blue-500"
        />
        <StatCard
          icon={FiGift}
          label="Total Profit"
          value={formatCurrencyPK(stats.totalProfit)}
          bgColor="bg-purple-500"
          iconColor="text-purple-500"
        />
        <StatCard
          icon={FiUsers}
          label="Referrals"
          value={stats.referrals}
          bgColor="bg-orange-500"
          iconColor="text-orange-500"
        />
      </div>

      {/* Investment Plans Section */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Available Investment Plans</h2>
          <Link href="/user/investments" className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-semibold">
            View All →
          </Link>
        </div>

        {plans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {plans.slice(0, 4).map((plan) => (
              <div key={plan.id} className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-300">
                <div className="text-center mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800">{plan.name}</h3>
                  <div className="inline-block px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold mt-2">
                    {plan.profit_percentage}% Profit
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Min Amount</span>
                    <span className="font-semibold text-gray-800">{formatCurrencyPK(plan.min_amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-semibold text-gray-800">{plan.min_duration_days} Days</span>
                  </div>
                </div>
                <Link
                  href="/user/investments"
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                >
                  Invest Now
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8 text-sm">No investment plans available</p>
        )}
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Recent Activities</h2>
          {recentActivities.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{activity.description}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{new Date(activity.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap self-start sm:self-auto ${
                    activity.type === 'profit' ? 'bg-green-100 text-green-700' :
                    activity.type === 'investment' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {formatCurrencyPK(activity.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">No recent activities</p>
          )}
        </Card>

        <Card>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/user/wallet"
              className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg transition-all text-center border border-blue-200"
            >
              <FiCreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900 text-xs sm:text-sm">Deposit History</h3>
            </Link>
            <Link
              href="/user/investments"
              className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg transition-all text-center border border-green-200"
            >
              <FiTrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900 text-xs sm:text-sm">Invest</h3>
            </Link>
            <Link
              href="/user/referrals"
              className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg transition-all text-center border border-purple-200"
            >
              <FiUsers className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900 text-xs sm:text-sm">Refer Friends</h3>
            </Link>
            <Link
              href="/user/shopping"
              className="p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-lg transition-all text-center border border-orange-200"
            >
              <FiShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-orange-900 text-xs sm:text-sm">Shop</h3>
            </Link>
          </div>
        </Card>
      </div>
      </div>
    </PageOverlay>
  )
}
