import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { adminMiddleware } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Fetch all page overlay settings
export async function GET(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { data: settings, error } = await supabaseAdmin
      .from('page_overlay_settings')
      .select('*')
      .order('page_name', { ascending: true })

    if (error) {
      console.error('Error fetching page overlay settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    // Format settings as an object for easier use
    const formattedSettings = {}
    settings.forEach(setting => {
      formattedSettings[setting.page_name] = {
        enabled: Boolean(setting.enabled),  // Simply convert to boolean
        text: setting.overlay_text
      }
    })

    return NextResponse.json({ settings: formattedSettings })
  } catch (error) {
    console.error('Page overlay settings GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Update all page overlay settings
export async function POST(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { settings } = await req.json()

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      )
    }

    // Update each page setting
    const updates = []
    for (const [pageName, config] of Object.entries(settings)) {
      updates.push(
        supabaseAdmin
          .from('page_overlay_settings')
          .upsert({
            page_name: pageName,
            enabled: Boolean(config.enabled),  // Ensure boolean conversion
            overlay_text: config.text,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'page_name'
          })
      )
    }

    // Execute all updates
    const results = await Promise.all(updates)

    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      console.error('Error updating settings:', errors)
      return NextResponse.json(
        { error: 'Failed to update some settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('Page overlay settings POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
