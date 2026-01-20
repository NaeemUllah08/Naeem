import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Get wallet balance and deposits
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user data including all earnings
    // Try to get withdrawn_email_earnings, but handle gracefully if column doesn't exist yet
    let user, userError
    try {
      const result = await supabaseAdmin
        .from('users')
        .select('id, wallet_balance, referral_earnings, withdrawn_email_earnings, is_blocked')
        .eq('id', decoded.userId)
        .single()
      user = result.data
      userError = result.error
    } catch (err) {
      // If column doesn't exist, try without it
      const result = await supabaseAdmin
        .from('users')
        .select('id, wallet_balance, referral_earnings, is_blocked')
        .eq('id', decoded.userId)
        .single()
      user = result.data
      userError = result.error
      if (user) {
        user.withdrawn_email_earnings = 0 // Default to 0 if column doesn't exist
      }
    }

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.is_blocked) {
      return NextResponse.json({ error: 'Account is blocked' }, { status: 403 })
    }

    // Get email earnings from email_service
    const { data: emailStats } = await supabaseAdmin
      .rpc('get_user_email_stats', { p_user_id: user.id })

    const totalEmailEarned = emailStats?.[0]?.total_earned || 0
    const withdrawnEmailEarnings = parseFloat(user.withdrawn_email_earnings || 0)
    const emailEarnings = Math.max(0, totalEmailEarned - withdrawnEmailEarnings) // Available email earnings

    // Calculate total wallet balance including all earnings
    const totalBalance = (parseFloat(user.wallet_balance) || 0) +
                         (parseFloat(user.referral_earnings) || 0) +
                         (parseFloat(emailEarnings) || 0)

    // Get deposits
    const { data: deposits } = await supabaseAdmin
      .from('deposits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Format deposits for frontend
    const formattedDeposits = (deposits || []).map(deposit => ({
      id: deposit.id,
      amount: deposit.amount,
      paymentMethod: deposit.payment_method,
      transactionId: deposit.transaction_id,
      status: deposit.status,
      createdAt: deposit.created_at
    }))

    return NextResponse.json({
      balance: totalBalance,
      deposits: formattedDeposits
    })

  } catch (error) {
    console.error('Wallet API error:', error)
    return NextResponse.json(
      { error: 'Failed to load wallet data' },
      { status: 500 }
    )
  }
}
