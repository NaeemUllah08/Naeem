import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authMiddleware } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Fetch user's email submissions and stats
export async function GET(req) {
  try {
    const authResult = await authMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'settings') {
      // Get current price per email and gmail password
      const { data: settings, error } = await supabaseAdmin
        .from('email_service_settings')
        .select('price_per_email, gmail_password')
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching settings:', error)
        // If column doesn't exist, try fetching without gmail_password
        const { data: fallbackSettings } = await supabaseAdmin
          .from('email_service_settings')
          .select('price_per_email')
          .eq('is_active', true)
          .single()

        return NextResponse.json({
          settings: fallbackSettings || { price_per_email: 10 }
        })
      }

      return NextResponse.json({ settings })
    }

    if (action === 'stats') {
      // Get user's statistics
      const { data: stats, error } = await supabaseAdmin
        .rpc('get_user_email_stats', { p_user_id: authResult.user.id })

      if (error) {
        console.error('Error fetching stats:', error)
        return NextResponse.json(
          { error: 'Failed to fetch stats' },
          { status: 500 }
        )
      }

      return NextResponse.json({ stats: stats?.[0] || {} })
    }

    // Get user's email submissions
    const { data: submissions, error } = await supabaseAdmin
      .from('user_email_submissions')
      .select('*')
      .eq('user_id', authResult.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching submissions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ submissions: submissions || [] })
  } catch (error) {
    console.error('User email submissions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Submit new email account
export async function POST(req) {
  try {
    const authResult = await authMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { emailAddress } = await req.json()

    if (!emailAddress) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailAddress)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if email already submitted by this user
    const { data: existing } = await supabaseAdmin
      .from('user_email_submissions')
      .select('id')
      .eq('user_id', authResult.user.id)
      .eq('email_address', emailAddress)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'This email has already been submitted' },
        { status: 400 }
      )
    }

    // Get current price
    const { data: settings } = await supabaseAdmin
      .from('email_service_settings')
      .select('price_per_email')
      .eq('is_active', true)
      .single()

    const currentPrice = settings?.price_per_email || 10.00

    // Create submission without password
    const { data, error } = await supabaseAdmin
      .from('user_email_submissions')
      .insert([{
        user_id: authResult.user.id,
        email_address: emailAddress,
        status: 'pending',
        price_at_submission: currentPrice,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating submission:', error)
      return NextResponse.json(
        { error: 'Failed to submit email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email submitted successfully',
      submission: data
    })
  } catch (error) {
    console.error('User email submissions POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete own submission (only if pending)
export async function DELETE(req) {
  try {
    const authResult = await authMiddleware(req)
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

    // Check if submission belongs to user and is pending
    const { data: submission } = await supabaseAdmin
      .from('user_email_submissions')
      .select('status, user_id')
      .eq('id', submissionId)
      .single()

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    if (submission.user_id !== authResult.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only delete pending submissions' },
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
    console.error('User email submissions DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
