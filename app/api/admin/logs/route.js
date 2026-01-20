import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { adminMiddleware } from '@/lib/middleware'

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

    // Check if admin_logs table exists, if not return empty array
    const { data: logs, error } = await supabaseAdmin
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      // If table doesn't exist, return empty logs
      console.log('Admin logs table not found or error:', error)
      return NextResponse.json({ logs: [] })
    }

    // Format the response
    const formattedLogs = (logs || []).map(log => ({
      id: log.id,
      adminId: log.admin_id,
      action: log.action,
      description: log.description,
      ipAddress: log.ip_address,
      createdAt: log.created_at
    }))

    return NextResponse.json({ logs: formattedLogs })
  } catch (error) {
    console.error('Admin logs API error:', error)
    // Return empty logs on error instead of failing
    return NextResponse.json({ logs: [] })
  }
}

export async function POST(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { action, description, ipAddress } = await req.json()

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Check if admin_logs table exists
    const { data, error } = await supabaseAdmin
      .from('admin_logs')
      .insert([{
        admin_id: authResult.user.id,
        action,
        description: description || null,
        ip_address: ipAddress || null,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating log:', error)
      // Don't fail if logging doesn't work
      return NextResponse.json({
        success: true,
        message: 'Action completed (logging skipped)'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Log created successfully',
      log: data
    })
  } catch (error) {
    console.error('Admin logs POST error:', error)
    // Don't fail if logging doesn't work
    return NextResponse.json({
      success: true,
      message: 'Action completed (logging skipped)'
    })
  }
}
