'use client'

import { useEffect, useState } from 'react'
import { FiShoppingCart, FiEye, FiHeart } from 'react-icons/fi'
import Card from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { formatCurrencyPK } from '@/lib/currency'
import { useCart } from '@/lib/CartContext'
import PageOverlay from '@/components/ui/PageOverlay'

export default function ShoppingPage() {
  const { addToCart } = useCart()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/user/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])

        // Extract unique categories
        const uniqueCategories = [...new Set(data.products?.map(p => p.category) || [])]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold text-gray-600">Loading products...</div>
      </div>
    )
  }

  return (
    <PageOverlay pageName="shopping">
      <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Shopping</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Browse and purchase our products</p>
      </div>

      {/* Category Filter */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Products
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all duration-300">
              {/* Product Image */}
              <div className="relative h-48 sm:h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden group">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FiShoppingCart className="w-16 h-16 text-gray-400" />
                  </div>
                )}

                {/* Overlay Buttons */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="bg-white text-gray-800 p-3 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
                    aria-label="View details"
                  >
                    <FiEye className="w-5 h-5" />
                  </button>
                  <button
                    className="bg-white text-gray-800 p-3 rounded-full hover:bg-red-600 hover:text-white transition-colors"
                    aria-label="Add to wishlist"
                  >
                    <FiHeart className="w-5 h-5" />
                  </button>
                </div>

                {/* Category Badge */}
                {product.category && (
                  <span className="absolute top-3 left-3 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                    {product.category}
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">
                  {product.description || 'No description available'}
                </p>

                {/* Price Section */}
                <div className="mb-4">
                  {product.sale_price ? (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="text-2xl font-black text-green-600">
                          {formatCurrencyPK(product.sale_price)}
                        </p>
                        <p className="text-sm text-gray-400 line-through">
                          {formatCurrencyPK(product.price)}
                        </p>
                      </div>
                      {product.discount_percentage && (
                        <span className="inline-block text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white px-2.5 py-1 rounded-full font-bold shadow-sm">
                          Save {product.discount_percentage}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-2xl font-black text-blue-600">
                      {formatCurrencyPK(product.price)}
                    </p>
                  )}
                  {product.stock !== undefined && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </p>
                  )}
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => {
                    addToCart(product, 1)
                    toast.success('Added to cart!')
                  }}
                  disabled={product.stock === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <FiShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Products Found</h3>
            <p className="text-gray-600">
              {selectedCategory === 'all'
                ? 'There are no products available at the moment'
                : `No products found in "${selectedCategory}" category`
              }
            </p>
          </div>
        </Card>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Product Details</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Product Image */}
              <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden mb-6">
                {selectedProduct.image ? (
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FiShoppingCart className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedProduct.name}</h3>
                  {selectedProduct.category && (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                      {selectedProduct.category}
                    </span>
                  )}
                </div>

                <p className="text-gray-600 leading-relaxed">
                  {selectedProduct.description || 'No description available for this product.'}
                </p>

                <div className="border-t border-b border-gray-200 py-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Price</p>
                    {selectedProduct.sale_price ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <p className="text-3xl font-bold text-green-600">
                            {formatCurrencyPK(selectedProduct.sale_price)}
                          </p>
                          <p className="text-lg text-gray-500 line-through">
                            {formatCurrencyPK(selectedProduct.price)}
                          </p>
                        </div>
                        {selectedProduct.discount_percentage && (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                              {selectedProduct.discount_percentage}% OFF
                            </span>
                            <span className="text-sm text-green-600 font-semibold">
                              You save {formatCurrencyPK(selectedProduct.price - selectedProduct.sale_price)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-blue-600">
                        {formatCurrencyPK(selectedProduct.price)}
                      </p>
                    )}
                  </div>
                  {selectedProduct.stock !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Stock</p>
                      <p className={`text-lg font-bold ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedProduct.stock > 0 ? `${selectedProduct.stock} available` : 'Out of stock'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FiX className="w-5 h-5" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </PageOverlay>
  )
}
