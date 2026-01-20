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

    // Fetch all withdrawals with user information
    // Use !withdrawals_user_id_fkey to specify which relationship (user who made the withdrawal)
    const { data: withdrawals, error } = await supabaseAdmin
      .from('withdrawals')
      .select(`
        id,
        user_id,
        amount,
        withdrawal_type,
        referral_amount,
        profit_amount,
        withdrawal_method,
        account_details,
        status,
        transaction_id,
        rejected_reason,
        created_at,
        updated_at,
        users:users!withdrawals_user_id_fkey (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching withdrawals:', error)
      return NextResponse.json(
        { error: 'Failed to fetch withdrawals' },
        { status: 500 }
      )
    }

    // Format the response
    const formattedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal.id,
      userId: withdrawal.user_id,
      userName: withdrawal.users?.name || 'Unknown',
      userEmail: withdrawal.users?.email || 'Unknown',
      amount: withdrawal.amount,
      withdrawal_type: withdrawal.withdrawal_type,
      referral_amount: withdrawal.referral_amount,
      profit_amount: withdrawal.profit_amount,
      payment_method: withdrawal.withdrawal_method,
      account_details: withdrawal.account_details,
      status: withdrawal.status,
      transaction_id: withdrawal.transaction_id,
      rejected_reason: withdrawal.rejected_reason,
      created_at: withdrawal.created_at,
      updated_at: withdrawal.updated_at
    }))

    return NextResponse.json({ withdrawals: formattedWithdrawals })
  } catch (error) {
    console.error('Admin withdrawals API error:', error)
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

    const { withdrawalId, status, transactionId, rejectedReason } = await req.json()

    if (!withdrawalId || !status) {
      return NextResponse.json(
        { error: 'Withdrawal ID and status are required' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get withdrawal details
    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('withdrawals')
      .select('id, user_id, amount, status, referral_amount, profit_amount, withdrawal_type')
      .eq('id', withdrawalId)
      .single()

    if (fetchError || !withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      )
    }

    // Prepare update object
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    }

    if (transactionId && status === 'approved') {
      updateData.transaction_id = transactionId
    }

    if (rejectedReason && status === 'rejected') {
      updateData.rejected_reason = rejectedReason
    }

    // Update withdrawal status
    const { error: updateError } = await supabaseAdmin
      .from('withdrawals')
      .update(updateData)
      .eq('id', withdrawalId)

    if (updateError) {
      console.error('Error updating withdrawal:', updateError)
      return NextResponse.json(
        { error: 'Failed to update withdrawal status' },
        { status: 500 }
      )
    }

    // If rejecting, refund the amount
    if (status === 'rejected' && withdrawal.status === 'pending') {
      const { data: user, error: userFetchError } = await supabaseAdmin
        .from('users')
        .select('wallet_balance, referral_earnings, withdrawn_email_earnings')
        .eq('id', withdrawal.user_id)
        .single()

      if (userFetchError) {
        console.error('Error fetching user:', userFetchError)
        return NextResponse.json(
          { error: 'Failed to refund amount' },
          { status: 500 }
        )
      }

      // Calculate refund amounts based on withdrawal type
      const currentWalletBalance = parseFloat(user.wallet_balance || 0)
      const currentReferralEarnings = parseFloat(user.referral_earnings || 0)
      const currentWithdrawnEmailEarnings = parseFloat(user.withdrawn_email_earnings || 0)

      const referralRefund = parseFloat(withdrawal.referral_amount || 0)
      const profitRefund = parseFloat(withdrawal.profit_amount || 0)

      // Calculate email earnings refund (part of profit_amount)
      const emailEarningsRefund = withdrawal.withdrawal_type === 'investment_profit' && withdrawal.referral_amount === 0
        ? profitRefund
        : 0

      const depositRefund = profitRefund - emailEarningsRefund

      const newWalletBalance = currentWalletBalance + depositRefund
      const newReferralEarnings = currentReferralEarnings + referralRefund
      const newWithdrawnEmailEarnings = Math.max(0, currentWithdrawnEmailEarnings - emailEarningsRefund)

      // Update user balance
      const { error: userUpdateError } = await supabaseAdmin
        .from('users')
        .update({
          wallet_balance: newWalletBalance,
          referral_earnings: newReferralEarnings,
          withdrawn_email_earnings: newWithdrawnEmailEarnings,
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawal.user_id)

      if (userUpdateError) {
        console.error('Error updating user balance:', userUpdateError)
        return NextResponse.json(
          { error: 'Failed to refund amount' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Withdrawal rejected and amount refunded',
        refundDetails: {
          totalRefund: parseFloat(withdrawal.amount),
          depositRefund,
          referralRefund,
          emailEarningsRefund
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Withdrawal ${status} successfully`
    })
  } catch (error) {
    console.error('Admin withdrawals PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { withdrawalId } = await req.json()

    if (!withdrawalId) {
      return NextResponse.json(
        { error: 'Withdrawal ID is required' },
        { status: 400 }
      )
    }

    // Get withdrawal details first
    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('withdrawals')
      .select('id, user_id, amount, status')
      .eq('id', withdrawalId)
      .single()

    if (fetchError || !withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      )
    }

    // Delete the withdrawal
    const { error: deleteError } = await supabaseAdmin
      .from('withdrawals')
      .delete()
      .eq('id', withdrawalId)

    if (deleteError) {
      console.error('Error deleting withdrawal:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete withdrawal' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal deleted successfully'
    })
  } catch (error) {
    console.error('Admin withdrawals DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
