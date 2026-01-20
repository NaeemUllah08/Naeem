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
    const categoryId = searchParams.get('categoryId')

    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        category:product_categories(id, name)
      `)
      .order('created_at', { ascending: false })

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    return NextResponse.json({ products: products || [] })
  } catch (error) {
    console.error('Admin products API error:', error)
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

    const body = await req.json()
    const {
      categoryId,
      name,
      description,
      price,
      discountPrice,
      discountPercentage,
      details,
      features,
      image,
      isActive
    } = body

    if (!categoryId || !name || !price) {
      return NextResponse.json(
        { error: 'Category, name, and price are required' },
        { status: 400 }
      )
    }

    const insertData = {
      category_id: categoryId,
      name,
      description: description || null,
      is_active: isActive !== undefined ? isActive : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add pricing columns
    if (price) insertData.regular_price = parseFloat(price)
    if (price) insertData.price = parseFloat(price) // Add both for compatibility
    if (discountPrice) insertData.sale_price = parseFloat(discountPrice)
    if (discountPrice) insertData.discount_price = parseFloat(discountPrice) // Add both for compatibility
    if (discountPercentage) insertData.discount_percentage = parseFloat(discountPercentage)

    // Add optional fields (explicitly handle all cases)
    insertData.details = details || null
    insertData.features = features || null

    // Handle image: if null, empty string, or undefined, set to null; otherwise keep the value
    if (image !== undefined) {
      insertData.image_url = (image === null || image === '') ? null : image
    } else {
      insertData.image_url = null
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: `Failed to create product: ${error.message || 'Database error'}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product: data
    })
  } catch (error) {
    console.error('Admin products POST error:', error)
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

    const body = await req.json()
    const {
      productId,
      categoryId,
      name,
      description,
      price,
      discountPrice,
      discountPercentage,
      details,
      features,
      image,
      isActive
    } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const updateData = {
      updated_at: new Date().toISOString()
    }

    if (categoryId !== undefined) updateData.category_id = categoryId
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description

    // Add pricing columns (both versions for compatibility)
    if (price !== undefined) {
      updateData.price = parseFloat(price)
      updateData.regular_price = parseFloat(price)
    }
    if (discountPrice !== undefined) {
      const discountVal = discountPrice ? parseFloat(discountPrice) : null
      updateData.discount_price = discountVal
      updateData.sale_price = discountVal
    }
    if (discountPercentage !== undefined) {
      updateData.discount_percentage = discountPercentage ? parseFloat(discountPercentage) : null
    }

    // Handle optional fields explicitly
    if (details !== undefined) updateData.details = details || null
    if (features !== undefined) updateData.features = features || null

    // Handle image: if null, empty string, or explicitly set to null, set to null; otherwise keep the value
    if (image !== undefined) {
      updateData.image_url = (image === null || image === '') ? null : image
    }

    if (isActive !== undefined) updateData.is_active = isActive

    const { error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', productId)

    if (error) {
      return NextResponse.json(
        { error: `Failed to update product: ${error.message || 'Database error'}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully'
    })
  } catch (error) {
    console.error('Admin products PATCH error:', error)
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
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('Error deleting product:', error)
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Admin products DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
