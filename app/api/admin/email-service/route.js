import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { adminMiddleware } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Fetch email service settings or user submissions
export async function GET(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')

    if (action === 'settings') {
      // Get email service settings
      const { data: settings, error } = await supabaseAdmin
        .from('email_service_settings')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json(
          { error: 'Failed to fetch settings' },
          { status: 500 }
        )
      }

      return NextResponse.json({ settings })
    }

    if (userId) {
      // Get specific user's email submissions
      // Specify which foreign key relationship to use
      const { data: submissions, error } = await supabaseAdmin
        .from('user_email_submissions')
        .select(`
          *,
          user:users!user_email_submissions_user_id_fkey(id, name, email)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user submissions:', error)
        return NextResponse.json(
          { error: 'Failed to fetch submissions' },
          { status: 500 }
        )
      }

      return NextResponse.json({ submissions: submissions || [] })
    }

    // Get all users with email submission statistics
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, created_at, is_admin')
      .eq('is_admin', false)
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Get submission stats for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        const { data: stats } = await supabaseAdmin
          .rpc('get_user_email_stats', { p_user_id: user.id })

        const userStats = stats?.[0] || {
          total_submitted: 0,
          approved_count: 0,
          rejected_count: 0,
          pending_count: 0,
          total_earned: 0,
          pending_amount: 0
        }

        return {
          ...user,
          ...userStats
        }
      })
    )

    return NextResponse.json({ users: usersWithStats })
  } catch (error) {
    console.error('Admin email service API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Update settings or create payment
export async function POST(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { action, pricePerEmail, gmailPassword, userId } = body

    if (action === 'update_settings') {
      // Update email service price and optionally Gmail password
      const updateData = {
        price_per_email: parseFloat(pricePerEmail),
        updated_at: new Date().toISOString()
      }

      // Only update Gmail password if provided and not empty
      if (gmailPassword && gmailPassword.trim() !== '') {
        updateData.gmail_password = gmailPassword.trim()
      }

      const { error } = await supabaseAdmin
        .from('email_service_settings')
        .update(updateData)
        .eq('is_active', true)

      if (error) {
        console.error('Error updating settings:', error)
        return NextResponse.json(
          { error: 'Failed to update settings' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully'
      })
    }

    if (action === 'create_payment') {
      // Create payment record for approved emails
      const { data: stats } = await supabaseAdmin
        .rpc('get_user_email_stats', { p_user_id: userId })

      const userStats = stats?.[0]

      if (!userStats || userStats.approved_count === 0) {
        return NextResponse.json(
          { error: 'No approved emails to pay for' },
          { status: 400 }
        )
      }

      // Get current price
      const { data: settings } = await supabaseAdmin
        .from('email_service_settings')
        .select('price_per_email')
        .eq('is_active', true)
        .single()

      const totalAmount = userStats.approved_count * (settings?.price_per_email || 0)

      const { data, error } = await supabaseAdmin
        .from('email_payments')
        .insert([{
          user_id: userId,
          total_emails_submitted: userStats.total_submitted,
          approved_emails: userStats.approved_count,
          rejected_emails: userStats.rejected_count,
          price_per_email: settings?.price_per_email || 0,
          total_amount: totalAmount,
          payment_status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating payment:', error)
        return NextResponse.json(
          { error: 'Failed to create payment' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Payment record created',
        payment: data
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Admin email service POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Approve/Reject email submissions
export async function PATCH(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { submissionId, status, rejectionReason, attachedProof } = body

    if (!submissionId || !status) {
      return NextResponse.json(
        { error: 'Submission ID and status are required' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      approved_by: authResult.user.id
    }

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString()
    }

    if (status === 'rejected') {
      updateData.rejection_reason = rejectionReason || null
      updateData.attached_proof = attachedProof || null
    }

    const { error } = await supabaseAdmin
      .from('user_email_submissions')
      .update(updateData)
      .eq('id', submissionId)

    if (error) {
      console.error('Error updating submission:', error)
      return NextResponse.json(
        { error: 'Failed to update submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Email ${status} successfully`
    })
  } catch (error) {
    console.error('Admin email service PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete email submission
export async function DELETE(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { searchParams } = new URL(req.url)
    const submissionId = searchParams.get('submissionId')

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('user_email_submissions')
      .delete()
      .eq('id', submissionId)

    if (error) {
      console.error('Error deleting submission:', error)
      return NextResponse.json(
        { error: 'Failed to delete submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully'
    })
  } catch (error) {
    console.error('Admin email service DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
