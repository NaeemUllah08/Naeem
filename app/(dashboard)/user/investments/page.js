'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { formatCurrencyPK } from '@/lib/currency'
import PageOverlay from '@/components/ui/PageOverlay'

export default function InvestmentsPage() {
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [amount, setAmount] = useState('')
  const [durationDays, setDurationDays] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/user/investment-plans', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans)
      }
    } catch (error) {
      toast.error('Failed to load plans')
    }
  }

  const handleInvest = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/user/invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          planId: selectedPlan.id,
          amount: parseFloat(amount),
          durationDays: parseInt(durationDays),
        }),
      })
      if (res.ok) {
        toast.success('Investment successful!')
        setSelectedPlan(null)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to invest')
      }
    } catch (error) {
      toast.error('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageOverlay pageName="investments">
      <div className="w-full max-w-7xl mx-auto">

      {/* Simple Minimalist Header */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Investment Plans</h1>
        <div className="h-1 w-12 bg-blue-600 mx-auto mt-2 rounded-full"></div>
      </div>

      {/* Grid - Clean Oval Pods */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white border border-gray-100 rounded-3xl sm:rounded-[45px] shadow-sm hover:shadow-xl transition-all duration-300 p-5 sm:p-7 flex flex-col items-center border-t-4 sm:border-t-8 border-t-blue-600">

            <div className="w-full text-center">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-800 mb-1">{plan.name}</h3>
              <div className="inline-block px-3 sm:px-4 py-1 bg-blue-50 rounded-full mb-4 sm:mb-6">
                <span className="text-blue-600 text-xs font-bold">{plan.profit_percentage}% Profit</span>
              </div>

              {/* Stats List */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex justify-between items-center text-[11px] sm:text-[12px] px-2">
                  <span className="text-gray-400 font-medium">Limits</span>
                  <span className="text-gray-800 font-bold">{formatCurrencyPK(plan.min_amount)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] sm:text-[12px] px-2">
                  <span className="text-gray-400 font-medium">Duration</span>
                  <span className="text-gray-800 font-bold">{plan.min_duration_days} Days</span>
                </div>
                <div className="flex justify-between items-center text-[11px] sm:text-[12px] px-2">
                  <span className="text-gray-400 font-medium">Referral</span>
                  <span className="text-green-600 font-bold">{plan.referral_commission_percentage}%</span>
                </div>
              </div>

              {/* Keep/Company Split Ovals */}
              <div className="flex gap-2 mb-6 sm:mb-8">
                <div className="flex-1 py-2 bg-gray-50 rounded-full">
                  <p className="text-[9px] text-gray-400 uppercase font-bold">Company</p>
                  <p className="text-xs font-black text-gray-700">{plan.company_percentage}%</p>
                </div>
                <div className="flex-1 py-2 bg-blue-600 rounded-full">
                  <p className="text-[9px] text-white/70 uppercase font-bold">You Keep</p>
                  <p className="text-xs font-black text-white">{plan.user_keeps_percentage}%</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedPlan(plan)
                setAmount(plan.min_amount)
                setDurationDays(plan.min_duration_days)
              }}
              className="w-full py-3 sm:py-4 bg-gray-900 hover:bg-blue-600 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-full transition-all active:scale-95 shadow-lg shadow-gray-200"
            >
              Invest
            </button>
          </div>
        ))}
      </div>

      {/* Simplified Oval Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white max-w-sm w-full p-6 sm:p-10 rounded-3xl sm:rounded-[60px] shadow-2xl animate-in zoom-in duration-200">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-black text-gray-800">{selectedPlan.name}</h2>
              <p className="text-xs text-gray-400 mt-1">Confirm Investment Details</p>
            </div>

            <form onSubmit={handleInvest} className="space-y-4 sm:space-y-6">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={selectedPlan.min_amount}
                max={selectedPlan.max_amount}
                className="w-full p-3 sm:p-4 bg-gray-50 border-none rounded-full focus:ring-2 focus:ring-blue-600 outline-none font-bold text-center text-sm sm:text-base"
                placeholder="Enter Amount"
                required
              />

              <input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                min={selectedPlan.min_duration_days}
                max={selectedPlan.max_duration_days}
                className="w-full p-3 sm:p-4 bg-gray-50 border-none rounded-full focus:ring-2 focus:ring-blue-600 outline-none font-bold text-center text-sm sm:text-base"
                placeholder="Enter Days"
                required
              />

              <div className="py-3 sm:py-4 border-t border-b border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Estimated Profit</p>
                <p className="text-xl sm:text-2xl font-black text-blue-600">
                  {formatCurrencyPK((amount * (selectedPlan.user_keeps_percentage / 100)) * (selectedPlan.profit_percentage / 100))}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-xl transition-all active:scale-95 text-sm sm:text-base"
                >
                  {loading ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </PageOverlay>
  )
}