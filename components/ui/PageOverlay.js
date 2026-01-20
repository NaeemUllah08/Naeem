'use client'

import { useEffect, useState } from 'react'

export default function PageOverlay({ pageName, children }) {
  const [overlaySettings, setOverlaySettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOverlaySettings = async () => {
      try {
        // Fetch from database with cache-busting
        const res = await fetch(`/api/page-overlays?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })

        if (res.ok) {
          const data = await res.json()
          const pageKey = pageName.replace(/\s+/g, '')
          const settings = data.settings[pageKey]
          setOverlaySettings(settings || null)
        } else {
          setOverlaySettings(null)
        }
      } catch (error) {
        setOverlaySettings(null)
      } finally {
        setLoading(false)
      }
    }

    fetchOverlaySettings()
  }, [pageName])

  // Prevent body scrolling when overlay is enabled
  useEffect(() => {
    if (overlaySettings?.enabled) {
      // Disable scrolling on body
      document.body.style.overflow = 'hidden'
      document.body.style.height = '100vh'

      return () => {
        // Re-enable scrolling when component unmounts or overlay is disabled
        document.body.style.overflow = ''
        document.body.style.height = ''
      }
    }
  }, [overlaySettings?.enabled])

  // If overlay is not enabled, just render children normally
  if (!overlaySettings || !overlaySettings.enabled) {
    return <>{children}</>
  }

  // If overlay is enabled, render with beautiful coming soon overlay
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background content with light blur - still visible */}
      <div
        className="pointer-events-none select-none overflow-hidden fixed inset-0"
        style={{
          filter: 'blur(3px)',
          opacity: 0.3
        }}
      >
        {children}
      </div>

      {/* Beautiful Coming Soon Overlay - Small and Elegant */}
      {/* z-40 so sidebar (z-50) appears above it */}
      <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none px-4">
        <div className="relative mx-auto w-full max-w-2xl flex justify-center">
          {/* Main Coming Soon Badge */}
          <div className="relative inline-block w-full sm:w-auto">
            {/* Glowing background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 rounded-2xl blur-xl opacity-60 animate-pulse"></div>

            {/* Main content */}
            <div className="relative bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-2xl shadow-2xl px-6 py-5 sm:px-8 sm:py-6 transform hover:scale-105 transition-transform duration-300">
              {/* Sparkle icon */}
              <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-yellow-400 rounded-full p-1.5 sm:p-2 shadow-lg animate-bounce">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>

              {/* Clock icon */}
              <div className="flex items-center justify-center mb-2 sm:mb-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-3">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* Coming Soon Text */}
              <div className="text-center">
                <h2
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-1 sm:mb-2 tracking-wider px-2"
                  style={{
                    textShadow: '3px 3px 6px rgba(0,0,0,0.5), 0 0 25px rgba(255,255,255,0.3)',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                >
                  {overlaySettings.text || 'COMING SOON'}
                </h2>
                <p className="text-white/90 text-xs sm:text-sm md:text-base font-semibold px-2">
                  This feature is under development and will be available soon!
                </p>
              </div>

              {/* Decorative bottom border */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"></div>
            </div>
          </div>

          {/* Floating particles effect */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
            <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-orange-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-red-300 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
