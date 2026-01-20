import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Get withdrawal history
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

    // Get withdrawals
    console.log('==================== WITHDRAWALS FETCH ====================')
    console.log('Fetching withdrawals for user_id:', decoded.userId)
    console.log('Token payload:', decoded)

    const { data: withdrawals, error } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('user_id', decoded.userId)
      .order('created_at', { ascending: false })

    console.log('Query executed. Results:')
    console.log('- Error:', error)
    console.log('- Withdrawals count:', withdrawals?.length || 0)
    console.log('- Withdrawals data:', JSON.stringify(withdrawals, null, 2))
    console.log('==========================================================')

    if (error) {
      console.error('Error fetching withdrawals:', error)
      return NextResponse.json(
        { error: 'Failed to fetch withdrawals' },
        { status: 500 }
      )
    }

    // Format withdrawals for frontend
    const formattedWithdrawals = (withdrawals || []).map(withdrawal => ({
      id: withdrawal.id,
      amount: withdrawal.amount,
      withdrawalMethod: withdrawal.withdrawal_method,
      accountDetails: withdrawal.account_details,
      status: withdrawal.status,
      transactionId: withdrawal.transaction_id,
      createdAt: withdrawal.created_at
    }))

    return NextResponse.json({
      withdrawals: formattedWithdrawals
    })

  } catch (error) {
    console.error('Withdrawals API error:', error)
    return NextResponse.json(
      { error: 'Failed to load withdrawals' },
      { status: 500 }
    )
  }
}
