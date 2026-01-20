import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { adminMiddleware } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Fetch all orders
export async function GET(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        user:users(id, name, email),
        payment_method:payment_methods(name, account_title, account_number, bank_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    // Parse items JSON
    const processedOrders = (orders || []).map(order => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    }))

    return NextResponse.json({ orders: processedOrders })
  } catch (error) {
    console.error('Admin orders GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update order status
export async function PATCH(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { orderId, status, paymentStatus, trackingNumber, notes } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const updateData = { updated_at: new Date().toISOString() }
    if (status !== undefined) updateData.status = status
    if (paymentStatus !== undefined) updateData.payment_status = paymentStatus
    if (trackingNumber !== undefined) updateData.tracking_number = trackingNumber
    if (notes !== undefined) updateData.admin_notes = notes

    const { error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (error) {
      console.error('Error updating order:', error)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully'
    })
  } catch (error) {
    console.error('Admin orders PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete order
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
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (error) {
      console.error('Error deleting order:', error)
      return NextResponse.json(
        { error: 'Failed to delete order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    })
  } catch (error) {
    console.error('Admin orders DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
