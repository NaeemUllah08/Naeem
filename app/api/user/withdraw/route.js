import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST - Create withdrawal request
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

    const { amount, withdrawalMethod, accountDetails, bankName } = await request.json()

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (!withdrawalMethod || !accountDetails) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate bank name if bank transfer is selected
    if (withdrawalMethod === 'bank' && !bankName) {
      return NextResponse.json({ error: 'Bank name is required for bank transfers' }, { status: 400 })
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

    // Get email earnings
    const { data: emailStats } = await supabaseAdmin
      .rpc('get_user_email_stats', { p_user_id: user.id })

    const totalEmailEarned = parseFloat(emailStats?.[0]?.total_earned || 0)
    const withdrawnEmailEarnings = parseFloat(user.withdrawn_email_earnings || 0)
    const emailEarnings = Math.max(0, totalEmailEarned - withdrawnEmailEarnings) // Available email earnings
    const depositBalance = parseFloat(user.wallet_balance || 0)
    const referralEarnings = parseFloat(user.referral_earnings || 0)
    const totalBalance = depositBalance + referralEarnings + emailEarnings

    // Check if user has sufficient balance
    if (amount > totalBalance) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Validate minimum withdrawal amount based on earning source
    // If withdrawing more than email earnings, enforce Rs. 500 minimum for the excess
    const otherEarnings = depositBalance + referralEarnings
    if (amount > emailEarnings) {
      const amountFromOther = amount - emailEarnings
      if (amountFromOther < 500 && otherEarnings > 0) {
        return NextResponse.json(
          { error: 'Minimum withdrawal from deposits/referrals is Rs. 500' },
          { status: 400 }
        )
      }
    }

    // Format withdrawal method for database
    let withdrawalMethodStr = withdrawalMethod
    if (withdrawalMethod === 'bank') {
      withdrawalMethodStr = `Bank Transfer - ${bankName}`
    } else if (withdrawalMethod === 'easypaisa') {
      withdrawalMethodStr = 'Easypaisa'
    } else if (withdrawalMethod === 'jazzcash') {
      withdrawalMethodStr = 'JazzCash'
    }

    // Calculate deductions from each source
    // Priority: Email earnings first, then deposits, then referrals
    let remainingAmount = amount
    let newEmailEarnings = emailEarnings
    let newDepositBalance = depositBalance
    let newReferralEarnings = referralEarnings

    let emailDeducted = 0
    let depositDeducted = 0
    let referralDeducted = 0
    let profitDeducted = 0 // For investment profits (deposits in this case)

    // Deduct from email earnings first
    if (remainingAmount > 0 && emailEarnings > 0) {
      const deductFromEmail = Math.min(remainingAmount, emailEarnings)
      emailDeducted = deductFromEmail
      newEmailEarnings -= deductFromEmail
      remainingAmount -= deductFromEmail
    }

    // Then deduct from deposit balance (investment profits)
    if (remainingAmount > 0 && depositBalance > 0) {
      const deductFromDeposit = Math.min(remainingAmount, depositBalance)
      depositDeducted = deductFromDeposit
      profitDeducted = deductFromDeposit
      newDepositBalance -= deductFromDeposit
      remainingAmount -= deductFromDeposit
    }

    // Finally deduct from referral earnings
    if (remainingAmount > 0 && referralEarnings > 0) {
      const deductFromReferral = Math.min(remainingAmount, referralEarnings)
      referralDeducted = deductFromReferral
      newReferralEarnings -= deductFromReferral
      remainingAmount -= deductFromReferral
    }

    // Determine withdrawal type based on what was deducted
    let withdrawalType
    if (referralDeducted > 0 && profitDeducted > 0) {
      withdrawalType = 'both'
    } else if (referralDeducted > 0) {
      withdrawalType = 'referral_earnings'
    } else {
      withdrawalType = 'investment_profit'
    }

    // Create withdrawal record
    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount: amount,
        withdrawal_type: withdrawalType,
        referral_amount: referralDeducted,
        profit_amount: profitDeducted + emailDeducted, // Email earnings count as profit
        withdrawal_method: withdrawalMethodStr,
        account_details: accountDetails,
        status: 'pending',
        transaction_id: null
      })
      .select()
      .single()

    if (withdrawalError) {
      console.error('Error creating withdrawal:', withdrawalError)
      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      )
    }

    // Update user balance including email earnings withdrawals
    const newWithdrawnEmailEarnings = withdrawnEmailEarnings + emailDeducted

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        wallet_balance: newDepositBalance,
        referral_earnings: newReferralEarnings,
        withdrawn_email_earnings: newWithdrawnEmailEarnings
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user balance:', updateError)
      console.error('Update error details:', JSON.stringify(updateError, null, 2))
      // Rollback withdrawal creation
      await supabaseAdmin.from('withdrawals').delete().eq('id', withdrawal.id)
      return NextResponse.json(
        { error: 'Failed to update balance: ' + updateError.message },
        { status: 500 }
      )
    }

    // Calculate new total balance
    const newTotalBalance = newDepositBalance + newReferralEarnings + newEmailEarnings

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        withdrawalMethod: withdrawal.withdrawal_method,
        status: withdrawal.status,
        createdAt: withdrawal.created_at
      },
      updatedBalances: {
        totalBalance: newTotalBalance,
        emailEarnings: newEmailEarnings,
        otherEarnings: newDepositBalance + newReferralEarnings,
        depositBalance: newDepositBalance,
        referralEarnings: newReferralEarnings
      }
    })

  } catch (error) {
    console.error('Withdrawal API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
