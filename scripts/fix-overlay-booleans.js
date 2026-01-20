/**
 * Fix boolean values in page_overlay_settings table
 * Run this script with: node scripts/fix-overlay-booleans.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixBooleanValues() {
  console.log('Starting to fix boolean values in page_overlay_settings...\n')

  try {
    // Fetch all current settings
    console.log('Fetching current settings...')
    const { data: currentSettings, error: fetchError } = await supabase
      .from('page_overlay_settings')
      .select('*')
      .order('page_name')

    if (fetchError) {
      console.error('Error fetching settings:', fetchError.message)
      process.exit(1)
    }

    console.log(`Found ${currentSettings.length} page settings\n`)

    // Display current state
    console.log('=== BEFORE FIX ===')
    console.table(currentSettings.map(s => ({
      Page: s.page_name,
      Enabled: s.enabled,
      Type: typeof s.enabled,
      Text: s.overlay_text
    })))

    // Fix each setting
    console.log('\nFixing boolean values...')
    let fixedCount = 0
    let errorCount = 0

    for (const setting of currentSettings) {
      // Convert to proper boolean
      const properBoolean = setting.enabled === true || setting.enabled === 'true'

      const { error: updateError } = await supabase
        .from('page_overlay_settings')
        .update({
          enabled: properBoolean,
          updated_at: new Date().toISOString()
        })
        .eq('page_name', setting.page_name)

      if (updateError) {
        console.error(`✗ Failed to fix ${setting.page_name}:`, updateError.message)
        errorCount++
      } else {
        console.log(`✓ Fixed ${setting.page_name}: ${setting.enabled} → ${properBoolean}`)
        fixedCount++
      }
    }

    // Fetch updated settings
    console.log('\n=== AFTER FIX ===')
    const { data: updatedSettings, error: fetchError2 } = await supabase
      .from('page_overlay_settings')
      .select('*')
      .order('page_name')

    if (fetchError2) {
      console.error('Error fetching updated settings:', fetchError2.message)
    } else {
      console.table(updatedSettings.map(s => ({
        Page: s.page_name,
        Enabled: s.enabled,
        Type: typeof s.enabled,
        Text: s.overlay_text
      })))
    }

    console.log(`\n=== SUMMARY ===`)
    console.log(`✓ Fixed: ${fixedCount}/${currentSettings.length}`)
    if (errorCount > 0) {
      console.log(`✗ Errors: ${errorCount}`)
    }
    console.log('\n✓ Boolean fix complete!')
  } catch (error) {
    console.error('\n✗ Unexpected error:', error.message)
    process.exit(1)
  }
}

fixBooleanValues()
