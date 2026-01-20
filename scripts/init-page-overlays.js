/**
 * Initialize page overlay settings in the database
 * Run this script with: node scripts/init-page-overlays.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const pages = [
  { page_name: 'dashboard', enabled: false, overlay_text: 'Something amazing is coming!' },
  { page_name: 'deposits', enabled: false, overlay_text: 'Something amazing is coming!' },
  { page_name: 'investments', enabled: false, overlay_text: 'Something amazing is coming!' },
  { page_name: 'myInvestments', enabled: false, overlay_text: 'Something amazing is coming!' },
  { page_name: 'withdrawals', enabled: false, overlay_text: 'Something amazing is coming!' },
  { page_name: 'referrals', enabled: false, overlay_text: 'Something amazing is coming!' },
  { page_name: 'shopping', enabled: false, overlay_text: 'Something amazing is coming!' },
  { page_name: 'orders', enabled: false, overlay_text: 'Something amazing is coming!' },
  { page_name: 'emailSubmissions', enabled: false, overlay_text: 'Something amazing is coming!' },
  { page_name: 'profile', enabled: false, overlay_text: 'Something amazing is coming!' }
]

async function initializePageOverlays() {
  console.log('Starting page overlay initialization...\n')

  try {
    // Check if table exists by trying to query it
    console.log('Checking if page_overlay_settings table exists...')
    const { data: existingData, error: checkError } = await supabase
      .from('page_overlay_settings')
      .select('page_name')
      .limit(1)

    if (checkError) {
      console.error('Error: page_overlay_settings table does not exist or is not accessible')
      console.error('Please run the SQL migration file first: migrations/init_page_overlays.sql')
      console.error('Error details:', checkError.message)
      process.exit(1)
    }

    console.log('✓ Table exists\n')

    // Insert/update each page setting
    console.log('Upserting page overlay settings...')
    let successCount = 0
    let errorCount = 0

    for (const page of pages) {
      const { data, error } = await supabase
        .from('page_overlay_settings')
        .upsert(page, {
          onConflict: 'page_name',
          ignoreDuplicates: false
        })
        .select()

      if (error) {
        console.error(`✗ Failed to upsert ${page.page_name}:`, error.message)
        errorCount++
      } else {
        console.log(`✓ Successfully upserted: ${page.page_name}`)
        successCount++
      }
    }

    console.log(`\n=== Summary ===`)
    console.log(`✓ Success: ${successCount}/${pages.length} pages`)
    if (errorCount > 0) {
      console.log(`✗ Errors: ${errorCount}/${pages.length} pages`)
    }

    // Fetch and display current settings
    console.log('\n=== Current Settings ===')
    const { data: allSettings, error: fetchError } = await supabase
      .from('page_overlay_settings')
      .select('*')
      .order('page_name')

    if (fetchError) {
      console.error('Could not fetch settings:', fetchError.message)
    } else {
      console.table(allSettings.map(s => ({
        Page: s.page_name,
        Enabled: s.enabled,
        Text: s.overlay_text
      })))
    }

    console.log('\n✓ Page overlay initialization complete!')
  } catch (error) {
    console.error('\n✗ Unexpected error:', error.message)
    process.exit(1)
  }
}

initializePageOverlays()
