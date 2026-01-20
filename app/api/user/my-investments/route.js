import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Fetch user's investments
    const { data: investments, error } = await supabase
      .from('investments')
      .select(`
        *,
        investment_plans (
          name,
          profit_percentage
        )
      `)
      .eq('user_id', decoded.userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching investments:', error)
      return NextResponse.json({ error: 'Failed to fetch investments' }, { status: 500 })
    }

    // Process investments to include plan name and calculate expected profit
    const processedInvestments = (investments || []).map(inv => {
      const planName = inv.investment_plans?.name || 'Unknown Plan'
      const profitPercentage = inv.profit_percentage || inv.investment_plans?.profit_percentage || 0
      const expectedProfit = (inv.amount * profitPercentage) / 100

      return {
        ...inv,
        plan_name: planName,
        profit_percentage: profitPercentage,
        expected_profit: expectedProfit,
        profit_earned: inv.profit_earned || 0
      }
    })

    return NextResponse.json({ investments: processedInvestments })
  } catch (error) {
    console.error('Error in my-investments API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
