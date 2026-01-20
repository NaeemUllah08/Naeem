import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Get dashboard stats
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

    // Get user data
    // Try to get withdrawn_email_earnings, but handle gracefully if column doesn't exist yet
    let user, userError
    try {
      const result = await supabaseAdmin
        .from('users')
        .select('id, wallet_balance, referral_code, total_invested, referral_earnings, withdrawn_email_earnings, is_blocked')
        .eq('id', decoded.userId)
        .single()
      user = result.data
      userError = result.error
    } catch (err) {
      // If column doesn't exist, try without it
      const result = await supabaseAdmin
        .from('users')
        .select('id, wallet_balance, referral_code, total_invested, referral_earnings, is_blocked')
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

    // Get total investments
    const { data: investments } = await supabaseAdmin
      .from('investments')
      .select('amount')
      .eq('user_id', user.id)

    const totalInvestments = investments?.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0) || 0

    // Get total profit
    const { data: profits } = await supabaseAdmin
      .from('profits')
      .select('amount')
      .eq('user_id', user.id)

    const totalProfit = profits?.reduce((sum, profit) => sum + (parseFloat(profit.amount) || 0), 0) || 0

    // Get referrals count (use case-insensitive matching)
    const { count: referralsCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .ilike('referred_by', user.referral_code)

    // Get recent activities (recent profits)
    const { data: recentActivities } = await supabaseAdmin
      .from('profits')
      .select('id, amount, created_at, type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const formattedActivities = (recentActivities || []).map(activity => ({
      description: `${activity.type === 'referral' ? 'Referral Bonus' : 'Investment Profit'}`,
      amount: activity.amount,
      type: activity.type || 'profit',
      createdAt: activity.created_at
    }))

    // Calculate total wallet balance including all earnings
    const totalWalletBalance = (parseFloat(user.wallet_balance) || 0) +
                                (parseFloat(user.referral_earnings) || 0) +
                                (parseFloat(emailEarnings) || 0)

    return NextResponse.json({
      stats: {
        walletBalance: totalWalletBalance,
        referralEarnings: parseFloat(user.referral_earnings) || 0,
        emailEarnings: parseFloat(emailEarnings) || 0,
        depositBalance: parseFloat(user.wallet_balance) || 0,
        totalInvestments,
        totalProfit,
        referrals: referralsCount || 0
      },
      recentActivities: formattedActivities
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    )
  }
}
