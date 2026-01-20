import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Debug database state
export async function GET(request) {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      checks: {}
    }

    // 1. Check if withdrawn_email_earnings column exists by trying to select it
    console.log('=== CHECKING DATABASE STATE ===')

    try {
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, wallet_balance, referral_earnings, withdrawn_email_earnings')
        .limit(1)
        .single()

      if (userError) {
        results.checks.withdrawn_email_earnings_column = {
          status: 'error',
          message: userError.message,
          hint: userError.hint,
          details: userError.details
        }

        if (userError.message.includes('column') || userError.code === '42703') {
          results.checks.withdrawn_email_earnings_column.diagnosis = 'COLUMN DOES NOT EXIST - MIGRATION NEEDED'
        }
      } else {
        results.checks.withdrawn_email_earnings_column = {
          status: 'success',
          message: 'Column exists',
          value: user.withdrawn_email_earnings
        }
      }
    } catch (err) {
      results.checks.withdrawn_email_earnings_column = {
        status: 'error',
        message: err.message
      }
    }

    // 2. Check withdrawals table
    const { data: withdrawals, error: withdrawalError } = await supabaseAdmin
      .from('withdrawals')
      .select('id, user_id, amount, status, created_at')
      .limit(10)

    results.checks.withdrawals_table = {
      status: withdrawalError ? 'error' : 'success',
      count: withdrawals?.length || 0,
      error: withdrawalError?.message,
      data: withdrawals
    }

    // 3. Check users table basic access
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, wallet_balance, referral_earnings')
      .limit(5)

    results.checks.users_table = {
      status: usersError ? 'error' : 'success',
      count: users?.length || 0,
      error: usersError?.message
    }

    // 4. Check email_service RPC function
    if (users && users.length > 0) {
      const testUserId = users[0].id
      const { data: emailStats, error: emailError } = await supabaseAdmin
        .rpc('get_user_email_stats', { p_user_id: testUserId })

      results.checks.email_stats_rpc = {
        status: emailError ? 'error' : 'success',
        error: emailError?.message,
        sample_data: emailStats?.[0]
      }
    }

    // 5. Recommendation
    if (results.checks.withdrawn_email_earnings_column?.status === 'error') {
      results.recommendation = {
        action: 'RUN_MIGRATION',
        sql: `
-- Run this SQL in your Supabase SQL Editor:

ALTER TABLE users
ADD COLUMN IF NOT EXISTS withdrawn_email_earnings DECIMAL(12, 2) DEFAULT 0.00 NOT NULL;

COMMENT ON COLUMN users.withdrawn_email_earnings IS 'Total amount withdrawn from email earnings to track available balance';

CREATE INDEX IF NOT EXISTS idx_users_withdrawn_email_earnings ON users(withdrawn_email_earnings);
        `.trim()
      }
    } else {
      results.recommendation = {
        action: 'COLUMN_EXISTS',
        message: 'The withdrawn_email_earnings column exists. If withdrawals are still not working, check the console logs for other errors.'
      }
    }

    console.log('Database check results:', JSON.stringify(results, null, 2))

    return NextResponse.json(results, { status: 200 })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check database state',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}
