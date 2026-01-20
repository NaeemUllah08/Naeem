import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { adminMiddleware } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Fetch all users with their wallet balances and investment summaries
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        email,
        password,
        referral_code,
        is_blocked,
        is_admin,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Fetch wallet balances for all users
    const { data: wallets } = await supabaseAdmin
      .from('wallets')
      .select('user_id, balance, referral_earnings')

    // Fetch investments summary
    const { data: investments } = await supabaseAdmin
      .from('investments')
      .select('user_id, amount, status')
      .eq('status', 'active')

    // Fetch referrals for each user
    const { data: referrals } = await supabaseAdmin
      .from('users')
      .select('id, name, email, referred_by, is_blocked, created_at')
      .not('referred_by', 'is', null)

    // Create maps for quick lookup
    const walletMap = {}
    wallets?.forEach(w => {
      walletMap[w.user_id] = {
        balance: w.balance || 0,
        referralEarnings: w.referral_earnings || 0
      }
    })

    const investmentMap = {}
    investments?.forEach(inv => {
      if (!investmentMap[inv.user_id]) {
        investmentMap[inv.user_id] = 0
      }
      investmentMap[inv.user_id] += parseFloat(inv.amount || 0)
    })

    const referralMap = {}
    referrals?.forEach(ref => {
      if (!referralMap[ref.referred_by]) {
        referralMap[ref.referred_by] = []
      }
      referralMap[ref.referred_by].push({
        id: ref.id,
        name: ref.name,
        email: ref.email,
        createdAt: ref.created_at,
        status: ref.is_blocked ? 'Blocked' : 'Active'
      })
    })

    // Combine all data
    const enrichedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password, // This will be shown to admin only
      referralCode: user.referral_code,
      isBlocked: user.is_blocked,
      isAdmin: user.is_admin,
      createdAt: user.created_at,
      walletBalance: walletMap[user.id]?.balance || 0,
      referralEarnings: walletMap[user.id]?.referralEarnings || 0,
      totalInvestments: investmentMap[user.id] || 0,
      referrals: referralMap[user.id] || [],
      referralsCount: (referralMap[user.id] || []).length
    }))

    return NextResponse.json({ users: enrichedUsers })
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { userId, isBlocked } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_blocked: isBlocked })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json(
        { error: 'Failed to update user status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`
    })
  } catch (error) {
    console.error('Admin users PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
