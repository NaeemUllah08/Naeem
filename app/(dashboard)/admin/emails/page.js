'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { FiMail, FiUser, FiDollarSign, FiCheckCircle, FiXCircle, FiClock, FiCopy, FiSettings, FiEye, FiEyeOff } from 'react-icons/fi'

export default function AdminEmailsPage() {
  const [users, setUsers] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Settings modal
  const [showSettings, setShowSettings] = useState(false)
  const [newPrice, setNewPrice] = useState('')
  const [gmailPassword, setGmailPassword] = useState('')
  const [showGmailPassword, setShowGmailPassword] = useState(false)

  // Approval modal
  const [approvingSubmission, setApprovingSubmission] = useState(null)
  const [isApproving, setIsApproving] = useState(false)

  // Rejection modal
  const [rejectingSubmission, setRejectingSubmission] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [attachedProof, setAttachedProof] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)

  // Change status modal
  const [changingStatusSubmission, setChangingStatusSubmission] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [isChangingStatus, setIsChangingStatus] = useState(false)

  // Filter states
  const [userFilter, setUserFilter] = useState('all') // all, pending, approved, rejected
  const [submissionFilter, setSubmissionFilter] = useState('all') // all, pending, approved, rejected
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchSettings()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      fetchUserSubmissions(selectedUser.id)
    }
  }, [selectedUser])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/email-service?action=settings', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
        setNewPrice(data.settings?.price_per_email || '')
        setGmailPassword(data.settings?.gmail_password || '')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchUsers = async () => {
    setFetching(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/email-service', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      } else {
        toast.error('Failed to load users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setFetching(false)
    }
  }

  const fetchUserSubmissions = async (userId) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/email-service?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setSubmissions(data.submissions || [])
      } else {
        // Don't show error toast, just set empty submissions
        setSubmissions([])
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
      // Don't show error toast, just set empty submissions
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePrice = async () => {
    if (!newPrice || parseFloat(newPrice) <= 0) {
      toast.error('Please enter a valid price')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/email-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update_settings',
          pricePerEmail: newPrice,
          gmailPassword: gmailPassword
        }),
      })

      if (res.ok) {
        toast.success('Price updated successfully')
        setShowSettings(false)
        fetchSettings()
        fetchUsers()
      } else {
        toast.error('Failed to update price')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveSubmission = async () => {
    if (!approvingSubmission) return

    setIsApproving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/email-service', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          submissionId: approvingSubmission.id,
          status: 'approved'
        }),
      })

      if (res.ok) {
        // Update local state immediately (real-time update)
        setSubmissions(prevSubmissions =>
          prevSubmissions.map(sub =>
            sub.id === approvingSubmission.id
              ? { ...sub, status: 'approved', approved_at: new Date().toISOString() }
              : sub
          )
        )

        // Update users list stats
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === selectedUser.id
              ? {
                  ...user,
                  approved_count: (user.approved_count || 0) + 1,
                  pending_count: Math.max((user.pending_count || 0) - 1, 0),
                  total_earned: (parseFloat(user.total_earned || 0) + parseFloat(approvingSubmission.price_at_submission || 0)).toFixed(2)
                }
              : user
          )
        )

        // Update selected user stats
        setSelectedUser(prev => ({
          ...prev,
          approved_count: (prev.approved_count || 0) + 1,
          pending_count: Math.max((prev.pending_count || 0) - 1, 0),
          total_earned: (parseFloat(prev.total_earned || 0) + parseFloat(approvingSubmission.price_at_submission || 0)).toFixed(2)
        }))

        // Close modal
        setApprovingSubmission(null)

        // Show success toast
        toast.success('Email approved successfully')
      } else {
        toast.error('Failed to approve email')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsApproving(false)
    }
  }

  const handleRejectSubmission = async () => {
    if (!rejectingSubmission) return

    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setIsRejecting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/email-service', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          submissionId: rejectingSubmission.id,
          status: 'rejected',
          rejectionReason,
          attachedProof
        }),
      })

      if (res.ok) {
        // Update local state immediately (real-time update)
        setSubmissions(prevSubmissions =>
          prevSubmissions.map(sub =>
            sub.id === rejectingSubmission.id
              ? {
                  ...sub,
                  status: 'rejected',
                  rejection_reason: rejectionReason,
                  attached_proof: attachedProof,
                  updated_at: new Date().toISOString()
                }
              : sub
          )
        )

        // Update users list stats
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === selectedUser.id
              ? {
                  ...user,
                  rejected_count: (user.rejected_count || 0) + 1,
                  pending_count: Math.max((user.pending_count || 0) - 1, 0)
                }
              : user
          )
        )

        // Update selected user stats
        setSelectedUser(prev => ({
          ...prev,
          rejected_count: (prev.rejected_count || 0) + 1,
          pending_count: Math.max((prev.pending_count || 0) - 1, 0)
        }))

        // Close modal and reset form
        setRejectingSubmission(null)
        setRejectionReason('')
        setAttachedProof('')

        // Show success toast
        toast.success('Email rejected successfully')
      } else {
        toast.error('Failed to reject email')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsRejecting(false)
    }
  }

  const handleChangeStatus = async () => {
    if (!changingStatusSubmission || !newStatus) return

    setIsChangingStatus(true)
    try {
      const token = localStorage.getItem('token')

      // Prepare the request body based on new status
      const body = {
        submissionId: changingStatusSubmission.id,
        status: newStatus
      }

      // If changing to rejected from approved/pending, we need rejection reason
      if (newStatus === 'rejected') {
        body.rejectionReason = 'Status changed by admin'
      }

      const res = await fetch('/api/admin/email-service', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        // Calculate the stat changes
        const oldStatus = changingStatusSubmission.status
        const priceValue = parseFloat(changingStatusSubmission.price_at_submission || 0)

        // Update local state immediately (real-time update)
        setSubmissions(prevSubmissions =>
          prevSubmissions.map(sub =>
            sub.id === changingStatusSubmission.id
              ? {
                  ...sub,
                  status: newStatus,
                  approved_at: newStatus === 'approved' ? new Date().toISOString() : sub.approved_at,
                  rejection_reason: newStatus === 'rejected' ? 'Status changed by admin' : null,
                  updated_at: new Date().toISOString()
                }
              : sub
          )
        )

        // Update users list stats
        setUsers(prevUsers =>
          prevUsers.map(user => {
            if (user.id !== selectedUser.id) return user

            let updatedUser = { ...user }

            // Decrease old status count
            if (oldStatus === 'approved') {
              updatedUser.approved_count = Math.max((updatedUser.approved_count || 0) - 1, 0)
              updatedUser.total_earned = (parseFloat(updatedUser.total_earned || 0) - priceValue).toFixed(2)
            } else if (oldStatus === 'pending') {
              updatedUser.pending_count = Math.max((updatedUser.pending_count || 0) - 1, 0)
            } else if (oldStatus === 'rejected') {
              updatedUser.rejected_count = Math.max((updatedUser.rejected_count || 0) - 1, 0)
            }

            // Increase new status count
            if (newStatus === 'approved') {
              updatedUser.approved_count = (updatedUser.approved_count || 0) + 1
              updatedUser.total_earned = (parseFloat(updatedUser.total_earned || 0) + priceValue).toFixed(2)
            } else if (newStatus === 'pending') {
              updatedUser.pending_count = (updatedUser.pending_count || 0) + 1
            } else if (newStatus === 'rejected') {
              updatedUser.rejected_count = (updatedUser.rejected_count || 0) + 1
            }

            return updatedUser
          })
        )

        // Update selected user stats
        setSelectedUser(prev => {
          let updated = { ...prev }

          // Decrease old status count
          if (oldStatus === 'approved') {
            updated.approved_count = Math.max((updated.approved_count || 0) - 1, 0)
            updated.total_earned = (parseFloat(updated.total_earned || 0) - priceValue).toFixed(2)
          } else if (oldStatus === 'pending') {
            updated.pending_count = Math.max((updated.pending_count || 0) - 1, 0)
          } else if (oldStatus === 'rejected') {
            updated.rejected_count = Math.max((updated.rejected_count || 0) - 1, 0)
          }

          // Increase new status count
          if (newStatus === 'approved') {
            updated.approved_count = (updated.approved_count || 0) + 1
            updated.total_earned = (parseFloat(updated.total_earned || 0) + priceValue).toFixed(2)
          } else if (newStatus === 'pending') {
            updated.pending_count = (updated.pending_count || 0) + 1
          } else if (newStatus === 'rejected') {
            updated.rejected_count = (updated.rejected_count || 0) + 1
          }

          return updated
        })

        // Close modal and reset
        setChangingStatusSubmission(null)
        setNewStatus('')

        // Show success toast
        toast.success(`Status changed to ${newStatus} successfully`)
      } else {
        toast.error('Failed to change status')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsChangingStatus(false)
    }
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: FiClock, label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', icon: FiCheckCircle, label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: FiXCircle, label: 'Rejected' }
    }

    const badge = badges[status] || badges.pending
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    )
  }

  // Filter users based on selected filter
  const filteredUsers = users.filter(user => {
    if (userFilter === 'all') return true
    if (userFilter === 'pending') return user.pending_count > 0
    if (userFilter === 'approved') return user.approved_count > 0
    if (userFilter === 'rejected') return user.rejected_count > 0
    return true
  })

  // Filter submissions based on status and date range
  const filteredSubmissions = submissions.filter(sub => {
    // Status filter
    if (submissionFilter !== 'all' && sub.status !== submissionFilter) {
      return false
    }

    // Date range filter
    if (startDate && new Date(sub.created_at) < new Date(startDate)) {
      return false
    }
    if (endDate) {
      const endOfDay = new Date(endDate)
      endOfDay.setHours(23, 59, 59, 999)
      if (new Date(sub.created_at) > endOfDay) {
        return false
      }
    }

    return true
  })

  const pendingSubmissions = filteredSubmissions.filter(s => s.status === 'pending')
  const approvedSubmissions = filteredSubmissions.filter(s => s.status === 'approved')
  const rejectedSubmissions = filteredSubmissions.filter(s => s.status === 'rejected')

  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Email Accounts Service</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage user email submissions and payments</p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-semibold w-full sm:w-auto"
        >
          <FiSettings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Current Price Banner */}
      {settings && (
        <Card className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <FiDollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Current Price Per Email</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">Rs. {settings.price_per_email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-blue-600 border border-blue-300 rounded-lg text-sm font-semibold transition w-full sm:w-auto"
              >
                Change Settings
              </button>
            </div>
            {settings.gmail_password && (
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Gmail Monitoring Password</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-gray-800 bg-gray-50 px-2 py-1 rounded">
                    {showGmailPassword ? settings.gmail_password : '••••••••'}
                  </code>
                  <button
                    onClick={() => setShowGmailPassword(!showGmailPassword)}
                    className="text-gray-600 hover:text-gray-800 p-1"
                  >
                    {showGmailPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(settings.gmail_password)
                      toast.success('Password copied to clipboard')
                    }}
                    className="text-gray-600 hover:text-gray-800 p-1"
                  >
                    <FiCopy size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Users List */}
        <div className="lg:col-span-1">
          <Card>
            <div className="mb-3">
              <h2 className="text-lg font-bold text-gray-800 mb-3">Users</h2>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setUserFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    userFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({users.length})
                </button>
                <button
                  onClick={() => setUserFilter('pending')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    userFilter === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Pending ({users.filter(u => u.pending_count > 0).length})
                </button>
                <button
                  onClick={() => setUserFilter('approved')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    userFilter === 'approved'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Approved ({users.filter(u => u.approved_count > 0).length})
                </button>
                <button
                  onClick={() => setUserFilter('rejected')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    userFilter === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Rejected ({users.filter(u => u.rejected_count > 0).length})
                </button>
              </div>
            </div>

            {fetching ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      selectedUser?.id === user.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">{user.name}</p>
                        <p className="text-xs text-gray-600 truncate">{user.email}</p>

                        <div className="mt-2 space-y-1">
                          {user.total_submitted > 0 && (
                            <>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">Total:</span>
                                <span className="font-semibold text-gray-800">{user.total_submitted}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-green-600">Approved:</span>
                                <span className="font-semibold text-green-600">{user.approved_count}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-yellow-600">Pending:</span>
                                <span className="font-semibold text-yellow-600">{user.pending_count}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-red-600">Rejected:</span>
                                <span className="font-semibold text-red-600">{user.rejected_count || 0}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-blue-600">Earned:</span>
                                <span className="font-semibold text-blue-600">Rs. {user.total_earned}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredUsers.length === 0 && !fetching && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    {userFilter === 'all' ? 'No users found' : `No users with ${userFilter} submissions`}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Email Submissions */}
        <div className="lg:col-span-3">
          {selectedUser ? (
            <div className="space-y-4">
              {/* User Summary */}
              <Card>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg sm:text-2xl flex-shrink-0">
                      {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-xl font-bold text-gray-800 truncate">{selectedUser.name}</h2>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xl sm:text-2xl font-bold text-gray-800">{selectedUser.total_submitted}</p>
                      <p className="text-xs text-gray-600 mt-1">Total</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{selectedUser.approved_count}</p>
                      <p className="text-xs text-gray-600 mt-1">Approved</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-xl sm:text-2xl font-bold text-yellow-600">{selectedUser.pending_count}</p>
                      <p className="text-xs text-gray-600 mt-1">Pending</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-xl sm:text-2xl font-bold text-red-600">{selectedUser.rejected_count || 0}</p>
                      <p className="text-xs text-gray-600 mt-1">Rejected</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">Rs. {selectedUser.total_earned}</p>
                      <p className="text-xs text-gray-600 mt-1">Earned</p>
                    </div>
                  </div>
                </div>
              </Card>

              {loading ? (
                <Card>
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading submissions...</p>
                  </div>
                </Card>
              ) : (
                <>
                  {/* Submissions Filters */}
                  <Card>
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3">Filter Submissions</h3>

                    {/* Status Filters */}
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Status</p>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => setSubmissionFilter('all')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                            submissionFilter === 'all'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          All ({submissions.length})
                        </button>
                        <button
                          onClick={() => setSubmissionFilter('pending')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                            submissionFilter === 'pending'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Pending ({submissions.filter(s => s.status === 'pending').length})
                        </button>
                        <button
                          onClick={() => setSubmissionFilter('approved')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                            submissionFilter === 'approved'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Approved ({submissions.filter(s => s.status === 'approved').length})
                        </button>
                        <button
                          onClick={() => setSubmissionFilter('rejected')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                            submissionFilter === 'rejected'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Rejected ({submissions.filter(s => s.status === 'rejected').length})
                        </button>
                      </div>
                    </div>

                    {/* Date Range Filters */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">Date Range</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">From</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">To</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        {(startDate || endDate || submissionFilter !== 'all') && (
                          <div className="flex items-end">
                            <button
                              onClick={() => {
                                setStartDate('')
                                setEndDate('')
                                setSubmissionFilter('all')
                              }}
                              className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-md transition whitespace-nowrap"
                            >
                              Clear Filters
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Filter Results Summary */}
                    {(submissionFilter !== 'all' || startDate || endDate) && (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                          Showing <span className="font-bold">{filteredSubmissions.length}</span> of <span className="font-bold">{submissions.length}</span> submissions
                        </p>
                      </div>
                    )}
                  </Card>

                  {/* Pending Submissions */}
                  {pendingSubmissions.length > 0 && (
                    <Card>
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">
                        Pending Submissions ({pendingSubmissions.length})
                      </h3>
                      <div className="space-y-3">
                        {pendingSubmissions.map((sub) => (
                          <div key={sub.id} className="border-2 border-yellow-200 bg-yellow-50 rounded-lg p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <FiMail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                                  <p className="font-bold text-sm sm:text-base text-gray-800 break-all">{sub.email_address}</p>
                                  <button
                                    onClick={() => copyToClipboard(sub.email_address, 'Email')}
                                    className="p-1 hover:bg-white rounded transition flex-shrink-0"
                                  >
                                    <FiCopy className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                  Submitted: {new Date(sub.created_at).toLocaleString()}
                                </p>
                                <p className="text-xs text-blue-600 font-semibold mt-1">
                                  Value: Rs. {sub.price_at_submission}
                                </p>
                              </div>
                              {getStatusBadge(sub.status)}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => setApprovingSubmission(sub)}
                                className="flex-1 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition"
                              >
                                <FiCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectingSubmission(sub)}
                                className="flex-1 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition"
                              >
                                <FiXCircle className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Approved Submissions */}
                  {approvedSubmissions.length > 0 && (
                    <Card>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Approved Submissions ({approvedSubmissions.length})
                      </h3>
                      <div className="space-y-3">
                        {approvedSubmissions.map((sub) => (
                          <div key={sub.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FiMail className="w-5 h-5 text-gray-600" />
                                  <p className="font-bold text-gray-800">{sub.email_address}</p>
                                  <button
                                    onClick={() => copyToClipboard(sub.email_address, 'Email')}
                                    className="p-1 hover:bg-white rounded transition flex-shrink-0"
                                  >
                                    <FiCopy className="w-4 h-4 text-gray-600" />
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                  Approved: {new Date(sub.approved_at).toLocaleString()}
                                </p>
                                <p className="text-xs text-green-600 font-semibold mt-1">
                                  Paid: Rs. {sub.price_at_submission}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(sub.status)}
                                <button
                                  onClick={() => {
                                    setChangingStatusSubmission(sub)
                                    setNewStatus('pending')
                                  }}
                                  className="p-2 hover:bg-white rounded-lg transition flex-shrink-0"
                                  title="Change status"
                                >
                                  <FiClock className="w-4 h-4 text-gray-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Rejected Submissions */}
                  {rejectedSubmissions.length > 0 && (
                    <Card>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Rejected Submissions ({rejectedSubmissions.length})
                      </h3>
                      <div className="space-y-3">
                        {rejectedSubmissions.map((sub) => (
                          <div key={sub.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FiMail className="w-5 h-5 text-gray-600" />
                                  <p className="font-bold text-gray-800">{sub.email_address}</p>
                                  <button
                                    onClick={() => copyToClipboard(sub.email_address, 'Email')}
                                    className="p-1 hover:bg-white rounded transition flex-shrink-0"
                                  >
                                    <FiCopy className="w-4 h-4 text-gray-600" />
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                  Submitted: {new Date(sub.created_at).toLocaleString()}
                                </p>

                                {sub.rejection_reason && (
                                  <div className="bg-white border border-red-200 rounded p-2 mt-2">
                                    <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</p>
                                    <p className="text-xs text-gray-700">{sub.rejection_reason}</p>
                                  </div>
                                )}

                                {sub.attached_proof && (
                                  <div className="mt-2">
                                    <a
                                      href={sub.attached_proof}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline"
                                    >
                                      View Attached Proof
                                    </a>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(sub.status)}
                                <button
                                  onClick={() => {
                                    setChangingStatusSubmission(sub)
                                    setNewStatus('pending')
                                  }}
                                  className="p-2 hover:bg-white rounded-lg transition flex-shrink-0"
                                  title="Change status"
                                >
                                  <FiClock className="w-4 h-4 text-gray-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {submissions.length === 0 && (
                    <Card>
                      <div className="text-center py-12">
                        <FiMail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No email submissions from this user</p>
                      </div>
                    </Card>
                  )}

                  {submissions.length > 0 && filteredSubmissions.length === 0 && (
                    <Card>
                      <div className="text-center py-12">
                        <FiMail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No submissions match your filters</p>
                        <button
                          onClick={() => {
                            setStartDate('')
                            setEndDate('')
                            setSubmissionFilter('all')
                          }}
                          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>
          ) : (
            <Card>
              <div className="text-center py-16">
                <FiUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a User</h3>
                <p className="text-gray-500">Choose a user from the list to view their email submissions</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {approvingSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-modalPop">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Approve Email</h2>
                  <p className="text-sm text-green-100">Confirm approval action</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FiMail className="text-green-600" />
                  Email Address:
                </p>
                <p className="text-base font-bold text-gray-900 break-all">
                  {approvingSubmission.email_address}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">Payment Amount:</p>
                  <p className="text-lg font-bold text-blue-600">
                    Rs. {approvingSubmission.price_at_submission}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800 flex items-start gap-2">
                  <span className="font-semibold">Note:</span>
                  <span>This will mark the email as approved and add the amount to user's earnings.</span>
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleApproveSubmission}
                disabled={isApproving}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {isApproving ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Approving...</span>
                  </div>
                ) : (
                  'Confirm Approval'
                )}
              </button>
              <button
                onClick={() => setApprovingSubmission(null)}
                disabled={isApproving}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Email Service Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Per Email (PKR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter price per email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gmail Account Password (Optional)
                </label>
                <div className="relative">
                  <input
                    type={showGmailPassword ? 'text' : 'password'}
                    value={gmailPassword}
                    onChange={(e) => setGmailPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter Gmail password for monitoring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGmailPassword(!showGmailPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showGmailPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  This password can be used for monitoring email submissions
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  This price will be applied to all new email submissions. Existing submissions will keep their original price.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleUpdatePrice}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Price'}
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all animate-modalPop">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <FiXCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Reject Email</h2>
                  <p className="text-sm text-red-100">Provide rejection details</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FiMail className="text-red-600" />
                  Email Address:
                </p>
                <p className="text-base font-bold text-gray-900 break-all">
                  {rejectingSubmission.email_address}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder="Explain why this email is being rejected (e.g., Invalid credentials, Account suspended, etc.)"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Attach Proof URL (Optional)
                </label>
                <input
                  type="text"
                  value={attachedProof}
                  onChange={(e) => setAttachedProof(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder="Screenshot URL or proof link"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800 flex items-start gap-2">
                  <span className="font-semibold">Note:</span>
                  <span>User will be able to see the rejection reason. Make sure to provide clear feedback.</span>
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleRejectSubmission}
                disabled={isRejecting || !rejectionReason.trim()}
                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-3 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {isRejecting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Rejecting...</span>
                  </div>
                ) : (
                  'Confirm Rejection'
                )}
              </button>
              <button
                onClick={() => {
                  setRejectingSubmission(null)
                  setRejectionReason('')
                  setAttachedProof('')
                }}
                disabled={isRejecting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {changingStatusSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-modalPop">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <FiClock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Change Status</h2>
                  <p className="text-sm text-orange-100">Select new status for this email</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FiMail className="text-orange-600" />
                  Email Address:
                </p>
                <p className="text-base font-bold text-gray-900 break-all">
                  {changingStatusSubmission.email_address}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Current Status: <span className="font-semibold capitalize">{changingStatusSubmission.status}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Select New Status *
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setNewStatus('pending')}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      newStatus === 'pending'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-300 hover:border-yellow-400 bg-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      newStatus === 'pending' ? 'border-yellow-500' : 'border-gray-300'
                    }`}>
                      {newStatus === 'pending' && (
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      )}
                    </div>
                    <FiClock className="w-5 h-5 text-yellow-600" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-800">Pending</p>
                      <p className="text-xs text-gray-600">Mark as pending review</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setNewStatus('approved')}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      newStatus === 'approved'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-green-400 bg-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      newStatus === 'approved' ? 'border-green-500' : 'border-gray-300'
                    }`}>
                      {newStatus === 'approved' && (
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      )}
                    </div>
                    <FiCheckCircle className="w-5 h-5 text-green-600" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-800">Approved</p>
                      <p className="text-xs text-gray-600">Approve this submission</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setNewStatus('rejected')}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      newStatus === 'rejected'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-red-400 bg-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      newStatus === 'rejected' ? 'border-red-500' : 'border-gray-300'
                    }`}>
                      {newStatus === 'rejected' && (
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      )}
                    </div>
                    <FiXCircle className="w-5 h-5 text-red-600" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-800">Rejected</p>
                      <p className="text-xs text-gray-600">Reject this submission</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 flex items-start gap-2">
                  <span className="font-semibold">Note:</span>
                  <span>Changing status will update all statistics and earnings accordingly.</span>
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleChangeStatus}
                disabled={isChangingStatus || !newStatus}
                className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold py-3 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {isChangingStatus ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Changing...</span>
                  </div>
                ) : (
                  'Confirm Change'
                )}
              </button>
              <button
                onClick={() => {
                  setChangingStatusSubmission(null)
                  setNewStatus('')
                }}
                disabled={isChangingStatus}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
