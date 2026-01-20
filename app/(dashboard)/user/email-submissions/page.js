'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  FiMail,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiSend,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiPlus,
  FiCalendar,
  FiFilter,
  FiX
} from 'react-icons/fi'
import PageOverlay from '@/components/ui/PageOverlay'

export default function EmailSubmissionsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [emailAddresses, setEmailAddresses] = useState([''])

  // Data state
  const [currentPrice, setCurrentPrice] = useState(null)
  const [gmailPassword, setGmailPassword] = useState('')
  const [statistics, setStatistics] = useState(null)
  const [submissions, setSubmissions] = useState([])

  // UI state
  const [activeTab, setActiveTab] = useState('all') // all, pending, approved, rejected
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (!token || !userStr) {
      toast.error('Please log in to continue')
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    if (user.isAdmin) {
      toast.error('This page is for regular users only')
      router.push('/admin')
      return
    }

    setIsAuthenticated(true)
    await fetchData()
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')

      // Fetch current price and gmail password
      const priceRes = await fetch('/api/user/email-submissions?action=settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const priceData = await priceRes.json()
      setCurrentPrice(priceData.settings?.price_per_email || 0)
      setGmailPassword(priceData.settings?.gmail_password || '')

      // Fetch statistics
      const statsRes = await fetch('/api/user/email-submissions?action=stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const statsData = await statsRes.json()
      setStatistics(statsData.stats || {})

      // Fetch submissions
      const submissionsRes = await fetch('/api/user/email-submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const submissionsData = await submissionsRes.json()
      setSubmissions(submissionsData.submissions || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const addEmailField = () => {
    setEmailAddresses([...emailAddresses, ''])
  }

  const removeEmailField = (index) => {
    if (emailAddresses.length > 1) {
      const newEmailAddresses = emailAddresses.filter((_, i) => i !== index)
      setEmailAddresses(newEmailAddresses)
    }
  }

  const updateEmailAddress = (index, value) => {
    const newEmailAddresses = [...emailAddresses]
    newEmailAddresses[index] = value
    setEmailAddresses(newEmailAddresses)
  }

  const handleSubmitEmails = async (e) => {
    e.preventDefault()

    // Filter out empty email addresses
    const validEmails = emailAddresses.filter(email => email.trim() !== '')

    if (validEmails.length === 0) {
      toast.error('Please enter at least one email address')
      return
    }

    // Check for duplicates in the input
    const uniqueEmails = [...new Set(validEmails)]
    if (uniqueEmails.length !== validEmails.length) {
      toast.error('You have entered duplicate email addresses')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = uniqueEmails.filter(email => !emailRegex.test(email))
    if (invalidEmails.length > 0) {
      toast.error('Some email addresses are invalid')
      return
    }

    setSubmitting(true)
    let successCount = 0
    let failCount = 0
    const errors = []

    try {
      const token = localStorage.getItem('token')

      for (const emailAddress of uniqueEmails) {
        try {
          const res = await fetch('/api/user/email-submissions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              emailAddress
            })
          })

          const data = await res.json()

          if (res.ok) {
            successCount++
          } else {
            failCount++
            errors.push(`${emailAddress}: ${data.error}`)
          }
        } catch (error) {
          failCount++
          errors.push(`${emailAddress}: ${error.message}`)
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} email(s) submitted successfully!`)
        setEmailAddresses([''])
        await fetchData()
      }

      if (failCount > 0) {
        errors.forEach(error => toast.error(error, { duration: 5000 }))
      }

    } catch (error) {
      console.error('Submit error:', error)
      toast.error('An error occurred while submitting emails')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSubmission = async (submissionId) => {
    if (!confirm('Are you sure you want to delete this submission?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/user/email-submissions?submissionId=${submissionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete submission')
      }

      toast.success('Submission deleted successfully')
      await fetchData()

    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error.message)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: FiClock,
        label: 'Pending'
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: FiCheckCircle,
        label: 'Approved'
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: FiXCircle,
        label: 'Rejected'
      }
    }

    const badge = badges[status] || badges.pending
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon size={14} />
        {badge.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredSubmissions = submissions.filter(sub => {
    // Filter by status
    if (activeTab !== 'all' && sub.status !== activeTab) return false

    // Filter by date range
    if (startDate || endDate) {
      const submissionDate = new Date(sub.created_at)

      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        if (submissionDate < start) return false
      }

      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        if (submissionDate > end) return false
      }
    }

    return true
  })

  const clearDateFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <PageOverlay pageName="emailSubmissions">
      <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Gmail Accounts Service</h1>
        <p className="text-gray-600">Submit Gmail accounts and earn money for each approved submission</p>
      </div>

      {/* Current Price Banner */}
      {currentPrice !== null && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg mb-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90 mb-1">Current Price Per Email</p>
              <p className="text-2xl font-bold">Rs. {currentPrice.toFixed(2)}</p>
            </div>
            <FiDollarSign size={32} className="opacity-50" />
          </div>
        </div>
      )}

      {/* Gmail Password Display */}
      {gmailPassword && (
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg mb-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FiEye size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs opacity-90 mb-1">Gmail Account Password (For Monitoring)</p>
              <p className="text-xl font-bold font-mono tracking-wider">{gmailPassword}</p>
              <p className="text-xs opacity-75 mt-1">This password is used by admin to monitor email submissions</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs mb-1">Total Submitted</p>
                <p className="text-2xl font-bold text-gray-800">{statistics.total_submitted || 0}</p>
              </div>
              <FiMail size={24} className="text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs mb-1">Approved</p>
                <p className="text-2xl font-bold text-green-600">{statistics.approved_count || 0}</p>
              </div>
              <FiCheckCircle size={24} className="text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.pending_count || 0}</p>
              </div>
              <FiClock size={24} className="text-yellow-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-purple-600">Rs. {(statistics.total_earned || 0).toFixed(2)}</p>
              </div>
              <FiDollarSign size={24} className="text-purple-500 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Submission Form */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Submit Gmail Accounts</h2>
        <form onSubmit={handleSubmitEmails} className="space-y-3">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              Gmail Addresses (No password required)
            </label>

            {emailAddresses.map((email, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => updateEmailAddress(index, e.target.value)}
                  placeholder={`Gmail ${index + 1}: example${index + 1}@gmail.com`}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {emailAddresses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmailField(index)}
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                    title="Remove this email"
                  >
                    <FiTrash2 size={16} />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addEmailField}
              className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border-2 border-dashed border-gray-300"
            >
              <FiPlus size={16} />
              Add Another Gmail
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
            <p className="text-xs text-blue-800 flex items-start gap-2">
              <FiAlertCircle className="flex-shrink-0 mt-0.5" size={14} />
              <span>
                <strong>Note:</strong> You only need to enter Gmail addresses. Password is not required for submission.
                {currentPrice && (
                  <> You will earn <strong>Rs. {currentPrice.toFixed(2)}</strong> per email if approved by admin.</>
                )}
              </span>
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2.5 text-sm rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting {emailAddresses.filter(e => e.trim()).length} Email(s)...
              </>
            ) : (
              <>
                <FiSend size={18} />
                Submit {emailAddresses.filter(e => e.trim()).length} Gmail Account(s)
              </>
            )}
          </button>
        </form>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap gap-2 p-4">
            {[
              { key: 'all', label: 'All Submissions', count: submissions.length },
              { key: 'pending', label: 'Pending', count: submissions.filter(s => s.status === 'pending').length },
              { key: 'approved', label: 'Approved', count: submissions.filter(s => s.status === 'approved').length },
              { key: 'rejected', label: 'Rejected', count: submissions.filter(s => s.status === 'rejected').length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Date Filters */}
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiFilter className="text-gray-600" size={18} />
            <h3 className="font-semibold text-gray-800 text-sm">Filter by Date</h3>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>
            {(startDate || endDate) && (
              <button
                onClick={clearDateFilters}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <FiX size={16} />
                Clear Filters
              </button>
            )}
          </div>
          {filteredSubmissions.length !== submissions.length && (
            <p className="text-xs text-gray-600 mt-2">
              Showing {filteredSubmissions.length} of {submissions.length} submissions
            </p>
          )}
        </div>

        {/* Submissions */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FiMail size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No submissions found</p>
              <p className="text-sm mt-2">Submit your first Gmail account above to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-semibold text-gray-800">
                          {submission.email_address}
                        </h3>
                        {getStatusBadge(submission.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Submitted: {formatDate(submission.created_at)}</span>
                        <span className="font-semibold text-gray-800">
                          Price: Rs. {(submission.price_at_submission || 0).toFixed(2)}
                        </span>
                        {submission.approved_at && (
                          <span className="text-green-600">
                            Approved: {formatDate(submission.approved_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    {submission.status === 'pending' && (
                      <button
                        onClick={() => handleDeleteSubmission(submission.id)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-100 rounded-lg transition-colors ml-2"
                        title="Delete submission"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>

                  {/* Rejection Details */}
                  {submission.status === 'rejected' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <FiXCircle className="text-red-600 mt-0.5 flex-shrink-0" size={16} />
                        <div className="flex-1">
                          <p className="font-semibold text-red-800 text-sm mb-1">Rejection Reason:</p>
                          <p className="text-red-700 text-sm">
                            {submission.rejection_reason || 'No reason provided'}
                          </p>
                          {submission.attached_proof && (
                            <a
                              href={submission.attached_proof}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline mt-2"
                            >
                              View Proof
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </PageOverlay>
  )
}
