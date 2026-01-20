import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { adminMiddleware } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Fetch all shopping payment methods
export async function GET(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { data: paymentMethods, error } = await supabaseAdmin
      .from('shopping_payment_methods')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching shopping payment methods:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payment methods' },
        { status: 500 }
      )
    }

    return NextResponse.json({ paymentMethods: paymentMethods || [] })
  } catch (error) {
    console.error('Shopping payment methods GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new shopping payment method
export async function POST(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { name, accountTitle, accountNumber, bankName, instructions, isActive } = body

    if (!name || !accountNumber) {
      return NextResponse.json(
        { error: 'Name and account number are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('shopping_payment_methods')
      .insert([{
        name,
        account_title: accountTitle || '',
        account_number: accountNumber,
        bank_name: bankName || null,
        instructions: instructions || null,
        is_active: isActive !== undefined ? isActive : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating shopping payment method:', error)
      return NextResponse.json(
        { error: 'Failed to create payment method' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method created successfully',
      paymentMethod: data
    })
  } catch (error) {
    console.error('Shopping payment methods POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update shopping payment method
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
    const { id, name, accountTitle, accountNumber, bankName, instructions, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      )
    }

    const updateData = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name
    if (accountTitle !== undefined) updateData.account_title = accountTitle
    if (accountNumber !== undefined) updateData.account_number = accountNumber
    if (bankName !== undefined) updateData.bank_name = bankName
    if (instructions !== undefined) updateData.instructions = instructions
    if (isActive !== undefined) updateData.is_active = isActive

    const { error } = await supabaseAdmin
      .from('shopping_payment_methods')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating shopping payment method:', error)
      return NextResponse.json(
        { error: 'Failed to update payment method' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method updated successfully'
    })
  } catch (error) {
    console.error('Shopping payment methods PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete shopping payment method
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('shopping_payment_methods')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting shopping payment method:', error)
      return NextResponse.json(
        { error: 'Failed to delete payment method' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    })
  } catch (error) {
    console.error('Shopping payment methods DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
