// Diagnostic script to check database state
import { supabaseAdmin } from './lib/supabase.js'

async function checkDatabaseState() {
  console.log('\n========================================')
  console.log('DATABASE STATE CHECK')
  console.log('========================================\n')

  try {
    // 1. Check if withdrawn_email_earnings column exists
    console.log('1. Checking if withdrawn_email_earnings column exists...')
    const { data: columns, error: columnError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql_query: `
          SELECT column_name, data_type, column_default
          FROM information_schema.columns
          WHERE table_name = 'users'
          AND column_name = 'withdrawn_email_earnings';
        `
      })

    if (columnError) {
      console.log('   ❌ Cannot check (exec_sql not available)')
      console.log('   → Run this SQL manually in Supabase SQL Editor:')
      console.log('   SELECT column_name FROM information_schema.columns WHERE table_name = \'users\' AND column_name = \'withdrawn_email_earnings\';')
    } else {
      if (columns && columns.length > 0) {
        console.log('   ✅ Column EXISTS')
      } else {
        console.log('   ❌ Column DOES NOT EXIST - This is the problem!')
      }
    }

    // 2. Check users table structure
    console.log('\n2. Checking users table columns...')
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1)
      .single()

    if (userError) {
      console.log('   ❌ Error:', userError.message)
    } else if (user) {
      console.log('   ✅ Users table accessible')
      console.log('   Columns found:', Object.keys(user).join(', '))
      if ('withdrawn_email_earnings' in user) {
        console.log('   ✅ withdrawn_email_earnings column is present')
      } else {
        console.log('   ❌ withdrawn_email_earnings column is MISSING')
      }
    }

    // 3. Check withdrawals table
    console.log('\n3. Checking withdrawals table...')
    const { data: withdrawals, error: withdrawalError } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .limit(5)

    if (withdrawalError) {
      console.log('   ❌ Error:', withdrawalError.message)
    } else {
      console.log('   ✅ Withdrawals table accessible')
      console.log('   Total withdrawals found:', withdrawals?.length || 0)
      if (withdrawals && withdrawals.length > 0) {
        console.log('   Recent withdrawals:')
        withdrawals.forEach(w => {
          console.log(`   - User: ${w.user_id}, Amount: ${w.amount}, Status: ${w.status}`)
        })
      }
    }

    // 4. Check for specific user (from the logs)
    const testUserId = 'ccac01e4-efc2-4628-afc2-6866debac5d1'
    console.log(`\n4. Checking specific user: ${testUserId}`)

    const { data: testUser, error: testUserError } = await supabaseAdmin
      .from('users')
      .select('id, email, wallet_balance, referral_earnings, withdrawn_email_earnings')
      .eq('id', testUserId)
      .single()

    if (testUserError) {
      console.log('   ⚠️  User not found or error:', testUserError.message)
    } else if (testUser) {
      console.log('   ✅ User found:', testUser.email)
      console.log('   Wallet balance:', testUser.wallet_balance)
      console.log('   Referral earnings:', testUser.referral_earnings)
      if ('withdrawn_email_earnings' in testUser) {
        console.log('   Withdrawn email earnings:', testUser.withdrawn_email_earnings)
      } else {
        console.log('   ❌ withdrawn_email_earnings: COLUMN MISSING')
      }

      // Check email earnings
      const { data: emailStats } = await supabaseAdmin
        .rpc('get_user_email_stats', { p_user_id: testUser.id })

      if (emailStats && emailStats.length > 0) {
        console.log('   Email earnings (total):', emailStats[0].total_earned || 0)
      }
    }

    // 5. Try to get user withdrawals
    console.log(`\n5. Checking withdrawals for user: ${testUserId}`)
    const { data: userWithdrawals, error: userWithdrawalError } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('user_id', testUserId)

    if (userWithdrawalError) {
      console.log('   ❌ Error:', userWithdrawalError.message)
    } else {
      console.log('   ✅ Query successful')
      console.log('   Withdrawals found:', userWithdrawals?.length || 0)
      if (userWithdrawals && userWithdrawals.length > 0) {
        userWithdrawals.forEach(w => {
          console.log(`   - ID: ${w.id}, Amount: ${w.amount}, Status: ${w.status}, Date: ${w.created_at}`)
        })
      }
    }

    console.log('\n========================================')
    console.log('DIAGNOSIS COMPLETE')
    console.log('========================================\n')

    // Final recommendation
    console.log('RECOMMENDATION:')
    console.log('If "withdrawn_email_earnings" column is MISSING, run this SQL:')
    console.log('')
    console.log('ALTER TABLE users')
    console.log('ADD COLUMN IF NOT EXISTS withdrawn_email_earnings DECIMAL(12, 2) DEFAULT 0.00 NOT NULL;')
    console.log('')
    console.log('CREATE INDEX IF NOT EXISTS idx_users_withdrawn_email_earnings ON users(withdrawn_email_earnings);')
    console.log('')

  } catch (error) {
    console.error('❌ Script error:', error)
  }

  process.exit(0)
}

checkDatabaseState()
