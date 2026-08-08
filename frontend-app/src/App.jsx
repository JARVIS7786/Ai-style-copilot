import { useEffect, useRef, useState } from 'react'
import { Heart, X, Upload, Sparkles } from 'lucide-react'
import SwipeCard from './components/SwipeCard.jsx'
import { getProducts, recordInteraction, uploadRealOutfit } from './services/mockApi.js'

function App() {
  const [products, setProducts] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  const topCardRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data)
      setLoading(false)
    })
  }, [])

  function handleSwipe(direction, productId) {
    recordInteraction(productId, direction)
    setCurrentIndex((prev) => prev + 1)
  }

  function triggerSwipe(direction) {
    topCardRef.current?.swipe(direction)
  }

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  // --- FASTAPI INTEGRATION LOGIC ---
  async function handleFileSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const aiNewCard = await uploadRealOutfit(file)

      if (aiNewCard) {
        // Naya card exactly wahan add hoga jahan abhi user dekh raha hai
        setProducts(prev => {
          const updatedList = [...prev]
          updatedList.splice(currentIndex, 0, aiNewCard)
          return updatedList
        })
      } else {
        alert("Analysis failed. Try another photo.")
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Kuch gadbad hui upload mein!")
    } finally {
      setIsUploading(false)
      e.target.value = '' // allow re-selecting the same file later
    }
  }

  const visibleCards = products.slice(currentIndex, currentIndex + 2)
  const hasCards = visibleCards.length > 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <header className="w-full max-w-sm flex items-center justify-between px-5 pt-6 pb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <h1 className="text-lg font-bold text-gray-900">StyleSwipe</h1>
        </div>

        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="flex items-center gap-1.5 text-sm font-medium text-violet-700 bg-violet-50 px-3 py-1.5 rounded-full active:scale-95 transition disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? 'Analyzing...' : 'Upload Outfit'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
        />
      </header>

      {/* Loading Animation Indicator */}
      {isUploading && (
        <div className="w-full max-w-sm px-5 mt-2">
          <div className="text-xs text-center text-violet-600 font-semibold animate-pulse bg-violet-100 py-1.5 rounded-md border border-violet-200">
            Sending image to AI backend... ✨
          </div>
        </div>
      )}

      <main className="relative w-full max-w-sm h-[560px] px-5 mt-4">
        {loading && <p className="text-center text-gray-500 mt-16">Loading your picks...</p>}

        {!loading && !hasCards && !isUploading && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 gap-1">
            <p className="text-lg font-semibold text-gray-700">You're all caught up</p>
            <p className="text-sm">Check back later for new picks.</p>
          </div>
        )}

        {visibleCards.map((product, i) => {
          const isTop = i === 0
          return (
            <div
              key={product.id}
              className="absolute inset-0 transition-all duration-300 ease-out"
              style={{
                zIndex: visibleCards.length - i,
                transform: isTop ? 'none' : 'scale(0.96) translateY(10px)',
                opacity: isTop ? 1 : 0.6,
              }}
            >
              <SwipeCard
                ref={isTop ? topCardRef : null}
                product={product}
                onSwipe={handleSwipe}
                isTop={isTop}
              />
            </div>
          )
        })}
      </main>

      {!loading && hasCards && (
        <div className="flex items-center gap-6 mt-6 mb-8">
          <button
            onClick={() => triggerSwipe('dislike')}
            className="w-16 h-16 rounded-full bg-white shadow-lg border border-gray-100 text-rose-500 flex items-center justify-center active:scale-90 transition"
            aria-label="Dislike"
          >
            <X className="w-7 h-7" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => triggerSwipe('like')}
            className="w-16 h-16 rounded-full bg-white shadow-lg border border-gray-100 text-emerald-500 flex items-center justify-center active:scale-90 transition"
            aria-label="Like"
          >
            <Heart className="w-7 h-7" strokeWidth={2.5} fill="currentColor" />
          </button>
        </div>
      )}
    </div>
  )
}

export default App