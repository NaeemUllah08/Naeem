import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { adminMiddleware } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// Sample product categories
const sampleCategories = [
  {
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    is_active: true
  },
  {
    name: 'Fashion',
    description: 'Clothing and accessories',
    is_active: true
  },
  {
    name: 'Home & Living',
    description: 'Home decor and furniture',
    is_active: true
  },
  {
    name: 'Sports',
    description: 'Sports equipment and accessories',
    is_active: true
  }
]

// Sample products (will be created after categories)
const sampleProductsTemplate = [
  {
    categoryName: 'Electronics',
    name: 'Wireless Bluetooth Headphones',
    description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
    regular_price: 12999,
    sale_price: 9999,
    discount_percentage: 23,
    details: 'High-quality audio experience with active noise cancellation. Perfect for music lovers and professionals.',
    features: 'Noise Cancellation, 30hr Battery, Bluetooth 5.0, Fast Charging',
    is_active: true
  },
  {
    categoryName: 'Electronics',
    name: 'Smart Watch Series 5',
    description: 'Advanced fitness tracking smartwatch with heart rate monitor',
    regular_price: 24999,
    sale_price: 19999,
    discount_percentage: 20,
    details: 'Track your health and fitness goals with advanced sensors and beautiful AMOLED display.',
    features: 'Heart Rate Monitor, GPS, Water Resistant, Sleep Tracking',
    is_active: true
  },
  {
    categoryName: 'Fashion',
    name: 'Premium Cotton T-Shirt',
    description: 'Comfortable 100% cotton t-shirt in various colors',
    regular_price: 1999,
    sale_price: null,
    discount_percentage: null,
    details: 'Made from premium quality cotton. Available in multiple sizes and colors.',
    features: '100% Cotton, Machine Washable, Multiple Colors',
    is_active: true
  },
  {
    categoryName: 'Fashion',
    name: 'Designer Denim Jeans',
    description: 'Stylish slim-fit denim jeans for men',
    regular_price: 4999,
    sale_price: 3499,
    discount_percentage: 30,
    details: 'Premium denim fabric with modern slim-fit design. Perfect for casual and semi-formal occasions.',
    features: 'Slim Fit, Stretch Fabric, Multiple Sizes, Durable',
    is_active: true
  },
  {
    categoryName: 'Home & Living',
    name: 'Luxury Bed Sheet Set',
    description: 'Egyptian cotton bed sheet set with pillow covers',
    regular_price: 8999,
    sale_price: 6999,
    discount_percentage: 22,
    details: 'Premium Egyptian cotton bed sheets that provide ultimate comfort and durability.',
    features: 'Egyptian Cotton, King Size, Thread Count 600, Easy Care',
    is_active: true
  },
  {
    categoryName: 'Home & Living',
    name: 'LED Desk Lamp',
    description: 'Modern adjustable LED desk lamp with touch control',
    regular_price: 3999,
    sale_price: null,
    discount_percentage: null,
    details: 'Energy-efficient LED desk lamp with multiple brightness levels and adjustable arm.',
    features: 'Touch Control, Adjustable, Energy Saving, Modern Design',
    is_active: true
  },
  {
    categoryName: 'Sports',
    name: 'Professional Yoga Mat',
    description: 'Non-slip exercise yoga mat with carrying strap',
    regular_price: 2999,
    sale_price: 2199,
    discount_percentage: 27,
    details: 'High-quality yoga mat made from eco-friendly materials. Perfect for yoga, pilates, and fitness exercises.',
    features: 'Non-Slip, Eco-Friendly, 6mm Thick, Carrying Strap',
    is_active: true
  },
  {
    categoryName: 'Sports',
    name: 'Professional Football',
    description: 'Official size 5 football for professional matches',
    regular_price: 4999,
    sale_price: 3999,
    discount_percentage: 20,
    details: 'High-quality professional football with excellent grip and durability.',
    features: 'Size 5, FIFA Approved, Durable, All Weather',
    is_active: true
  },
  {
    categoryName: 'Electronics',
    name: 'Portable Power Bank 20000mAh',
    description: 'High-capacity power bank with fast charging support',
    regular_price: 5999,
    sale_price: 4499,
    discount_percentage: 25,
    details: 'Never run out of battery with this high-capacity portable charger. Supports fast charging for all devices.',
    features: '20000mAh, Fast Charging, Dual USB, LED Display',
    is_active: true
  },
  {
    categoryName: 'Fashion',
    name: 'Leather Wallet',
    description: 'Genuine leather wallet with RFID protection',
    regular_price: 2999,
    sale_price: null,
    discount_percentage: null,
    details: 'Premium genuine leather wallet with multiple card slots and RFID protection technology.',
    features: 'Genuine Leather, RFID Protection, Multiple Slots, Compact',
    is_active: true
  }
]

export async function POST(req) {
  try {
    const authResult = await adminMiddleware(req)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Check if categories already exist
    const { data: existingCategories } = await supabaseAdmin
      .from('product_categories')
      .select('id, name')

    if (existingCategories && existingCategories.length > 0) {
      return NextResponse.json(
        {
          error: 'Sample data already exists. Please delete existing categories first.',
          existingCount: existingCategories.length
        },
        { status: 400 }
      )
    }

    // Insert categories
    const categoriesWithTimestamp = sampleCategories.map(cat => ({
      ...cat,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data: insertedCategories, error: categoryError } = await supabaseAdmin
      .from('product_categories')
      .insert(categoriesWithTimestamp)
      .select()

    if (categoryError) {
      console.error('Error inserting categories:', categoryError)
      return NextResponse.json(
        { error: 'Failed to insert categories' },
        { status: 500 }
      )
    }

    // Create category name to ID mapping
    const categoryMap = {}
    insertedCategories.forEach(cat => {
      categoryMap[cat.name] = cat.id
    })

    // Prepare products with category IDs
    const productsToInsert = sampleProductsTemplate.map(product => {
      const categoryId = categoryMap[product.categoryName]

      const productData = {
        category_id: categoryId,
        name: product.name,
        description: product.description,
        price: product.regular_price,
        regular_price: product.regular_price,
        discount_price: product.sale_price,
        sale_price: product.sale_price,
        discount_percentage: product.discount_percentage,
        details: product.details,
        features: product.features,
        image_url: null, // No images for sample data
        is_active: product.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return productData
    })

    // Insert products
    const { data: insertedProducts, error: productError } = await supabaseAdmin
      .from('products')
      .insert(productsToInsert)
      .select()

    if (productError) {
      console.error('Error inserting products:', productError)
      return NextResponse.json(
        { error: 'Failed to insert products' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Sample data created successfully',
      stats: {
        categoriesCreated: insertedCategories.length,
        productsCreated: insertedProducts.length
      }
    })
  } catch (error) {
    console.error('Seed products API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
