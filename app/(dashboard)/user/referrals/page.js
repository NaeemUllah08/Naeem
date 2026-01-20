'use client'

import { useState, useEffect } from 'react'
import { FiCopy, FiUsers, FiShare2, FiMail, FiMessageSquare, FiGift } from 'react-icons/fi'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import toast from 'react-hot-toast'
import { formatCurrencyPK } from '@/lib/currency'
import PageOverlay from '@/components/ui/PageOverlay'

export default function ReferralsPage() {
  const [referralCode, setReferralCode] = useState('')
  const [referrals, setReferrals] = useState([])
  const [referredBy, setReferredBy] = useState(null)
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
  })

  useEffect(() => {
    fetchReferralData()
  }, [])

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/user/referrals', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setReferralCode(data.referralCode)
        setReferrals(data.referrals)
        setStats(data.stats)
        setReferredBy(data.referredBy)
      }
    } catch (error) {
      toast.error('Failed to load referral data')
    }
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`
    navigator.clipboard.writeText(link)
    toast.success('Referral link copied!')
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode)
    toast.success('Referral code copied!')
  }

  const shareViaWhatsApp = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`
    const text = `Join me on this amazing investment platform! Use my referral code: ${referralCode} or click this link: ${link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const shareViaEmail = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`
    const subject = 'Join the Investment Platform!'
    const body = `Hi,\n\nI'd like to invite you to join this amazing investment platform.\n\nUse my referral code: ${referralCode}\nOr click this link: ${link}\n\nLooking forward to seeing you there!`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const shareViaSMS = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`
    const text = `Join this investment platform using my code: ${referralCode} or link: ${link}`
    window.location.href = `sms:?body=${encodeURIComponent(text)}`
  }

  const generateQRCode = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`
    // Using Google Charts API for QR code
    return `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(link)}`
  }

  return (
    <PageOverlay pageName="referrals">
      <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Referrals</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Invite friends and earn rewards</p>
      </div>

      {/* Referred By Section - Simple Upline Data */}
      {referredBy && (
        <Card className="mb-6 sm:mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500 p-3 rounded-full flex-shrink-0">
              <FiUsers className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Your Upline</h3>

              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Name</p>
                    <p className="text-sm font-semibold text-gray-900">{referredBy.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Referral Code</p>
                    <p className="text-sm font-bold text-blue-600 font-mono">{referredBy.referralCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Join Date</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(referredBy.memberSince).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Your Referral Code</h2>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6 rounded-lg text-white mb-4">
            <p className="text-xs sm:text-sm mb-2">Your unique referral code</p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl sm:text-3xl font-bold truncate">{referralCode}</p>
              <button
                onClick={copyReferralCode}
                className="bg-white text-blue-600 p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition flex-shrink-0"
                aria-label="Copy code"
              >
                <FiCopy className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Referral Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-lg bg-gray-50 truncate"
              />
              <button
                onClick={copyReferralLink}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition flex-shrink-0"
                aria-label="Copy link"
              >
                <FiCopy className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="mb-4">
            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Share via</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={shareViaWhatsApp}
                className="flex flex-col items-center gap-2 p-3 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
              >
                <FiMessageSquare className="w-5 h-5" />
                <span className="text-xs font-semibold">WhatsApp</span>
              </button>
              <button
                onClick={shareViaEmail}
                className="flex flex-col items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
              >
                <FiMail className="w-5 h-5" />
                <span className="text-xs font-semibold">Email</span>
              </button>
              <button
                onClick={shareViaSMS}
                className="flex flex-col items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors"
              >
                <FiShare2 className="w-5 h-5" />
                <span className="text-xs font-semibold">SMS</span>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 sm:p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <FiGift className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>How it works:</strong> Share your referral link with friends. When they sign up and make their first investment, you'll earn a bonus!
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Referral Stats</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="bg-green-500 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <FiUsers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Referrals</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.totalReferrals}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="bg-purple-500 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <FiGift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Earnings</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{formatCurrencyPK(stats.totalEarnings)}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Your Referrals History</h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <Table headers={['Name', 'Join Date', 'Status', 'Investment Status', 'Total Invested']}>
            {referrals.length > 0 ? (
              referrals.map((referral) => (
                <tr key={referral.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-800 whitespace-nowrap">
                    {referral.name}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                    {new Date(referral.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        referral.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : referral.status === 'Blocked'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {referral.status}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        referral.investmentStatus === 'Invested'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {referral.investmentStatus}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-800 whitespace-nowrap">
                    {formatCurrencyPK(referral.totalInvested || 0)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-3 sm:px-6 py-6 sm:py-8 text-center text-gray-500 text-sm">
                  No referrals yet. Start sharing your link!
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
