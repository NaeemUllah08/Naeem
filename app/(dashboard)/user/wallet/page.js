'use client'

import { useState, useEffect } from 'react'
import { FiDollarSign } from 'react-icons/fi'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import toast from 'react-hot-toast'
import { formatCurrencyPK } from '@/lib/currency'
import PageOverlay from '@/components/ui/PageOverlay'

export default function WalletPage() {
  const [balance, setBalance] = useState(0)
  const [deposits, setDeposits] = useState([])
  const [showDepositForm, setShowDepositForm] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    transactionId: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/user/wallet', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setBalance(data.balance)
        setDeposits(data.deposits)
      }
    } catch (error) {
      toast.error('Failed to load wallet data')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/user/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success('Deposit request submitted! Waiting for approval.')
        setShowDepositForm(false)
        setFormData({ amount: '', paymentMethod: 'bank_transfer', transactionId: '' })
        fetchWalletData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Deposit failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageOverlay pageName="deposits">
      <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Deposit History</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">View your deposits and request new deposits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-green-100 p-3 sm:p-4 rounded-lg flex-shrink-0">
              <FiDollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Current Balance</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 truncate">{formatCurrencyPK(balance)}</p>
            </div>
          </div>
          <button
            onClick={() => setShowDepositForm(!showDepositForm)}
            className="w-full mt-4 sm:mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition text-sm sm:text-base"
          >
            {showDepositForm ? 'Cancel' : 'Request Deposit'}
          </button>
        </Card>

        {showDepositForm && (
          <Card className="lg:col-span-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Deposit Funds</h2>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Amount (PKR)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  min="500"
                  step="0.01"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter amount in PKR"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="bank_transfer">Bank Transfer (Easy Paisa / Jazz Cash / Bank)</option>
                  <option value="crypto">Cryptocurrency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Transaction ID (Optional)</label>
                <input
                  type="text"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter transaction ID"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Deposit'}
              </button>
            </form>
          </Card>
        )}
      </div>

      <Card>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Deposit History</h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <Table headers={['Date', 'Amount', 'Method', 'Transaction ID', 'Status']}>
            {deposits.length > 0 ? (
              deposits.map((deposit) => (
                <tr key={deposit.id}>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-800 whitespace-nowrap">
                    {new Date(deposit.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-800 whitespace-nowrap">
                    {formatCurrencyPK(deposit.amount)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden md:table-cell">{deposit.paymentMethod}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden lg:table-cell">{deposit.transactionId || 'N/A'}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      deposit.status === 'approved' ? 'bg-green-100 text-green-700' :
                      deposit.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {deposit.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-3 sm:px-6 py-6 sm:py-8 text-center text-gray-500 text-sm">
                  No deposits yet
                </td>
              </tr>
            )}
          </Table>
        </div>
      </Card>
      </div>
    </PageOverlay>
  )
}
