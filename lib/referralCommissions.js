import { supabaseAdmin } from './supabase'

/**
 * Calculate and credit referral commission when a referral makes a deposit
 * @param {string} userId - ID of the user who made the deposit
 * @param {number} depositAmount - Amount of the deposit
 * @param {number} commissionPercentage - Commission percentage (default 7%)
 * @returns {Promise<{success: boolean, commission?: number, referrerId?: string, error?: string}>}
 */
export async function creditReferralCommission(userId, depositAmount, commissionPercentage = 7) {
  try {
    // Get the user who made the deposit
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('referred_by, name')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.log('User not found or error fetching user:', userError)
      return { success: false, error: 'User not found' }
    }

    // Check if user was referred by someone
    if (!user.referred_by) {
      console.log('User was not referred by anyone')
      return { success: true, commission: 0, message: 'No referrer' }
    }

    // Get the referrer
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('users')
      .select('id, name, referral_earnings, wallet_balance')
      .eq('referral_code', user.referred_by)
      .single()

    if (referrerError || !referrer) {
      console.log('Referrer not found:', referrerError)
      return { success: false, error: 'Referrer not found' }
    }

    // Calculate commission
    const commissionAmount = (depositAmount * commissionPercentage) / 100

    // Update referrer's earnings and wallet balance
    const newReferralEarnings = (parseFloat(referrer.referral_earnings) || 0) + commissionAmount
    const newWalletBalance = (parseFloat(referrer.wallet_balance) || 0) + commissionAmount

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        referral_earnings: newReferralEarnings,
        wallet_balance: newWalletBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', referrer.id)

    if (updateError) {
      console.error('Error updating referrer earnings:', updateError)
      return { success: false, error: 'Failed to update referrer earnings' }
    }

    // Also update the wallets table if it exists
    const { error: walletUpdateError } = await supabaseAdmin
      .from('wallets')
      .update({
        balance: newWalletBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', referrer.id)

    if (walletUpdateError) {
      console.log('Wallets table update error (may not exist):', walletUpdateError)
      // Don't fail if wallets table doesn't exist or update fails
    }

    // Create a transaction record for the referral commission
    await supabaseAdmin
      .from('referral_transactions')
      .insert({
        referrer_id: referrer.id,
        referred_user_id: userId,
        deposit_amount: depositAmount,
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount,
        status: 'completed',
        created_at: new Date().toISOString()
      })

    console.log(`Referral commission credited: ${referrer.name} earned ${commissionAmount} from ${user.name}'s deposit of ${depositAmount}`)

    return {
      success: true,
      commission: commissionAmount,
      referrerId: referrer.id,
      referrerName: referrer.name
    }
  } catch (error) {
    console.error('Error in creditReferralCommission:', error)
    return { success: false, error: error.message }
  }
}
