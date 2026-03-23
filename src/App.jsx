import React, { useState, createContext, useContext } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Shirt, Sparkles, ShoppingBag, Home } from 'lucide-react'
import HomePage from './pages/HomePage.jsx'
import WardrobePage from './pages/WardrobePage.jsx'
import OutfitsPage from './pages/OutfitsPage.jsx'
import ShoppingPage from './pages/ShoppingPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import TryOnPage from './pages/TryOnPage.jsx'

export const AppContext = createContext(null)
export function useApp() { return useContext(AppContext) }

const SEED_WARDROBE = [
  { id: '1', name: 'White Oxford Shirt', category: 'top', colors: ['white'], style: ['smart_casual'], season: ['spring'], imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80', lastWorn: '2 days ago', timesWorn: 12 },
  { id: '2', name: 'Navy Slim Chinos', category: 'bottom', colors: ['navy'], style: ['casual'], season: ['all_season'], imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80', lastWorn: '1 week ago', timesWorn: 28 },
  { id: '3', name: 'Black Leather Jacket', category: 'outerwear', colors: ['black'], style: ['streetwear'], season: ['fall'], imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80', lastWorn: '3 days ago', timesWorn: 45 },
  { id: '4', name: 'White Sneakers', category: 'shoes', colors: ['white'], style: ['casual'], season: ['all_season'], imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', lastWorn: 'Today', timesWorn: 67 },
  { id: '5', name: 'Cream Linen Blazer', category: 'outerwear', colors: ['cream'], style: ['formal'], season: ['spring'], imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4c8a?w=400&q=80', lastWorn: '2 weeks ago', timesWorn: 8 },
  { id: '6', name: 'Charcoal Turtleneck', category: 'top', colors: ['charcoal'], style: ['minimalist'], season: ['winter'], imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80', lastWorn: '5 days ago', timesWorn: 19 },
  { id: '7', name: 'Indigo Raw Denim', category: 'bottom', colors: ['indigo'], style: ['casual'], season: ['all_season'], imageUrl: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&q=80', lastWorn: 'Yesterday', timesWorn: 52 },
  { id: '8', name: 'Camel Wool Coat', category: 'outerwear', colors: ['camel'], style: ['formal'], season: ['winter'], imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&q=80', lastWorn: '1 week ago', timesWorn: 15 },
  { id: '9', name: 'Striped Breton Top', category: 'top', colors: ['navy', 'white'], style: ['casual'], season: ['spring'], imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80', lastWorn: '3 weeks ago', timesWorn: 7 },
  { id: '10', name: 'Chelsea Boots', category: 'shoes', colors: ['black'], style: ['smart_casual'], season: ['fall'], imageUrl: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400&q=80', lastWorn: '4 days ago', timesWorn: 38 },
  { id: '11', name: 'Silk Slip Dress', category: 'dress', colors: ['champagne'], style: ['formal'], season: ['summer'], imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80', lastWorn: '2 weeks ago', timesWorn: 5 },
  { id: '12', name: 'Vintage Denim Jacket', category: 'outerwear', colors: ['light blue'], style: ['casual'], season: ['spring'], imageUrl: 'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=400&q=80', lastWorn: '1 week ago', timesWorn: 22 },
]

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('clore_onboarded') === 'true')
  const [wardrobe, setWardrobe] = useState(SEED_WARDROBE)
  const [savedOutfits, setSavedOutfits] = useState([])
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('clore_api_key') || '')
  const [showTryOn, setShowTryOn] = useState(false)
  const [tryOnItem, setTryOnItemState] = useState(null)

  const setTryOnItem = (item) => {
    setTryOnItemState(item)
    setShowTryOn(true)
  }

  const closeTryOn = () => {
    setShowTryOn(false)
    setTryOnItemState(null)
  }

  const completeOnboarding = (key) => {
    if (key) { localStorage.setItem('clore_api_key', key); setApiKey(key) }
    localStorage.setItem('clore_onboarded', 'true')
    setOnboarded(true)
  }

  const addWardrobeItem = (item) => setWardrobe(prev => [item, ...prev])
  const saveOutfit = (outfit) => setSavedOutfits(prev => [outfit, ...prev])

  const tabs = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/wardrobe', icon: Shirt, label: 'Wardrobe' },
    { path: '/outfits', icon: Sparkles, label: 'Style' },
    { path: '/shopping', icon: ShoppingBag, label: 'Shop' },
  ]

  const contextValue = {
    wardrobe, addWardrobeItem,
    savedOutfits, saveOutfit,
    apiKey, setApiKey,
    setTryOnItem,
  }

  if (!onboarded) {
    return (
      <AppContext.Provider value={contextValue}>
        <OnboardingPage onComplete={completeOnboarding} />
      </AppContext.Provider>
    )
  }

  const isTabActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <AppContext.Provider value={contextValue}>
      <div style={{ paddingBottom: 80 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/wardrobe" element={<WardrobePage />} />
          <Route path="/outfits" element={<OutfitsPage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
        </Routes>
      </div>

      <nav className="bottom-nav">
        <div style={{ display: 'flex', padding: '8px 0 20px' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = isTabActive(tab.path)
            return (
              <button key={tab.path} onClick={() => navigate(tab.path)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}>
                <Icon size={22} strokeWidth={active ? 2.2 : 1.6} style={{ color: active ? '#1A1A1A' : 'rgba(26,26,26,0.35)' }} />
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? '#1A1A1A' : 'rgba(26,26,26,0.35)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {showTryOn && <TryOnPage item={tryOnItem} onClose={closeTryOn} />}

    </AppContext.Provider>
  )
}
