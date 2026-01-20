import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { adminMiddleware } from '@/lib/middleware'
import { creditReferralCommission } from '@/lib/referralCommissions'

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

    // Fetch all deposits with user information
    const { data: deposits, error } = await supabaseAdmin
      .from('deposits')
      .select(`
        id,
        user_id,
        amount,
        payment_method,
        transaction_id,
        status,
        created_at,
        updated_at,
        users (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching deposits:', error)
      return NextResponse.json(
        { error: 'Failed to fetch deposits' },
        { status: 500 }
      )
    }

    // Format the response
    const formattedDeposits = deposits.map(deposit => ({
      id: deposit.id,
      userId: deposit.user_id,
      userName: deposit.users?.name || 'Unknown',
      userEmail: deposit.users?.email || 'Unknown',
      amount: deposit.amount,
      payment_method: deposit.payment_method,
      transaction_id: deposit.transaction_id,
      status: deposit.status,
      created_at: deposit.created_at,
      updated_at: deposit.updated_at
    }))

    return NextResponse.json({ deposits: formattedDeposits })
  } catch (error) {
    console.error('Admin deposits API error:', error)
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

    const { depositId, status } = await req.json()

    if (!depositId || !status) {
      return NextResponse.json(
        { error: 'Deposit ID and status are required' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get deposit details
    const { data: deposit, error: fetchError } = await supabaseAdmin
      .from('deposits')
      .select('id, user_id, amount, status')
      .eq('id', depositId)
      .single()

    if (fetchError || !deposit) {
      return NextResponse.json(
        { error: 'Deposit not found' },
        { status: 404 }
      )
    }

    // If approving, update wallet balance
    if (status === 'approved' && deposit.status !== 'approved') {
      // Update deposit status
      const { error: updateError } = await supabaseAdmin
        .from('deposits')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', depositId)

      if (updateError) {
        console.error('Error updating deposit:', updateError)
        return NextResponse.json(
          { error: 'Failed to approve deposit' },
          { status: 500 }
        )
      }

      // Get current wallet balance
      const { data: wallet, error: walletFetchError } = await supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('user_id', deposit.user_id)
        .single()

      if (walletFetchError) {
        console.error('Error fetching wallet:', walletFetchError)
        return NextResponse.json(
          { error: 'Failed to update wallet balance' },
          { status: 500 }
        )
      }

      const currentBalance = parseFloat(wallet?.balance || 0)
      const newBalance = currentBalance + parseFloat(deposit.amount)

      // Update wallet balance
      const { error: walletUpdateError } = await supabaseAdmin
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', deposit.user_id)

      if (walletUpdateError) {
        console.error('Error updating wallet:', walletUpdateError)
        return NextResponse.json(
          { error: 'Failed to update wallet balance' },
          { status: 500 }
        )
      }

      // Credit referral commission if user was referred
      const commissionResult = await creditReferralCommission(deposit.user_id, deposit.amount)

      let responseMessage = 'Deposit approved and wallet updated successfully'
      if (commissionResult.success && commissionResult.commission > 0) {
        responseMessage += `. Referral commission of Rs. ${commissionResult.commission.toFixed(2)} credited to ${commissionResult.referrerName}`
      }

      return NextResponse.json({
        success: true,
        message: responseMessage,
        newBalance,
        referralCommission: commissionResult
      })
    } else {
      // Just update the status
      const { error: updateError } = await supabaseAdmin
        .from('deposits')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', depositId)

      if (updateError) {
        console.error('Error updating deposit:', updateError)
        return NextResponse.json(
          { error: 'Failed to update deposit status' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Deposit ${status} successfully`
      })
    }
  } catch (error) {
    console.error('Admin deposits PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
