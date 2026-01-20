'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { FiSettings, FiLayout, FiCreditCard } from 'react-icons/fi'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('basic') // 'basic', 'pages', 'payment'
  const [adminInfo, setAdminInfo] = useState(null)
  const [paymentGateways, setPaymentGateways] = useState([])
  const [editingGateway, setEditingGateway] = useState(null)
  const [showGatewayForm, setShowGatewayForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const [gatewayFormData, setGatewayFormData] = useState({
    name: '',
    accountTitle: '',
    accountNumber: '',
    logo: null,
    isActive: true
  })

  // User Pages Settings
  const [userPagesSettings, setUserPagesSettings] = useState({
    showDashboard: true,
    showDeposits: true,
    showInvestments: true,
    showMyInvestments: true,
    showWithdrawals: true,
    showReferrals: true,
    showShopping: true,
    showOrders: true,
    showEmailSubmissions: true,
    showProfile: true
  })

  // Overlay settings for each page
  const [pageOverlays, setPageOverlays] = useState({
    dashboard: { enabled: false, text: 'Coming Soon' },
    deposits: { enabled: false, text: 'Coming Soon' },
    investments: { enabled: false, text: 'Coming Soon' },
    myInvestments: { enabled: false, text: 'Coming Soon' },
    withdrawals: { enabled: false, text: 'Coming Soon' },
    referrals: { enabled: false, text: 'Coming Soon' },
    shopping: { enabled: false, text: 'Coming Soon' },
    orders: { enabled: false, text: 'Coming Soon' },
    emailSubmissions: { enabled: false, text: 'Coming Soon' },
    profile: { enabled: false, text: 'Coming Soon' }
  })

  const [editingOverlay, setEditingOverlay] = useState(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setAdminInfo(user)
    fetchPaymentGateways()
    fetchPageOverlaySettings()
  }, [])

  const fetchPageOverlaySettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/page-overlays', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        // Merge fetched data with default state to ensure all pages exist
        setPageOverlays(prev => ({
          ...prev,
          ...data.settings
        }))
      }
    } catch (error) {
      console.error('Error fetching page overlay settings:', error)
    }
  }

  const fetchPaymentGateways = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPaymentGateways(data || [])
    } catch (error) {
      console.error('Error fetching payment gateways:', error)
    }
  }

  const handleCreateGateway = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let logoPath = null

      if (gatewayFormData.logo) {
        const fileExt = gatewayFormData.logo.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `gateway-logos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, gatewayFormData.logo)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath)

        logoPath = publicUrl
      }

      const { data, error } = await supabase
        .from('payment_gateways')
        .insert([{
          name: gatewayFormData.name,
          account_title: gatewayFormData.accountTitle,
          account_number: gatewayFormData.accountNumber,
          logo_url: logoPath,
          is_active: gatewayFormData.isActive
        }])
        .select()
        .single()

      if (error) throw error

      toast.success('Payment gateway created successfully!')
      resetForm()
      fetchPaymentGateways()
    } catch (error) {
      toast.error('Failed to create payment gateway')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateGateway = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let logoPath = editingGateway.logo_url

      if (gatewayFormData.logo) {
        const fileExt = gatewayFormData.logo.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `gateway-logos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, gatewayFormData.logo)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath)

        logoPath = publicUrl
      }

      const { data, error } = await supabase
        .from('payment_gateways')
        .update({
          name: gatewayFormData.name,
          account_title: gatewayFormData.accountTitle,
          account_number: gatewayFormData.accountNumber,
          logo_url: logoPath,
          is_active: gatewayFormData.isActive
        })
        .eq('id', editingGateway.id)
        .select()
        .single()

      if (error) throw error

      toast.success('Payment gateway updated successfully!')
      resetForm()
      fetchPaymentGateways()
    } catch (error) {
      toast.error('Failed to update payment gateway')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGateway = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    try {
      const { error } = await supabase
        .from('payment_gateways')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Payment gateway deleted successfully!')
      fetchPaymentGateways()
    } catch (error) {
      toast.error('Failed to delete payment gateway')
      console.error(error)
    }
  }

  const handleToggleGateway = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('payment_gateways')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      toast.success('Gateway status updated!')
      fetchPaymentGateways()
    } catch (error) {
      toast.error('Failed to update status')
      console.error(error)
    }
  }

  const handleEditGateway = (gateway) => {
    setEditingGateway(gateway)
    setGatewayFormData({
      name: gateway.name,
      accountTitle: gateway.account_title,
      accountNumber: gateway.account_number,
      logo: null,
      isActive: gateway.is_active
    })
    setShowGatewayForm(true)
  }

  const resetForm = () => {
    setGatewayFormData({
      name: '',
      accountTitle: '',
      accountNumber: '',
      logo: null,
      isActive: true
    })
    setEditingGateway(null)
    setShowGatewayForm(false)
  }

  const handleSaveUserPages = async () => {
    try {
      const token = localStorage.getItem('token')

      // Save page overlays to database
      const res = await fetch('/api/admin/page-overlays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ settings: pageOverlays })
      })

      if (res.ok) {
        // Save user pages settings to localStorage
        localStorage.setItem('userPagesSettings', JSON.stringify(userPagesSettings))
        // REMOVE old pageOverlays from localStorage to force fresh fetch from database
        localStorage.removeItem('pageOverlays')
        toast.success('User pages settings saved successfully!')
      } else {
        const errorData = await res.json()
        console.error('Save failed:', errorData)
        toast.error(errorData.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    }
  }

  const handleOverlayToggle = (page) => {
    setPageOverlays({
      ...pageOverlays,
      [page]: {
        ...pageOverlays[page],
        enabled: !pageOverlays[page].enabled
      }
    })
  }

  const handleOverlayTextChange = (page, text) => {
    setPageOverlays({
      ...pageOverlays,
      [page]: {
        ...pageOverlays[page],
        text: text
      }
    })
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">Configure admin settings and preferences</p>
      </div>

      {/* Tabs */}
      <Card className="mb-4">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition text-sm whitespace-nowrap ${
              activeTab === 'basic'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FiSettings /> Basic Settings
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition text-sm whitespace-nowrap ${
              activeTab === 'pages'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FiLayout /> User Pages Settings
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition text-sm whitespace-nowrap ${
              activeTab === 'payment'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FiCreditCard /> Payment Gateway Settings
          </button>
        </div>
      </Card>

      {/* Basic Settings Tab */}
      {activeTab === 'basic' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Admin Info */}
            <Card>
              <h2 className="text-base font-bold text-gray-800 mb-3">Administrator Information</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600">Name</p>
                  <p className="text-sm font-semibold text-gray-800">{adminInfo?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="text-sm font-semibold text-gray-800">{adminInfo?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Role</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    Administrator
                  </span>
                </div>
              </div>
            </Card>

            {/* System Info */}
            <Card>
              <h2 className="text-base font-bold text-gray-800 mb-3">System Configuration</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Investment Plan Management</h3>
                    <p className="text-xs text-blue-700 mb-2">
                      Investment plan management is available in the <strong>Investments</strong> section.
                    </p>
                    <p className="text-xs text-blue-600">
                      Navigate to <strong>Investments → Manage Plans</strong> to create, edit, and manage all investment plans.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Platform Statistics */}
          <Card>
            <h2 className="text-base font-bold text-gray-800 mb-3">Platform Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">Platform Status</p>
                <p className="text-xl font-bold text-blue-800">Active</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <p className="text-xs text-green-600 mb-1">Database</p>
                <p className="text-xl font-bold text-green-800">Connected</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <p className="text-xs text-purple-600 mb-1">System Version</p>
                <p className="text-xl font-bold text-purple-800">v1.0.0</p>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* User Pages Settings Tab */}
      {activeTab === 'pages' && (
        <div className="space-y-4">
          {/* User Pages Visibility - HIDDEN (all pages auto-enabled by default) */}
          {false && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-800">User Pages Visibility</h2>
                  <p className="text-xs text-gray-600 mt-1">Control which pages are visible to users in their dashboard</p>
                </div>
                <button
                  onClick={handleSaveUserPages}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition text-sm"
                >
                  Save Changes
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(userPagesSettings).map(([key, value]) => {
                  const pageName = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .replace('show', '')
                    .trim()

                  return (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{pageName}</p>
                        <p className="text-xs text-gray-500">
                          {value ? 'Visible to users' : 'Hidden from users'}
                        </p>
                      </div>
                      <button
                        onClick={() => setUserPagesSettings({ ...userPagesSettings, [key]: !value })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          value ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Page Overlay Settings */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-800">Page Overlay Messages</h2>
                <p className="text-xs text-gray-600 mt-1">Show custom messages with blur overlay on specific pages (like "Coming Soon")</p>
              </div>
              <button
                onClick={handleSaveUserPages}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition text-sm"
              >
                Save Changes
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(pageOverlays).map(([page, settings]) => {
                const pageName = page
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim()

                return (
                  <div key={page} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-800">{pageName}</h3>
                      <button
                        onClick={() => handleOverlayToggle(page)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.enabled ? 'bg-orange-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Overlay Message</label>
                        <input
                          type="text"
                          value={settings.text}
                          onChange={(e) => handleOverlayTextChange(page, e.target.value)}
                          disabled={!settings.enabled}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="e.g., Coming Soon, Under Construction"
                        />
                      </div>
                      <div className={`text-xs ${settings.enabled ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                        {settings.enabled ? '✓ Overlay active - page will show blur with message' : 'Overlay disabled'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Payment Gateway Settings Tab */}
      {activeTab === 'payment' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-800">Payment Gateways</h2>
              <p className="text-xs text-gray-600 mt-1">Manage payment methods available for deposits</p>
            </div>
            <button
              onClick={() => {
                setEditingGateway(null)
                resetForm()
                setShowGatewayForm(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition text-sm"
            >
              + Add Gateway
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paymentGateways.length > 0 ? (
              paymentGateways.map((gateway) => (
                <div key={gateway.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all bg-white">
                  <div className="flex flex-col h-full">
                    {/* Logo and Status */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {gateway.logo_url ? (
                          <img src={gateway.logo_url} alt={gateway.name} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleGateway(gateway.id, gateway.is_active)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition ${
                          gateway.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {gateway.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    {/* Gateway Name */}
                    <h3 className="text-sm font-bold text-gray-800 mb-2">{gateway.name}</h3>

                    {/* Account Details */}
                    <div className="space-y-1 mb-3 flex-grow">
                      <div className="bg-gray-50 rounded px-2 py-1">
                        <p className="text-xs text-gray-500">Account Title</p>
                        <p className="text-xs font-semibold text-gray-800">{gateway.account_title}</p>
                      </div>
                      <div className="bg-gray-50 rounded px-2 py-1">
                        <p className="text-xs text-gray-500">Account Number</p>
                        <p className="text-xs font-semibold text-gray-800">{gateway.account_number}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditGateway(gateway)}
                        className="flex-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteGateway(gateway.id, gateway.name)}
                        className="flex-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500 text-sm">
                No payment gateways configured. Click "+ Add Gateway" to create one.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Gateway Form Modal */}
      {showGatewayForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800">
                {editingGateway ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={editingGateway ? handleUpdateGateway : handleCreateGateway} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Gateway Name</label>
                <input
                  type="text"
                  value={gatewayFormData.name}
                  onChange={(e) => setGatewayFormData({ ...gatewayFormData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., JazzCash, EasyPaisa"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Account Title</label>
                <input
                  type="text"
                  value={gatewayFormData.accountTitle}
                  onChange={(e) => setGatewayFormData({ ...gatewayFormData, accountTitle: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Account holder name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Account Number</label>
                <input
                  type="text"
                  value={gatewayFormData.accountNumber}
                  onChange={(e) => setGatewayFormData({ ...gatewayFormData, accountNumber: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Account/wallet number"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Gateway Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setGatewayFormData({ ...gatewayFormData, logo: e.target.files[0] })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {editingGateway?.logo_url && !gatewayFormData.logo && (
                  <p className="text-xs text-gray-500 mt-1">Current logo will be kept if not changed</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={gatewayFormData.isActive}
                  onChange={(e) => setGatewayFormData({ ...gatewayFormData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-xs text-gray-700">
                  Active (users can see this gateway)
                </label>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-sm rounded-lg transition disabled:opacity-50"
                >
                  {loading ? (editingGateway ? 'Updating...' : 'Creating...') : (editingGateway ? 'Update Gateway' : 'Create Gateway')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 text-sm rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
