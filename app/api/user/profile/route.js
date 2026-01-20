// app/api/user/profile/route.js

import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const userId = decoded.userId

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, referral_code, referred_by, wallet_balance, referral_earnings, total_invested, total_withdrawn, created_at')
      .eq('id', userId)
      .eq('is_blocked', false)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get referrer information if user was referred by someone
    let referrerInfo = null
    if (user.referred_by) {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('id, name, email, referral_code')
        .eq('referral_code', user.referred_by)
        .single()

      if (referrer) {
        referrerInfo = {
          name: referrer.name,
          email: referrer.email,
          referralCode: referrer.referral_code
        }
      }
    }

    return NextResponse.json({
      user: {
        name: user.name || '',
        email: user.email || '',
        referralCode: user.referral_code || '',
        createdAt: user.created_at,
        wallet_balance: Number(user.wallet_balance) || 0,
        referral_earnings: Number(user.referral_earnings) || 0,
        total_invested: Number(user.total_invested) || 0,
        total_withdrawn: Number(user.total_withdrawn) || 0,
        referredBy: referrerInfo
      }
    })

  } catch (error) {
    console.error('Profile API Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}