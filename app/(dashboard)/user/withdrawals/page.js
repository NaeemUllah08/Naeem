'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import toast from 'react-hot-toast'
import { formatCurrencyPK } from '@/lib/currency'
import { FiX, FiDollarSign } from 'react-icons/fi'
import PageOverlay from '@/components/ui/PageOverlay'

export default function WithdrawalsPage() {
  const [balance, setBalance] = useState(0)
  const [emailEarnings, setEmailEarnings] = useState(0)
  const [otherEarnings, setOtherEarnings] = useState(0)
  const [withdrawals, setWithdrawals] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    withdrawalMethod: 'easypaisa',
    accountDetails: '',
    bankName: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')

      const [dashboardRes, withdrawalsRes] = await Promise.all([
        fetch('/api/user/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/user/withdrawals', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json()
        setBalance(dashboardData.stats.walletBalance)
        setEmailEarnings(dashboardData.stats.emailEarnings || 0)
        // Other earnings = deposits + referrals
        setOtherEarnings(
          (dashboardData.stats.depositBalance || 0) +
          (dashboardData.stats.referralEarnings || 0)
        )
      }

      if (withdrawalsRes.ok) {
        const withdrawalsData = await withdrawalsRes.json()
        console.log('Withdrawals data received:', withdrawalsData)
        console.log('Withdrawals array:', withdrawalsData.withdrawals)
        console.log('Withdrawals array length:', withdrawalsData.withdrawals?.length)
        setWithdrawals(withdrawalsData.withdrawals || [])
      } else {
        const errorData = await withdrawalsRes.json()
        console.error('Withdrawals fetch error:', errorData)
      }
    } catch (error) {
      console.error('Fetch data error:', error)
      toast.error('Failed to load data')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate minimum amount
    const amount = parseFloat(formData.amount)

    // If withdrawing from other earnings (not email), enforce Rs. 500 minimum
    if (amount > emailEarnings) {
      const amountFromOther = amount - emailEarnings
      if (amountFromOther < 500 && otherEarnings > 0) {
        toast.error('Minimum withdrawal from deposits/referrals is Rs. 500')
        return
      }
    }

    // Validate bank name if bank transfer is selected
    if (formData.withdrawalMethod === 'bank' && !formData.bankName.trim()) {
      toast.error('Please enter bank name')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        // Use the updated balances from the API response
        if (data.updatedBalances) {
          setBalance(data.updatedBalances.totalBalance)
          setEmailEarnings(data.updatedBalances.emailEarnings)
          setOtherEarnings(data.updatedBalances.otherEarnings)
        }

        // Add to withdrawals list with pending status
        const newWithdrawal = {
          id: data.withdrawal?.id || Date.now(),
          amount: amount,
          withdrawalMethod: formData.withdrawalMethod === 'bank'
            ? `Bank Transfer - ${formData.bankName}`
            : formData.withdrawalMethod === 'easypaisa'
            ? 'Easypaisa'
            : 'JazzCash',
          status: 'pending',
          transactionId: null,
          createdAt: new Date().toISOString()
        }
        setWithdrawals(prev => [newWithdrawal, ...prev])

        toast.success('Withdrawal request submitted! Balance updated.')
        setShowForm(false)
        setFormData({ amount: '', withdrawalMethod: 'easypaisa', accountDetails: '', bankName: '' })
      } else {
        toast.error(data.error || 'Withdrawal failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageOverlay pageName="withdrawals">
      <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Withdrawals</h1>
        <p className="text-gray-600 mt-2">Request and track your withdrawals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-1">
          <div>
            <p className="text-gray-600 text-sm font-medium">Available Balance</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{formatCurrencyPK(balance)}</p>
            {emailEarnings > 0 && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-700">
                  Email Earnings: <span className="font-bold">{formatCurrencyPK(emailEarnings)}</span>
                  <span className="block text-green-600 mt-1">(No minimum withdrawal)</span>
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Request Withdrawal
          </button>
        </Card>
      </div>

      {/* Withdrawal Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all animate-modalPop max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-2xl flex items-center justify-between sticky top-0">
              <div>
                <h2 className="text-xl font-bold text-white">Withdrawal Request</h2>
                <p className="text-sm text-blue-100">Enter withdrawal details</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <FiDollarSign className="flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Available: {formatCurrencyPK(balance)}</p>
                    {emailEarnings > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        Email earnings ({formatCurrencyPK(emailEarnings)}) - No minimum!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Amount (PKR) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  min="1"
                  max={balance}
                  step="0.01"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter amount"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {emailEarnings > 0
                    ? `Tip: Email earnings have no minimum. Other earnings require Rs. 500 minimum.`
                    : 'Minimum: Rs. 500'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method *</label>
                <select
                  value={formData.withdrawalMethod}
                  onChange={(e) => setFormData({ ...formData, withdrawalMethod: e.target.value, bankName: '' })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="easypaisa">Easypaisa</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              {formData.withdrawalMethod === 'bank' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Bank Name *</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter bank name (e.g., HBL, UBL, Meezan)"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Account Details *</label>
                <textarea
                  value={formData.accountDetails}
                  onChange={(e) => setFormData({ ...formData, accountDetails: e.target.value })}
                  required
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder={
                    formData.withdrawalMethod === 'bank'
                      ? 'Enter account number and account title'
                      : 'Enter mobile number and account title'
                  }
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <span className="font-semibold">Note:</span> Your withdrawal will be processed within 24-48 hours. The amount will be deducted from your balance immediately.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    'Submit Request'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Withdrawal History</h2>
        <Table headers={['Date', 'Amount', 'Method', 'Status', 'Transaction ID']}>
          {withdrawals.length > 0 ? (
            withdrawals.map((withdrawal) => (
              <tr key={withdrawal.id}>
                <td className="px-6 py-4 text-sm text-gray-800">
                  {new Date(withdrawal.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                  {formatCurrencyPK(withdrawal.amount)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{withdrawal.withdrawalMethod}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    withdrawal.status === 'approved' ? 'bg-green-100 text-green-700' :
                    withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {withdrawal.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {withdrawal.transactionId || 'Pending'}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                No withdrawals yet
              </td>
            </tr>
          )}
        </Table>
      </Card>
      </div>
    </PageOverlay>
  )
}
