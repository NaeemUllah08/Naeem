import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Fetch all page overlay settings (public endpoint for users)
export async function GET() {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('page_overlay_settings')
      .select('page_name, enabled, overlay_text')
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
        enabled: Boolean(setting.enabled),
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
