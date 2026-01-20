'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import toast from 'react-hot-toast'
import PageOverlay from '@/components/ui/PageOverlay'

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    referralCode: '',
    createdAt: '',
    wallet_balance: 0,
    referral_earnings: 0,
    total_invested: 0,
    total_withdrawn: 0,
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true) // optional: show loading state on initial fetch

  // Function to fetch profile - we'll call it multiple times
  const fetchProfile = async () => {
    setFetching(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please log in again')
        return
      }

      const res = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store', // Important: prevent caching stale data
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data.user || {}) // make sure data.user exists
      } else if (res.status === 401) {
        toast.error('Session expired. Please log in again.')
        localStorage.removeItem('token')
        // Optionally redirect to login
      } else {
        toast.error('Failed to load profile')
      }
    } catch (error) {
      console.error(error)
      toast.error('Network error. Please try again.')
    } finally {
      setFetching(false)
    }
  }

  // Fetch on mount
  useEffect(() => {
    fetchProfile()
  }, [])

  const handlePasswordChange = async (e) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Password changed successfully!')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })

        // CRITICAL FIX: Refetch profile to get updated data in real-time
        await fetchProfile()
      } else {
        toast.error(data.error || 'Failed to change password')
      }
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageOverlay pageName="profile">
      <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account settings</p>
      </div>

      {fetching ? (
        <div className="text-center py-10">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-6">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                <p className="text-lg font-semibold text-gray-800">{user.name || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                <p className="text-lg font-semibold text-gray-800">{user.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Referral Code</label>
                <p className="text-lg font-semibold text-blue-600">{user.referralCode}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Member Since</label>
                <p className="text-lg font-semibold text-gray-800">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </p>
              </div>

              {/* Referred By Information */}
              {user.referredBy && (
                <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Referred By</label>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-600">Name</p>
                      <p className="text-sm font-semibold text-gray-900">{user.referredBy.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Email</p>
                      <p className="text-sm font-semibold text-gray-900">{user.referredBy.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Referral Code</p>
                      <p className="text-sm font-bold text-blue-600 font-mono">{user.referredBy.referralCode}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Optional: Show wallet stats if available */}
              {user.wallet_balance !== undefined && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Wallet Balance</label>
                    <p className="text-lg font-semibold text-green-600">Rs. {Number(user.wallet_balance).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Referral Earnings</label>
                    <p className="text-lg font-semibold text-blue-600">Rs. {Number(user.referral_earnings || 0).toFixed(2)}</p>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-6">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter new password (min 6 chars)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
    </PageOverlay>
  )
}