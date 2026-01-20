'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import toast from 'react-hot-toast'
import { formatCurrencyPK } from '@/lib/currency'

export default function AdminInvestmentsPage() {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================
  const [plans, setPlans] = useState([])
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [viewingPlan, setViewingPlan] = useState(null)
  const [deletingPlan, setDeletingPlan] = useState(null)
  const [loading, setLoading] = useState(false)

  const [planFormData, setPlanFormData] = useState({
    name: '',
    minAmount: '',
    maxAmount: '',
    profitPercentage: '',
    referralCommissionPercentage: '7',
    companyPercentage: '80',
    userKeepsPercentage: '20',
    minDurationDays: '',
    maxDurationDays: '',
    description: '',
    logo: null,
  })

  // =====================================================
  // DATA FETCHING
  // =====================================================
  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/investments?action=plans', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Failed to load plans:', error)
    }
  }

  // =====================================================
  // PLAN CRUD OPERATIONS
  // =====================================================
  const handleCreatePlan = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      let logoUrl = null

      // Upload logo if provided
      if (planFormData.logo) {
        const logoFormData = new FormData()
        logoFormData.append('file', planFormData.logo)

        const uploadRes = await fetch('/api/admin/investments', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: logoFormData,
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          logoUrl = uploadData.url
        } else {
          toast.error('Failed to upload logo')
          setLoading(false)
          return
        }
      }

      // Create plan
      const res = await fetch('/api/admin/investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: planFormData.name,
          minAmount: parseFloat(planFormData.minAmount),
          maxAmount: parseFloat(planFormData.maxAmount),
          profitPercentage: parseFloat(planFormData.profitPercentage),
          referralCommissionPercentage: parseFloat(planFormData.referralCommissionPercentage),
          companyPercentage: parseFloat(planFormData.companyPercentage),
          userKeepsPercentage: parseFloat(planFormData.userKeepsPercentage),
          minDurationDays: parseInt(planFormData.minDurationDays),
          maxDurationDays: parseInt(planFormData.maxDurationDays),
          description: planFormData.description,
          logoUrl: logoUrl,
        }),
      })

      if (res.ok) {
        toast.success('Investment plan created successfully')
        resetPlanForm()
        fetchPlans()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create plan')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePlan = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      let logoUrl = editingPlan.logoUrl

      // Upload new logo if provided
      if (planFormData.logo) {
        const logoFormData = new FormData()
        logoFormData.append('file', planFormData.logo)

        const uploadRes = await fetch('/api/admin/investments', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: logoFormData,
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          logoUrl = uploadData.url
        } else {
          toast.error('Failed to upload logo')
          setLoading(false)
          return
        }
      }

      // Update plan
      const res = await fetch('/api/admin/investments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: editingPlan.id,
          name: planFormData.name,
          minAmount: parseFloat(planFormData.minAmount),
          maxAmount: parseFloat(planFormData.maxAmount),
          profitPercentage: parseFloat(planFormData.profitPercentage),
          referralCommissionPercentage: parseFloat(planFormData.referralCommissionPercentage),
          companyPercentage: parseFloat(planFormData.companyPercentage),
          userKeepsPercentage: parseFloat(planFormData.userKeepsPercentage),
          minDurationDays: parseInt(planFormData.minDurationDays),
          maxDurationDays: parseInt(planFormData.maxDurationDays),
          description: planFormData.description,
          logoUrl: logoUrl,
        }),
      })

      if (res.ok) {
        toast.success('Investment plan updated successfully')
        resetPlanForm()
        fetchPlans()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update plan')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePlan = async (planId, isActive) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'toggle', planId, isActive: !isActive }),
      })

      if (res.ok) {
        toast.success('Plan status updated')
        fetchPlans()
      }
    } catch (error) {
      toast.error('Failed to update plan')
    }
  }

  const handleDeletePlan = async () => {
    if (!deletingPlan) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/investments?planId=${deletingPlan.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`Plan "${deletingPlan.name}" deleted successfully!`)
        setDeletingPlan(null)
        fetchPlans()
      } else {
        toast.error(data.error || 'Failed to delete plan')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleEditPlan = (plan) => {
    setEditingPlan(plan)
    setPlanFormData({
      name: plan.name,
      minAmount: plan.min_amount || plan.minAmount,
      maxAmount: plan.max_amount || plan.maxAmount,
      profitPercentage: plan.profit_percentage || plan.profitPercentage,
      referralCommissionPercentage: plan.referral_commission_percentage || plan.referralCommissionPercentage || 7,
      companyPercentage: plan.company_percentage || plan.companyPercentage || 80,
      userKeepsPercentage: plan.user_keeps_percentage || plan.userKeepsPercentage || 20,
      minDurationDays: plan.min_duration_days || plan.minDurationDays || plan.duration,
      maxDurationDays: plan.max_duration_days || plan.maxDurationDays || plan.duration,
      description: plan.description || '',
      logo: null,
    })
    setShowPlanForm(true)
  }

  const resetPlanForm = () => {
    setShowPlanForm(false)
    setEditingPlan(null)
    setPlanFormData({
      name: '',
      minAmount: '',
      maxAmount: '',
      profitPercentage: '',
      referralCommissionPercentage: '7',
      companyPercentage: '80',
      userKeepsPercentage: '20',
      minDurationDays: '',
      maxDurationDays: '',
      description: '',
      logo: null
    })
  }

  // =====================================================
  // RENDER - PLANS SECTION
  // =====================================================
  const renderPlansSection = () => (
    <>
      <Card className="mb-3 sm:mb-4">
        <button
          onClick={() => {
            setEditingPlan(null)
            resetPlanForm()
            setShowPlanForm(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition text-sm w-full sm:w-auto"
        >
          + Create New Plan
        </button>
      </Card>

      <Card>
        <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3">Investment Plans</h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Logo</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="hidden sm:table-cell px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Profit %</th>
                  <th className="hidden md:table-cell px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ref %</th>
                  <th className="hidden lg:table-cell px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Company %</th>
                  <th className="hidden lg:table-cell px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">User %</th>
                  <th className="hidden xl:table-cell px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Min</th>
                  <th className="hidden xl:table-cell px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Max</th>
                  <th className="hidden md:table-cell px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Duration</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
          {plans.length > 0 ? (
            plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50">
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  {plan.logo_url || plan.logoUrl ? (
                    <img src={plan.logo_url || plan.logoUrl} alt={plan.name} className="w-6 h-6 sm:w-8 sm:h-8 object-cover rounded" />
                  ) : (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                      No
                    </div>
                  )}
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-semibold text-gray-800">{plan.name}</span>
                    <span className="sm:hidden text-xs text-blue-600 mt-1">
                      {plan.profit_percentage || plan.profitPercentage}%
                    </span>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-blue-600">
                  {plan.profit_percentage || plan.profitPercentage}%
                </td>
                <td className="hidden md:table-cell px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-green-600">
                  {plan.referral_commission_percentage || plan.referralCommissionPercentage || 7}%
                </td>
                <td className="hidden lg:table-cell px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-purple-600">
                  {plan.company_percentage || plan.companyPercentage || 80}%
                </td>
                <td className="hidden lg:table-cell px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-orange-600">
                  {plan.user_keeps_percentage || plan.userKeepsPercentage || 20}%
                </td>
                <td className="hidden xl:table-cell px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                  {formatCurrencyPK(plan.min_amount || plan.minAmount)}
                </td>
                <td className="hidden xl:table-cell px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                  {formatCurrencyPK(plan.max_amount || plan.maxAmount)}
                </td>
                <td className="hidden md:table-cell px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                  {plan.min_duration_days || plan.minDurationDays || plan.duration}-
                  {plan.max_duration_days || plan.maxDurationDays || plan.duration} days
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  <button
                    onClick={() => handleTogglePlan(plan.id, plan.is_active ?? plan.isActive)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition ${
                      (plan.is_active ?? plan.isActive)
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {(plan.is_active ?? plan.isActive) ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingPlan(plan)}
                      className="p-1 sm:p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="View Details"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="p-1 sm:p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                      title="Edit Plan"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeletingPlan(plan)}
                      className="p-1 sm:p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete Plan"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="11" className="px-3 sm:px-4 py-6 text-center text-gray-500 text-xs sm:text-sm">
                No investment plans created
              </td>
            </tr>
          )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </>
  )

  // =====================================================
  // RENDER - PLAN FORM MODAL
  // =====================================================
  const renderPlanFormModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {editingPlan ? 'Edit Investment Plan' : 'Create Investment Plan'}
          </h2>
          <button
            onClick={resetPlanForm}
            className="text-gray-400 hover:text-gray-600 transition"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan} className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Plan Name</label>
            <input
              type="text"
              value={planFormData.name}
              onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., Starter Plan"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Profit Percentage</label>
            <input
              type="number"
              value={planFormData.profitPercentage}
              onChange={(e) => setPlanFormData({ ...planFormData, profitPercentage: e.target.value })}
              required
              step="0.01"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., 10"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Referral Commission %</label>
            <input
              type="number"
              value={planFormData.referralCommissionPercentage}
              onChange={(e) => setPlanFormData({ ...planFormData, referralCommissionPercentage: e.target.value })}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Default: 7"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Company Takes %</label>
            <input
              type="number"
              value={planFormData.companyPercentage}
              onChange={(e) => setPlanFormData({ ...planFormData, companyPercentage: e.target.value })}
              step="0.01"
              min="0"
              max="100"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Default: 80"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">User Keeps %</label>
            <input
              type="number"
              value={planFormData.userKeepsPercentage}
              onChange={(e) => setPlanFormData({ ...planFormData, userKeepsPercentage: e.target.value })}
              step="0.01"
              min="0"
              max="100"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Default: 20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Amount (PKR)</label>
            <input
              type="number"
              value={planFormData.minAmount}
              onChange={(e) => setPlanFormData({ ...planFormData, minAmount: e.target.value })}
              required
              step="0.01"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., 600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Maximum Amount (PKR)</label>
            <input
              type="number"
              value={planFormData.maxAmount}
              onChange={(e) => setPlanFormData({ ...planFormData, maxAmount: e.target.value })}
              required
              step="0.01"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., 100000"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Min Duration (days)</label>
            <input
              type="number"
              value={planFormData.minDurationDays}
              onChange={(e) => setPlanFormData({ ...planFormData, minDurationDays: e.target.value })}
              required
              min="1"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., 30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Max Duration (days)</label>
            <input
              type="number"
              value={planFormData.maxDurationDays}
              onChange={(e) => setPlanFormData({ ...planFormData, maxDurationDays: e.target.value })}
              required
              min="1"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., 60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={planFormData.description}
              onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Plan description"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Plan Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPlanFormData({ ...planFormData, logo: e.target.files[0] })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {planFormData.logo && (
              <p className="mt-1 text-xs text-gray-600">Selected: {planFormData.logo.name}</p>
            )}
          </div>

          <div className="col-span-2 flex gap-3 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-sm rounded-lg transition disabled:opacity-50"
            >
              {loading ? (editingPlan ? 'Updating...' : 'Creating...') : (editingPlan ? 'Update Plan' : 'Create Plan')}
            </button>
            <button
              type="button"
              onClick={resetPlanForm}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 text-sm rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </div>
  )

  // =====================================================
  // RENDER - VIEW PLAN MODAL
  // =====================================================
  const renderViewPlanModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-xl w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Plan Details</h2>
          <button
            onClick={() => setViewingPlan(null)}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {(viewingPlan.logo_url || viewingPlan.logoUrl) && (
            <div className="flex justify-center mb-3">
              <img src={viewingPlan.logo_url || viewingPlan.logoUrl} alt={viewingPlan.name} className="w-20 h-20 object-cover rounded-lg" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-600">Plan Name</p>
              <p className="text-sm font-semibold text-gray-800">{viewingPlan.name}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600">Status</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                (viewingPlan.is_active ?? viewingPlan.isActive) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {(viewingPlan.is_active ?? viewingPlan.isActive) ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-600">Profit Percentage</p>
              <p className="text-sm font-semibold text-blue-600">
                {viewingPlan.profit_percentage || viewingPlan.profitPercentage}%
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600">Referral Commission %</p>
              <p className="text-sm font-semibold text-green-600">
                {viewingPlan.referral_commission_percentage || viewingPlan.referralCommissionPercentage || 7}%
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600">Company Takes %</p>
              <p className="text-sm font-semibold text-purple-600">
                {viewingPlan.company_percentage || viewingPlan.companyPercentage || 80}%
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600">User Keeps %</p>
              <p className="text-sm font-semibold text-orange-600">
                {viewingPlan.user_keeps_percentage || viewingPlan.userKeepsPercentage || 20}%
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600">Duration Range</p>
              <p className="text-sm font-semibold text-gray-800">
                {viewingPlan.min_duration_days || viewingPlan.minDurationDays || viewingPlan.duration} -
                {viewingPlan.max_duration_days || viewingPlan.maxDurationDays || viewingPlan.duration} days
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600">Minimum Amount</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatCurrencyPK(viewingPlan.min_amount || viewingPlan.minAmount)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600">Maximum Amount</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatCurrencyPK(viewingPlan.max_amount || viewingPlan.maxAmount)}
              </p>
            </div>

            {viewingPlan.description && (
              <div className="col-span-2">
                <p className="text-xs text-gray-600">Description</p>
                <p className="text-sm text-gray-800 mt-1">{viewingPlan.description}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-600">Created At</p>
              <p className="text-xs text-gray-800">
                {new Date(viewingPlan.created_at || viewingPlan.createdAt).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600">Last Updated</p>
              <p className="text-xs text-gray-800">
                {new Date(viewingPlan.updated_at || viewingPlan.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                setViewingPlan(null)
                handleEditPlan(viewingPlan)
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 text-sm rounded-lg transition"
            >
              Edit Plan
            </button>
            <button
              onClick={() => setViewingPlan(null)}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 text-sm rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </Card>
    </div>
  )

  // =====================================================
  // RENDER - DELETE CONFIRMATION MODAL
  // =====================================================
  const renderDeleteConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Investment Plan</h3>
          <p className="text-sm text-gray-600 mb-1">
            Are you sure you want to delete the plan:
          </p>
          <p className="text-base font-semibold text-gray-800 mb-4">
            "{deletingPlan?.name}"?
          </p>
          <p className="text-xs text-red-600 mb-6">
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeletingPlan(null)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 text-sm rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeletePlan}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 text-sm rounded-lg transition"
            >
              Delete Plan
            </button>
          </div>
        </div>
      </Card>
    </div>
  )

  // =====================================================
  // MAIN RENDER
  // =====================================================
  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Investment Plans</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Create and manage investment plans</p>
      </div>

      {/* Plans Content */}
      {renderPlansSection()}

      {/* Modals */}
      {showPlanForm && renderPlanFormModal()}
      {viewingPlan && renderViewPlanModal()}
      {deletingPlan && renderDeleteConfirmModal()}
    </div>
  )
}
