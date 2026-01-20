import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Fetch all active products with category information
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories(id, name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Process products to include category name and parse images
    const processedProducts = (products || []).map(product => {
      let imageUrl = null
      let category = 'Uncategorized'

      // Parse image URL
      if (product.image_url) {
        if (typeof product.image_url === 'string') {
          try {
            const images = JSON.parse(product.image_url)
            imageUrl = images[0]?.url
          } catch {
            imageUrl = product.image_url
          }
        } else if (Array.isArray(product.image_url)) {
          imageUrl = product.image_url[0]?.url
        }
      }

      // Get category name
      if (product.category?.name) {
        category = product.category.name
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price || product.regular_price,
        sale_price: product.sale_price || product.discount_price,
        discount_percentage: product.discount_percentage,
        image: imageUrl,
        category: category,
        stock: 100, // Default stock since we don't have inventory management yet
        status: 'active'
      }
    })

    return NextResponse.json({ products: processedProducts })
  } catch (error) {
    console.error('Error in products API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
