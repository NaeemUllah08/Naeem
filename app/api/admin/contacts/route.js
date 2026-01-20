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

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (userId) {
      // Fetch contacts for specific user
      const { data: contacts, error } = await supabaseAdmin
        .from('contacts')
        .select(`
          *,
          user:users(id, name, email)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user contacts:', error)
        return NextResponse.json(
          { error: 'Failed to fetch contacts' },
          { status: 500 }
        )
      }

      return NextResponse.json({ contacts: contacts || [] })
    } else {
      // Fetch all users with contact count
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          name,
          email,
          created_at,
          is_admin,
          contacts:contacts(count)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
          { error: 'Failed to fetch users' },
          { status: 500 }
        )
      }

      const formattedUsers = (users || []).map(user => ({
        ...user,
        contactCount: user.contacts?.[0]?.count || 0
      }))

      return NextResponse.json({ users: formattedUsers })
    }
  } catch (error) {
    console.error('Admin contacts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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

    const { userId, subject, message, status } = await req.json()

    if (!userId || !subject || !message) {
      return NextResponse.json(
        { error: 'User ID, subject, and message are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .insert([{
        user_id: userId,
        subject,
        message,
        status: status || 'pending',
        admin_id: authResult.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating contact:', error)
      return NextResponse.json(
        { error: 'Failed to create contact' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contact created successfully',
      contact: data
    })
  } catch (error) {
    console.error('Admin contacts POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { contactId, status, response } = await req.json()

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    const updateData = {
      updated_at: new Date().toISOString()
    }

    if (status !== undefined) updateData.status = status
    if (response !== undefined) updateData.admin_response = response

    const { error } = await supabaseAdmin
      .from('contacts')
      .update(updateData)
      .eq('id', contactId)

    if (error) {
      console.error('Error updating contact:', error)
      return NextResponse.json(
        { error: 'Failed to update contact' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contact updated successfully'
    })
  } catch (error) {
    console.error('Admin contacts PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { searchParams } = new URL(req.url)
    const contactId = searchParams.get('contactId')

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('contacts')
      .delete()
      .eq('id', contactId)

    if (error) {
      console.error('Error deleting contact:', error)
      return NextResponse.json(
        { error: 'Failed to delete contact' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully'
    })
  } catch (error) {
    console.error('Admin contacts DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
