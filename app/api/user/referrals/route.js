import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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

    // Get current user's referral code
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('referral_code, referral_earnings, referred_by')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all users who were referred by this user (using case-insensitive matching)
    const { data: referrals, error: referralsError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, created_at, is_blocked, total_invested')
      .ilike('referred_by', user.referral_code)
      .order('created_at', { ascending: false })

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError)
      return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 })
    }

    // Get referrer information if user was referred by someone
    let referrerInfo = null

    if (user.referred_by) {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('id, name, referral_code, referral_earnings, total_invested, created_at')
        .ilike('referral_code', user.referred_by)
        .single()

      if (referrer) {
        // Get referrer's total referrals count (case-insensitive)
        const { count: referrerReferralsCount } = await supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .ilike('referred_by', referrer.referral_code)

        referrerInfo = {
          name: referrer.name,
          referralCode: referrer.referral_code,
          totalReferrals: referrerReferralsCount || 0,
          totalEarnings: referrer.referral_earnings || 0,
          totalInvested: referrer.total_invested || 0,
          memberSince: referrer.created_at
        }
      }
    }

    // Format referrals for display with investment status
    const formattedReferrals = (referrals || []).map(ref => {
      let investmentStatus = 'Not Invested'
      if (ref.total_invested > 0) {
        investmentStatus = 'Invested'
      }

      return {
        id: ref.id,
        name: ref.name,
        createdAt: ref.created_at,
        status: ref.is_blocked ? 'Blocked' : (ref.total_invested > 0 ? 'Active' : 'Pending'),
        totalInvested: ref.total_invested || 0,
        investmentStatus: investmentStatus
      }
    })

    // Calculate stats
    const stats = {
      totalReferrals: formattedReferrals.length,
      totalEarnings: user.referral_earnings || 0,
      activeReferrals: formattedReferrals.filter(r => r.status === 'Active').length,
      pendingReferrals: formattedReferrals.filter(r => r.status === 'Pending').length
    }

    return NextResponse.json({
      referralCode: user.referral_code,
      referrals: formattedReferrals,
      stats,
      referredBy: referrerInfo
    })

  } catch (error) {
    console.error('Error in referrals API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
