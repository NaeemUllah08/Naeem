'use client'

import { useEffect, useState } from 'react'
import { FiTrendingUp, FiClock, FiDollarSign, FiPercent, FiCalendar } from 'react-icons/fi'
import Card from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { formatCurrencyPK } from '@/lib/currency'
import PageOverlay from '@/components/ui/PageOverlay'

export default function MyInvestmentsPage() {
  const [investments, setInvestments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, active, completed

  useEffect(() => {
    fetchMyInvestments()
  }, [])

  const fetchMyInvestments = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/user/my-investments', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        setInvestments(data.investments || [])
      } else {
        toast.error('Failed to load investments')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = (startDate, durationDays) => {
    const start = new Date(startDate)
    const now = new Date()
    const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000)

    const totalDuration = end - start
    const elapsed = now - start

    if (elapsed < 0) return 0
    if (elapsed > totalDuration) return 100

    return Math.floor((elapsed / totalDuration) * 100)
  }

  const getRemainingDays = (startDate, durationDays) => {
    const start = new Date(startDate)
    const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000)
    const now = new Date()
    const remaining = Math.ceil((end - now) / (24 * 60 * 60 * 1000))
    return remaining > 0 ? remaining : 0
  }

  const filteredInvestments = investments.filter((inv) => {
    if (filter === 'all') return true
    if (filter === 'active') return inv.status === 'active'
    if (filter === 'completed') return inv.status === 'completed'
    return true
  })

  const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const totalProfit = investments.reduce((sum, inv) => sum + (inv.profit_earned || 0), 0)
  const activeCount = investments.filter(inv => inv.status === 'active').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold text-gray-600">Loading investments...</div>
      </div>
    )
  }

  return (
    <PageOverlay pageName="myInvestments">
      <div className="w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Investments</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Track and manage your investments</p>
        </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FiDollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Invested</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800">{formatCurrencyPK(totalInvested)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <FiTrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Profit</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800">{formatCurrencyPK(totalProfit)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <FiClock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Active Investments</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800">{activeCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({investments.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === 'completed'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({investments.filter(inv => inv.status === 'completed').length})
          </button>
        </div>
      </Card>

      {/* Investments List */}
      {filteredInvestments.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredInvestments.map((investment) => {
            const progress = calculateProgress(investment.createdAt, investment.duration_days)
            const remainingDays = getRemainingDays(investment.createdAt, investment.duration_days)

            return (
              <Card key={investment.id} className="hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{investment.plan_name || 'Investment Plan'}</h3>
                    <p className="text-sm text-gray-600">
                      Started: {new Date(investment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    investment.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : investment.status === 'completed'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {investment.status}
                  </span>
                </div>

                {/* Investment Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Investment Amount</p>
                    <p className="text-base sm:text-lg font-bold text-gray-800">
                      {formatCurrencyPK(investment.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Profit Earned</p>
                    <p className="text-base sm:text-lg font-bold text-green-600">
                      {formatCurrencyPK(investment.profit_earned || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Profit Rate</p>
                    <p className="text-base sm:text-lg font-bold text-blue-600">
                      {investment.profit_percentage}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Duration</p>
                    <p className="text-base sm:text-lg font-bold text-purple-600">
                      {investment.duration_days} Days
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {investment.status === 'active' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span>Progress</span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {remainingDays} days remaining
                    </p>
                  </div>
                )}

                {/* Expected Return */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Expected Total Return</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrencyPK(investment.amount + (investment.expected_profit || 0))}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <FiTrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Investments Found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You haven't made any investments yet"
                : `No ${filter} investments found`
              }
            </p>
            <a
              href="/user/investments"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Browse Investment Plans
            </a>
          </div>
        </Card>
      )}
      </div>
    </PageOverlay>
  )
}
