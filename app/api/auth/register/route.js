import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, generateReferralCode } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const { name, email, password, referredBy } = await req.json()

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Validate referral code if provided
    if (referredBy) {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('referral_code', referredBy)
        .single()

      if (!referrer) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        )
      }
    }

    const hashedPassword = hashPassword(password)
    const referralCode = generateReferralCode(name)

    // Create new user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        referral_code: referralCode,
        referred_by: referredBy || null,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(
      { message: 'User registered successfully', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
