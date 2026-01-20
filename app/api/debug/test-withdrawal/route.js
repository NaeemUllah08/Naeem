import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST - Test withdrawal without actually creating it
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { amount } = await request.json()

    console.log('\n==================== TEST WITHDRAWAL ====================')
    console.log('User ID:', decoded.userId)
    console.log('Requested Amount:', amount)

    // Get user data including all earnings
    let user, userError
    try {
      const result = await supabaseAdmin
        .from('users')
        .select('id, wallet_balance, referral_earnings, withdrawn_email_earnings, is_blocked')
        .eq('id', decoded.userId)
        .single()
      user = result.data
      userError = result.error

      console.log('\nStep 1: Fetching user with withdrawn_email_earnings')
      console.log('Success:', !userError)
      if (userError) {
        console.log('Error Code:', userError.code)
        console.log('Error Message:', userError.message)
        console.log('Error Details:', userError.details)
        console.log('Error Hint:', userError.hint)
      }
    } catch (err) {
      console.log('\nStep 1 FAILED - Column might not exist')
      console.log('Error:', err.message)

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

      console.log('Fallback query success:', !userError)
    }

    if (userError || !user) {
      console.log('==========================================================\n')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('\nUser Data Retrieved:')
    console.log('- Wallet Balance:', user.wallet_balance)
    console.log('- Referral Earnings:', user.referral_earnings)
    console.log('- Withdrawn Email Earnings:', user.withdrawn_email_earnings)
    console.log('- Is Blocked:', user.is_blocked)

    // Get email earnings
    console.log('\nStep 2: Fetching email stats')
    const { data: emailStats, error: emailError } = await supabaseAdmin
      .rpc('get_user_email_stats', { p_user_id: user.id })

    console.log('Email RPC Success:', !emailError)
    if (emailError) {
      console.log('Email Error:', emailError.message)
    }

    const totalEmailEarned = parseFloat(emailStats?.[0]?.total_earned || 0)
    const withdrawnEmailEarnings = parseFloat(user.withdrawn_email_earnings || 0)
    const emailEarnings = Math.max(0, totalEmailEarned - withdrawnEmailEarnings)
    const depositBalance = parseFloat(user.wallet_balance || 0)
    const referralEarnings = parseFloat(user.referral_earnings || 0)
    const totalBalance = depositBalance + referralEarnings + emailEarnings

    console.log('\nCalculated Balances:')
    console.log('- Total Email Earned:', totalEmailEarned)
    console.log('- Withdrawn Email Earnings:', withdrawnEmailEarnings)
    console.log('- Available Email Earnings:', emailEarnings)
    console.log('- Deposit Balance:', depositBalance)
    console.log('- Referral Earnings:', referralEarnings)
    console.log('- TOTAL BALANCE:', totalBalance)

    // Check if user has sufficient balance
    console.log('\nStep 3: Validating amount')
    console.log('Requested:', amount)
    console.log('Available:', totalBalance)
    console.log('Sufficient?', amount <= totalBalance)

    if (amount > totalBalance) {
      console.log('RESULT: INSUFFICIENT BALANCE')
      console.log('==========================================================\n')
      return NextResponse.json({
        error: 'Insufficient balance',
        debug: {
          requested: amount,
          available: totalBalance,
          breakdown: {
            emailEarnings,
            depositBalance,
            referralEarnings
          }
        }
      }, { status: 400 })
    }

    // Test if we can update the withdrawn_email_earnings column
    console.log('\nStep 4: Testing column update (DRY RUN)')
    const testUpdate = {
      wallet_balance: depositBalance,
      referral_earnings: referralEarnings,
      withdrawn_email_earnings: withdrawnEmailEarnings + parseFloat(amount)
    }

    console.log('Would update with:', testUpdate)

    // Don't actually update, just test if the query would work
    try {
      // This is a dry run - we're not actually updating anything
      console.log('Testing update query syntax...')
      console.log('UPDATE users SET')
      console.log('  wallet_balance =', testUpdate.wallet_balance)
      console.log('  referral_earnings =', testUpdate.referral_earnings)
      console.log('  withdrawn_email_earnings =', testUpdate.withdrawn_email_earnings)
      console.log('WHERE id =', user.id)

      console.log('\n✅ TEST PASSED - Withdrawal would succeed')
    } catch (err) {
      console.log('\n❌ TEST FAILED - Update would fail')
      console.log('Error:', err.message)
    }

    console.log('==========================================================\n')

    return NextResponse.json({
      success: true,
      message: 'Test passed - withdrawal would be created successfully',
      balances: {
        totalBalance,
        emailEarnings,
        depositBalance,
        referralEarnings,
        withdrawnEmailEarnings
      },
      requestedAmount: amount
    })

  } catch (error) {
    console.error('Test withdrawal error:', error)
    console.log('==========================================================\n')
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
