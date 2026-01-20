import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

// Create Supabase client function
function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// =====================================================
// GET - Fetch all investment plans
// =====================================================
export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      console.log('No authorization token provided')
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      console.log('Invalid token')
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (!decoded.isAdmin) {
      console.log('User is not admin:', decoded)
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const supabase = createClient()

    // Fetch investment plans
    if (action === 'plans') {
      console.log('[GET] Fetching investment plans from database...')

      const { data: plans, error } = await supabase
        .from('investment_plans')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[GET] Error fetching plans from Supabase:', error)
        return NextResponse.json({
          error: 'Database error',
          message: error.message,
          details: error
        }, { status: 400 })
      }

      console.log(`[GET] Successfully fetched ${plans?.length || 0} plans`)
      console.log('[GET] Plans data:', JSON.stringify(plans, null, 2))

      return NextResponse.json({ plans: plans || [] })
    }

    // Default: return empty array if no action specified
    return NextResponse.json({ plans: [] })

  } catch (error) {
    console.error('[GET] Server error:', error)
    return NextResponse.json({
      error: 'Server error',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

// =====================================================
// POST - Create plan, toggle plan, or upload logo
// =====================================================
export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    const decoded = verifyToken(token)

    if (!decoded || !decoded.isAdmin) {
      console.log('[POST] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type')

    // Handle file upload (multipart/form-data)
    if (contentType?.includes('multipart/form-data')) {
      console.log('[POST] Handling file upload...')
      const formData = await request.formData()
      const file = formData.get('file')

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 })
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Create unique filename
      const timestamp = Date.now()
      const ext = path.extname(file.name)
      const filename = `plan-logo-${timestamp}${ext}`

      // Ensure upload directory exists
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'plan-logos')
      try {
        await mkdir(uploadDir, { recursive: true })
      } catch (err) {
        // Directory might already exist
      }

      const filepath = path.join(uploadDir, filename)
      await writeFile(filepath, buffer)

      const url = `/uploads/plan-logos/${filename}`
      console.log('[POST] Logo uploaded successfully:', url)

      return NextResponse.json({ url, message: 'Logo uploaded successfully' })
    }

    // Handle JSON requests
    const body = await request.json()
    const { action } = body

    const supabase = createClient()

    // Toggle plan status
    if (action === 'toggle') {
      console.log('[POST] Toggling plan status...')
      const { planId, isActive } = body

      if (!planId || isActive === undefined) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      const { data: plan, error } = await supabase
        .from('investment_plans')
        .update({ is_active: isActive })
        .eq('id', planId)
        .select()
        .single()

      if (error) {
        console.error('[POST] Error toggling plan:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      // Log admin action
      await supabase
        .from('admin_logs')
        .insert([{
          admin_id: decoded.userId,
          action: 'toggle_investment_plan',
          description: `${isActive ? 'Activated' : 'Deactivated'} investment plan: ${plan.name}`,
          metadata: { plan_id: planId, is_active: isActive }
        }])

      console.log('[POST] Plan toggled successfully:', plan)
      return NextResponse.json({ plan, message: 'Plan status updated successfully' })
    }

    // Create new plan
    const {
      name,
      minAmount,
      maxAmount,
      profitPercentage,
      referralCommissionPercentage,
      companyPercentage,
      userKeepsPercentage,
      minDurationDays,
      maxDurationDays,
      description,
      logoUrl
    } = body

    console.log('[POST] Creating new plan with data:', {
      name,
      minAmount,
      maxAmount,
      profitPercentage,
      referralCommissionPercentage,
      companyPercentage,
      userKeepsPercentage,
      minDurationDays,
      maxDurationDays,
      description,
      logoUrl
    })

    // Validation
    if (!name || !minAmount || !maxAmount || !profitPercentage || !minDurationDays || !maxDurationDays) {
      console.log('[POST] Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (minAmount <= 0 || maxAmount <= minAmount) {
      console.log('[POST] Invalid amount range')
      return NextResponse.json({ error: 'Invalid amount range. Max must be greater than min.' }, { status: 400 })
    }

    if (minDurationDays <= 0 || maxDurationDays < minDurationDays) {
      console.log('[POST] Invalid duration range')
      return NextResponse.json({ error: 'Invalid duration range. Max must be greater than or equal to min.' }, { status: 400 })
    }

    const insertData = {
      name,
      min_amount: parseFloat(minAmount),
      max_amount: parseFloat(maxAmount),
      profit_percentage: parseFloat(profitPercentage),
      referral_commission_percentage: parseFloat(referralCommissionPercentage) || 7.00,
      company_percentage: parseFloat(companyPercentage) || 80.00,
      user_keeps_percentage: parseFloat(userKeepsPercentage) || 20.00,
      min_duration_days: parseInt(minDurationDays),
      max_duration_days: parseInt(maxDurationDays),
      description: description || null,
      logo_url: logoUrl || null,
      is_active: true
    }

    console.log('[POST] Inserting plan data to Supabase:', insertData)

    const { data: plan, error } = await supabase
      .from('investment_plans')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('[POST] Error creating plan in Supabase:', error)
      return NextResponse.json({
        error: 'Database error',
        message: error.message,
        details: error
      }, { status: 400 })
    }

    console.log('[POST] Plan created successfully:', plan)

    // Log admin action
    try {
      await supabase
        .from('admin_logs')
        .insert([{
          admin_id: decoded.userId,
          action: 'create_investment_plan',
          description: `Created investment plan: ${name}`,
          metadata: { plan_id: plan.id, plan_name: name }
        }])
    } catch (logError) {
      console.error('[POST] Error logging admin action:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ plan, message: 'Plan created successfully' })
  } catch (error) {
    console.error('[POST] Server error:', error)
    return NextResponse.json({
      error: 'Server error',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

// =====================================================
// PATCH - Update plan
// =====================================================
export async function PATCH(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    const decoded = verifyToken(token)

    if (!decoded || !decoded.isAdmin) {
      console.log('[PATCH] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      planId,
      name,
      minAmount,
      maxAmount,
      profitPercentage,
      referralCommissionPercentage,
      companyPercentage,
      userKeepsPercentage,
      minDurationDays,
      maxDurationDays,
      description,
      logoUrl
    } = body

    console.log('[PATCH] Updating plan:', planId)

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Validation
    if (minAmount && maxAmount && (minAmount <= 0 || maxAmount <= minAmount)) {
      return NextResponse.json({ error: 'Invalid amount range' }, { status: 400 })
    }

    if (minDurationDays && maxDurationDays && (minDurationDays <= 0 || maxDurationDays < minDurationDays)) {
      return NextResponse.json({ error: 'Invalid duration range' }, { status: 400 })
    }

    const supabase = createClient()

    const updateData = {}
    if (name) updateData.name = name
    if (minAmount) updateData.min_amount = parseFloat(minAmount)
    if (maxAmount) updateData.max_amount = parseFloat(maxAmount)
    if (profitPercentage) updateData.profit_percentage = parseFloat(profitPercentage)
    if (referralCommissionPercentage !== undefined) updateData.referral_commission_percentage = parseFloat(referralCommissionPercentage)
    if (companyPercentage !== undefined) updateData.company_percentage = parseFloat(companyPercentage)
    if (userKeepsPercentage !== undefined) updateData.user_keeps_percentage = parseFloat(userKeepsPercentage)
    if (minDurationDays) updateData.min_duration_days = parseInt(minDurationDays)
    if (maxDurationDays) updateData.max_duration_days = parseInt(maxDurationDays)
    if (description !== undefined) updateData.description = description
    if (logoUrl !== undefined) updateData.logo_url = logoUrl

    console.log('[PATCH] Update data:', updateData)

    const { data: plan, error } = await supabase
      .from('investment_plans')
      .update(updateData)
      .eq('id', planId)
      .select()
      .single()

    if (error) {
      console.error('[PATCH] Error updating plan:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('[PATCH] Plan updated successfully:', plan)

    // Log admin action
    try {
      await supabase
        .from('admin_logs')
        .insert([{
          admin_id: decoded.userId,
          action: 'update_investment_plan',
          description: `Updated investment plan: ${plan.name}`,
          metadata: { plan_id: planId, changes: updateData }
        }])
    } catch (logError) {
      console.error('[PATCH] Error logging admin action:', logError)
    }

    return NextResponse.json({ plan, message: 'Plan updated successfully' })
  } catch (error) {
    console.error('[PATCH] Server error:', error)
    return NextResponse.json({ error: 'Server error', message: error.message }, { status: 500 })
  }
}

// =====================================================
// DELETE - Delete plan
// =====================================================
export async function DELETE(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    const decoded = verifyToken(token)

    if (!decoded || !decoded.isAdmin) {
      console.log('[DELETE] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId')

    console.log('[DELETE] Deleting plan:', planId)

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Check if plan has any active investments
    const { data: investments, error: checkError } = await supabase
      .from('investments')
      .select('id')
      .eq('plan_id', planId)
      .eq('status', 'active')
      .limit(1)

    if (checkError) {
      console.error('[DELETE] Error checking investments:', checkError)
      return NextResponse.json({ error: checkError.message }, { status: 400 })
    }

    if (investments && investments.length > 0) {
      console.log('[DELETE] Cannot delete plan with active investments')
      return NextResponse.json({
        error: 'Cannot delete plan with active investments. Please deactivate it instead.'
      }, { status: 400 })
    }

    // Get plan name for logging
    const { data: plan } = await supabase
      .from('investment_plans')
      .select('name')
      .eq('id', planId)
      .single()

    // Delete the plan
    const { error } = await supabase
      .from('investment_plans')
      .delete()
      .eq('id', planId)

    if (error) {
      console.error('[DELETE] Error deleting plan:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('[DELETE] Plan deleted successfully:', plan?.name)

    // Log admin action
    try {
      await supabase
        .from('admin_logs')
        .insert([{
          admin_id: decoded.userId,
          action: 'delete_investment_plan',
          description: `Deleted investment plan: ${plan?.name || 'Unknown'}`,
          metadata: { plan_id: planId, plan_name: plan?.name }
        }])
    } catch (logError) {
      console.error('[DELETE] Error logging admin action:', logError)
    }

    return NextResponse.json({ message: 'Plan deleted successfully' })
  } catch (error) {
    console.error('[DELETE] Server error:', error)
    return NextResponse.json({ error: 'Server error', message: error.message }, { status: 500 })
  }
}
