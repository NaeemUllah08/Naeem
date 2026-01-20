'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiTag, FiPackage, FiX, FiImage, FiUpload, FiEye, FiChevronLeft, FiChevronRight, FiCreditCard } from 'react-icons/fi'

export default function AdminProductsPage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Form visibility
  const [showProductModal, setShowProductModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentListModal, setShowPaymentListModal] = useState(false)

  // Image viewer state
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [viewingProduct, setViewingProduct] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Category form state
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    isActive: true
  })
  const [editingCategory, setEditingCategory] = useState(null)

  // Product form state
  const [productFormData, setProductFormData] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    discountPercentage: '',
    details: '',
    features: '',
    images: [], // Changed from single image to array
    isActive: true
  })
  const [editingProduct, setEditingProduct] = useState(null)
  const [seeding, setSeeding] = useState(false)

  // Payment method form state
  const [paymentFormData, setPaymentFormData] = useState({
    name: '',
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    instructions: '',
    isActive: true
  })
  const [editingPayment, setEditingPayment] = useState(null)

  useEffect(() => {
    fetchCategories()
    fetchPaymentMethods()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      fetchProducts(selectedCategory.id)
    } else {
      fetchProducts()
    }
  }, [selectedCategory])

  // Keyboard navigation for image viewer
  useEffect(() => {
    if (!showImageViewer) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeImageViewer()
      } else if (e.key === 'ArrowLeft') {
        prevImage()
      } else if (e.key === 'ArrowRight') {
        nextImage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showImageViewer, currentImageIndex, viewingProduct])

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (showImageViewer || showProductModal || showCategoryModal || showPaymentModal || showPaymentListModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showImageViewer, showProductModal, showCategoryModal, showPaymentModal, showPaymentListModal])

  const fetchCategories = async () => {
    setFetching(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/product-categories', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      } else {
        toast.error('Failed to load categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setFetching(false)
    }
  }

  const fetchProducts = async (categoryId = null) => {
    try {
      const token = localStorage.getItem('token')
      const url = categoryId
        ? `/api/admin/products?categoryId=${categoryId}`
        : '/api/admin/products'

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/shopping-payment-methods', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setPaymentMethods(data.paymentMethods || [])
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    }
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Validate files
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select only image files')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Each image should be less than 5MB')
        return
      }
    }

    setUploading(true)
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload-to-bucket', {
          method: 'POST',
          body: formData
        })

        const data = await res.json()

        if (res.ok) {
          return {
            url: data.url,
            fileName: data.fileName,
            bucketName: data.bucketName
          }
        } else {
          throw new Error(data.error || 'Upload failed')
        }
      })

      const uploadedImages = await Promise.all(uploadPromises)

      setProductFormData({
        ...productFormData,
        images: [...productFormData.images, ...uploadedImages]
      })

      toast.success(`${uploadedImages.length} image(s) uploaded successfully`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload images')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (index) => {
    setProductFormData({
      ...productFormData,
      images: productFormData.images.filter((_, i) => i !== index)
    })
  }

  // Category CRUD
  const handleCreateCategory = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/product-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoryFormData),
      })

      if (res.ok) {
        toast.success('Category created successfully')
        resetCategoryForm()
        fetchCategories()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create category')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCategory = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/product-categories', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          categoryId: editingCategory.id,
          ...categoryFormData
        }),
      })

      if (res.ok) {
        toast.success('Category updated successfully')
        resetCategoryForm()
        fetchCategories()
      } else {
        toast.error('Failed to update category')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!confirm(`Delete category "${categoryName}"?`)) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/product-categories?categoryId=${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Category deleted successfully')
        if (selectedCategory?.id === categoryId) {
          setSelectedCategory(null)
        }
        fetchCategories()
      } else {
        toast.error(data.error || 'Failed to delete category')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  // Product CRUD
  const handleCreateProduct = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')

      // Convert images array to JSON string for storage
      const payload = {
        ...productFormData,
        image: productFormData.images.length > 0 ? JSON.stringify(productFormData.images) : null
      }
      delete payload.images // Remove images array, use image field instead

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Product created successfully')
        resetProductForm()
        fetchProducts(selectedCategory?.id)
      } else {
        toast.error(data.error || 'Failed to create product')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')

      // Convert images array to JSON string for storage
      const payload = {
        ...productFormData,
        image: productFormData.images.length > 0 ? JSON.stringify(productFormData.images) : null
      }
      delete payload.images // Remove images array, use image field instead

      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: editingProduct.id,
          ...payload
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Product updated successfully')
        resetProductForm()
        fetchProducts(selectedCategory?.id)
      } else {
        toast.error(data.error || 'Failed to update product')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId, productName) => {
    if (!confirm(`Delete product "${productName}"?`)) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/products?productId=${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        toast.success('Product deleted successfully')
        fetchProducts(selectedCategory?.id)
      } else {
        toast.error('Failed to delete product')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  // Payment Method CRUD
  const handleCreatePayment = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/shopping-payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentFormData),
      })

      if (res.ok) {
        toast.success('Payment method created successfully')
        resetPaymentForm()
        fetchPaymentMethods()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create payment method')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePayment = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/shopping-payment-methods', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingPayment.id,
          ...paymentFormData
        }),
      })

      if (res.ok) {
        toast.success('Payment method updated successfully')
        resetPaymentForm()
        fetchPaymentMethods()
      } else {
        toast.error('Failed to update payment method')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePayment = async (paymentId, paymentName) => {
    if (!confirm(`Delete payment method "${paymentName}"?`)) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/shopping-payment-methods?id=${paymentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        toast.success('Payment method deleted successfully')
        fetchPaymentMethods()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete payment method')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const resetCategoryForm = () => {
    setCategoryFormData({ name: '', description: '', isActive: true })
    setEditingCategory(null)
    setShowCategoryModal(false)
  }

  const resetProductForm = () => {
    setProductFormData({
      categoryId: '',
      name: '',
      description: '',
      price: '',
      discountPrice: '',
      discountPercentage: '',
      details: '',
      features: '',
      images: [],
      isActive: true
    })
    setEditingProduct(null)
    setShowProductModal(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const resetPaymentForm = () => {
    setPaymentFormData({
      name: '',
      bankName: '',
      accountTitle: '',
      accountNumber: '',
      instructions: '',
      isActive: true
    })
    setEditingPayment(null)
    setShowPaymentModal(false)
  }

  const editCategory = (category) => {
    setEditingCategory(category)
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      isActive: category.is_active
    })
    setShowCategoryModal(true)
  }

  const editProduct = (product) => {
    setEditingProduct(product)

    // Parse images - could be array or single URL string
    let images = []
    if (product.image_url) {
      if (typeof product.image_url === 'string') {
        try {
          // Try parsing as JSON array
          images = JSON.parse(product.image_url)
        } catch {
          // If not JSON, treat as single URL
          images = [{ url: product.image_url, fileName: '', bucketName: 'products' }]
        }
      } else if (Array.isArray(product.image_url)) {
        images = product.image_url
      }
    }

    setProductFormData({
      categoryId: product.category_id,
      name: product.name,
      description: product.description || '',
      price: product.price || product.regular_price || '',
      discountPrice: product.discount_price || product.sale_price || '',
      discountPercentage: product.discount_percentage || '',
      details: product.details || '',
      features: product.features || '',
      images: images,
      isActive: product.is_active
    })
    setShowProductModal(true)
  }

  const viewProduct = (product) => {
    // Parse images from product
    let images = []
    if (product.image_url) {
      if (typeof product.image_url === 'string') {
        try {
          images = JSON.parse(product.image_url)
        } catch {
          images = [{ url: product.image_url, fileName: '', bucketName: 'products' }]
        }
      } else if (Array.isArray(product.image_url)) {
        images = product.image_url
      }
    }

    setViewingProduct({ ...product, images })
    setCurrentImageIndex(0)
    setShowImageViewer(true)
  }

  const editPayment = (payment) => {
    setEditingPayment(payment)
    setPaymentFormData({
      name: payment.name,
      bankName: payment.bank_name || '',
      accountTitle: payment.account_title || '',
      accountNumber: payment.account_number || '',
      instructions: payment.instructions || '',
      isActive: payment.is_active
    })
    setShowPaymentModal(true)
  }

  const seedSampleData = async () => {
    if (!confirm('This will create sample categories and products. Continue?')) return

    setSeeding(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/seed-products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`Created ${data.stats.categoriesCreated} categories and ${data.stats.productsCreated} products!`)
        fetchCategories()
      } else {
        toast.error(data.error || 'Failed to seed data')
      }
    } catch (error) {
      console.error('Error seeding data:', error)
      toast.error('Failed to seed sample data')
    } finally {
      setSeeding(false)
    }
  }

  const closeImageViewer = () => {
    setShowImageViewer(false)
    setViewingProduct(null)
    setCurrentImageIndex(0)
  }

  const nextImage = () => {
    if (viewingProduct && viewingProduct.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % viewingProduct.images.length)
    }
  }

  const prevImage = () => {
    if (viewingProduct && viewingProduct.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + viewingProduct.images.length) % viewingProduct.images.length)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8 w-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-6 mb-4 sm:mb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-2">Manage your product categories and products</p>

          {/* Add Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mt-4">
            <button
              onClick={() => {
                resetCategoryForm()
                setShowCategoryModal(true)
              }}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium shadow-sm hover:shadow-md text-sm"
            >
              <FiTag className="w-4 h-4" />
              Add Category
            </button>
            <button
              onClick={() => {
                resetProductForm()
                if (selectedCategory) {
                  setProductFormData(prev => ({ ...prev, categoryId: selectedCategory.id }))
                }
                setShowProductModal(true)
              }}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium shadow-sm hover:shadow-md text-sm"
            >
              <FiPlus className="w-4 h-4" />
              Add Product
            </button>
            <button
              onClick={() => {
                resetPaymentForm()
                setShowPaymentModal(true)
              }}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition font-medium shadow-sm hover:shadow-md text-sm"
            >
              <FiCreditCard className="w-4 h-4" />
              Add Payment Method
            </button>
            <button
              onClick={() => setShowPaymentListModal(true)}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition font-medium shadow-sm hover:shadow-md text-sm"
            >
              <FiEye className="w-4 h-4" />
              View Payment Methods
            </button>
            {categories.length === 0 && (
              <button
                onClick={seedSampleData}
                disabled={seeding}
                className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-medium shadow-sm hover:shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiPackage className="w-4 h-4" />
                {seeding ? 'Creating...' : 'Add Sample Products'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
              <FiTag className="text-purple-600 w-5 h-5" />
              Categories
            </h2>

            {fetching ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    !selectedCategory
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiPackage className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">All Products</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${!selectedCategory ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                      {products.length}
                    </span>
                  </div>
                </button>

                {categories.map((category) => (
                  <div key={category.id} className="relative group">
                    <button
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        selectedCategory?.id === category.id
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FiTag className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{category.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ml-2 ${selectedCategory?.id === category.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                          {category.productCount || 0}
                        </span>
                      </div>
                    </button>
                    <div className="absolute right-2 top-2 hidden group-hover:flex gap-1 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          editCategory(category)
                        }}
                        className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm transition"
                        title="Edit category"
                      >
                        <FiEdit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCategory(category.id, category.name)
                        }}
                        className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-sm transition"
                        title="Delete category"
                      >
                        <FiTrash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FiPackage className="text-blue-600" />
                {selectedCategory ? selectedCategory.name : 'All Products'}
              </h2>
              <span className="text-sm text-gray-600 font-medium">
                {products.length} {products.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {products.map((product) => {
                // Parse images from product
                let imageUrl = null
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

                return (
                <div key={product.id} className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                  {/* Image Section */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 h-56 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
                        <div className="text-center">
                          <FiImage className="w-20 h-20 text-gray-300 mx-auto mb-2 group-hover:text-gray-400 transition-colors" />
                          <p className="text-xs text-gray-400 font-medium">No Image</p>
                        </div>
                      </div>
                    )}

                    {/* Status Badge */}
                    {!product.is_active && (
                      <div className="absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                          Inactive
                        </span>
                      </div>
                    )}

                    {/* Discount Badge */}
                    {product.discount_percentage && (
                      <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-red-500 via-red-600 to-pink-600 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          {product.discount_percentage}% OFF
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-5">
                    {/* Product Name */}
                    <h3 className="font-bold text-gray-900 mb-2 text-base line-clamp-2 min-h-[3rem] group-hover:text-blue-600 transition-colors leading-tight">
                      {product.name}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                      {product.description || 'No description available'}
                    </p>

                    {/* Price Section */}
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      {(product.discount_price || product.sale_price) ? (
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              Rs. {parseFloat(product.discount_price || product.sale_price).toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-400 line-through font-medium">
                              Rs. {parseFloat(product.price || product.regular_price).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-green-600 font-semibold">
                            You save Rs. {(parseFloat(product.price || product.regular_price) - parseFloat(product.discount_price || product.sale_price)).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          Rs. {parseFloat(product.price || product.regular_price).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewProduct(product)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-xl transform hover:scale-105"
                        title="View product"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => editProduct(product)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-xl transform hover:scale-105"
                        title="Edit product"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-xl transform hover:scale-105"
                        title="Delete product"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000 pointer-events-none"></div>
                </div>
                )
              })}

              {products.length === 0 && (
                <div className="col-span-full text-center py-20 px-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-5">
                    <FiPackage className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-gray-900 text-lg font-bold mb-2">No products found</h3>
                  <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                    {selectedCategory
                      ? `No products in "${selectedCategory.name}" category yet. Add your first product!`
                      : 'Start by adding your first product or select a category.'
                    }
                  </p>
                  <button
                    onClick={() => {
                      resetProductForm()
                      if (selectedCategory) {
                        setProductFormData(prev => ({ ...prev, categoryId: selectedCategory.id }))
                      }
                      setShowProductModal(true)
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium shadow-sm"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Product
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                onClick={resetCategoryForm}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
                title="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-sm"
                  placeholder="e.g., Electronics"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Description</label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition resize-none text-sm"
                  placeholder="Brief description"
                />
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={categoryFormData.isActive}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, isActive: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="catActive" className="ml-2.5 text-sm font-medium text-gray-700 cursor-pointer">
                  Active Category
                </label>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </span>
                  ) : (
                    editingCategory ? 'Update' : 'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-slideUp">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={resetProductForm}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
                title="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="overflow-y-auto flex-1">
              <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={productFormData.categoryId}
                    onChange={(e) => setProductFormData({ ...productFormData, categoryId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white text-sm"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                    placeholder="Product name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Description</label>
                  <textarea
                    value={productFormData.description}
                    onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none text-sm"
                    placeholder="Brief description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Price (PKR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Sale Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productFormData.discountPrice}
                    onChange={(e) => setProductFormData({ ...productFormData, discountPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                    placeholder="850"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Discount %</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={productFormData.discountPercentage}
                    onChange={(e) => setProductFormData({ ...productFormData, discountPercentage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                    placeholder="15"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Images</label>
                  <div className="space-y-2.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full px-3 py-2.5 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition flex items-center justify-center gap-2 text-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-blue-50/30 text-sm"
                    >
                      <FiUpload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Upload images'}
                    </button>

                    {productFormData.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                        {productFormData.images.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={img.url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded border border-gray-300 group-hover:border-blue-400 transition"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-1 -right-1 p-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Details</label>
                  <textarea
                    value={productFormData.details}
                    onChange={(e) => setProductFormData({ ...productFormData, details: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none text-sm"
                    placeholder="Product details"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Features</label>
                  <input
                    type="text"
                    value={productFormData.features}
                    onChange={(e) => setProductFormData({ ...productFormData, features: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                    placeholder="Feature 1, Feature 2"
                  />
                </div>

                <div className="md:col-span-2 flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="prodActive"
                    checked={productFormData.isActive}
                    onChange={(e) => setProductFormData({ ...productFormData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="prodActive" className="ml-2.5 text-sm font-medium text-gray-700 cursor-pointer">
                    Active Product
                  </label>
                </div>

                <div className="md:col-span-2 flex gap-2.5 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </span>
                    ) : (
                      editingProduct ? 'Update' : 'Create'
                    )}
                  </button>
                </div>
              </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-slideUp">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FiCreditCard className="w-5 h-5" />
                {editingPayment ? 'Edit Payment Method' : 'Add Payment Method'}
              </h2>
              <button
                onClick={resetPaymentForm}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
                title="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingPayment ? handleUpdatePayment : handleCreatePayment} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Payment Method Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.name}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-sm"
                    placeholder="e.g., Bank Transfer, EasyPaisa, JazzCash"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.bankName}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, bankName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-sm"
                    placeholder="e.g., Meezan Bank"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Account Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.accountTitle}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, accountTitle: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-sm"
                    placeholder="Account holder name"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.accountNumber}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, accountNumber: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-sm font-mono"
                    placeholder="1234567890"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Instructions
                  </label>
                  <textarea
                    value={paymentFormData.instructions}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, instructions: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none text-sm"
                    placeholder="Payment instructions for customers"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="paymentActive"
                    checked={paymentFormData.isActive}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, isActive: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="paymentActive" className="ml-2.5 text-sm font-medium text-gray-700 cursor-pointer">
                    Active Payment Method
                  </label>
                </div>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetPaymentForm}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </span>
                  ) : (
                    editingPayment ? 'Update' : 'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Methods List Modal */}
      {showPaymentListModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-slideUp">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FiCreditCard className="w-5 h-5" />
                Payment Methods ({paymentMethods.length})
              </h2>
              <button
                onClick={() => setShowPaymentListModal(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
                title="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {paymentMethods.length === 0 ? (
                <div className="text-center py-12">
                  <FiCreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Payment Methods</h3>
                  <p className="text-gray-600 mb-6">Add your first payment method to accept payments</p>
                  <button
                    onClick={() => {
                      setShowPaymentListModal(false)
                      resetPaymentForm()
                      setShowPaymentModal(true)
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition font-medium shadow-sm"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Payment Method
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-indigo-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-black text-gray-900 mb-1">{method.name}</h3>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            method.is_active
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : 'bg-red-100 text-red-700 border border-red-300'
                          }`}>
                            {method.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2.5 mb-4">
                        {method.bank_name && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-gray-600 font-semibold min-w-[100px]">Bank:</span>
                            <span className="text-sm text-gray-900 font-medium">{method.bank_name}</span>
                          </div>
                        )}
                        {method.account_title && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-gray-600 font-semibold min-w-[100px]">Account Title:</span>
                            <span className="text-sm text-gray-900 font-medium">{method.account_title}</span>
                          </div>
                        )}
                        {method.account_number && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-gray-600 font-semibold min-w-[100px]">Account Number:</span>
                            <span className="text-sm text-gray-900 font-mono font-bold bg-gray-100 px-2 py-1 rounded border border-gray-300">
                              {method.account_number}
                            </span>
                          </div>
                        )}
                        {method.instructions && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-xs text-amber-800">
                              <strong>Instructions:</strong> {method.instructions}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setShowPaymentListModal(false)
                            editPayment(method)
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePayment(method.id, method.name)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageViewer && viewingProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-slideUp">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold">{viewingProduct.name}</h2>
                <p className="text-xs text-purple-100 mt-0.5">
                  {viewingProduct.images.length > 0
                    ? `Image ${currentImageIndex + 1} of ${viewingProduct.images.length}`
                    : 'No images available'
                  }
                </p>
              </div>
              <button
                onClick={closeImageViewer}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
                title="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Image Display */}
            <div className="flex-1 relative bg-gray-900 overflow-hidden flex items-center justify-center min-h-0">
              {viewingProduct.images.length > 0 ? (
                <>
                  {/* Main Image */}
                  <img
                    src={viewingProduct.images[currentImageIndex]?.url}
                    alt={`${viewingProduct.name} - Image ${currentImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />

                  {/* Navigation Arrows - Only show if multiple images */}
                  {viewingProduct.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition backdrop-blur-sm"
                        title="Previous image"
                      >
                        <FiChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition backdrop-blur-sm"
                        title="Next image"
                      >
                        <FiChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Image Counter Badge */}
                  {viewingProduct.images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 text-white rounded-full text-xs font-semibold backdrop-blur-sm">
                      {currentImageIndex + 1} / {viewingProduct.images.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-400">
                  <FiImage className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No images available</p>
                </div>
              )}
            </div>

            {/* Thumbnail Strip - Only show if multiple images */}
            {viewingProduct.images.length > 1 && (
              <div className="px-4 py-2.5 flex gap-2 overflow-x-auto bg-gray-100 border-t border-gray-200">
                {viewingProduct.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                      currentImageIndex === index
                        ? 'border-purple-500 ring-2 ring-purple-500/50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Product Details */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 overflow-y-auto max-h-48">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1 font-medium">Price</p>
                  <div className="flex items-center gap-2">
                    {(viewingProduct.discount_price || viewingProduct.sale_price) ? (
                      <>
                        <span className="text-xl font-bold text-green-600">
                          Rs. {parseFloat(viewingProduct.discount_price || viewingProduct.sale_price).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 line-through">
                          Rs. {parseFloat(viewingProduct.price || viewingProduct.regular_price).toLocaleString()}
                        </span>
                        {viewingProduct.discount_percentage && (
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                            -{viewingProduct.discount_percentage}% OFF
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xl font-bold text-gray-900">
                        Rs. {parseFloat(viewingProduct.price || viewingProduct.regular_price).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1 font-medium">Status</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                    viewingProduct.is_active
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-red-100 text-red-700 border border-red-300'
                  }`}>
                    {viewingProduct.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {viewingProduct.description && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Description</p>
                    <p className="text-sm text-gray-700">{viewingProduct.description}</p>
                  </div>
                )}

                {viewingProduct.details && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Details</p>
                    <p className="text-sm text-gray-700">{viewingProduct.details}</p>
                  </div>
                )}

                {viewingProduct.features && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-600 mb-1.5 font-medium">Features</p>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingProduct.features.split(',').map((feature, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {feature.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
