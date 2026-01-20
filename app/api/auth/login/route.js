import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { comparePassword, generateToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    console.log('Login attempt for email:', email)

    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (fetchError) {
      console.error('Database error:', fetchError)
    }

    if (!user) {
      console.log('User not found:', email)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('User found:', { id: user.id, email: user.email, isAdmin: user.is_admin })

    if (user.is_blocked) {
      console.log('User is blocked:', email)
      return NextResponse.json(
        { error: 'Your account has been blocked' },
        { status: 403 }
      )
    }

    console.log('Comparing passwords...')
    const isValidPassword = comparePassword(password, user.password)
    console.log('Password valid:', isValidPassword)

    if (!isValidPassword) {
      console.log('Invalid password for user:', email)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = generateToken({ userId: user.id, isAdmin: user.is_admin })
    console.log('Login successful for:', email)

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
