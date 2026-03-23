import React, { useState, useRef } from 'react'
import { Plus, Search, X, Camera, Sparkles } from 'lucide-react'
import { useApp } from '../App.jsx'

const CATEGORIES = ['All', 'top', 'bottom', 'outerwear', 'shoes', 'dress', 'accessory']
const CATEGORY_EMOJI = { top: '👕', bottom: '👖', outerwear: '🧥', shoes: '👟', dress: '👗', accessory: '💍' }

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

export default function WardrobePage() {
  const { wardrobe, addWardrobeItem, setTryOnItem } = useApp()
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [newItem, setNewItem] = useState({ name: '', category: 'top', colors: '', style: '' })
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isTagging, setIsTagging] = useState(false)
  const fileRef = useRef()
  const cameraRef = useRef()

  const filtered = wardrobe.filter(item => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleImageSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const b64 = await toBase64(file)
    setPreviewUrl(b64)
    setIsTagging(true)
    setTimeout(() => {
      setNewItem(prev => ({
        ...prev,
        name: prev.name || '',
        colors: prev.colors || '',
        style: prev.style || 'casual',
      }))
      setIsTagging(false)
    }, 1500)
    // reset input so same file can be selected again
    e.target.value = ''
  }

  const handleAdd = () => {
    if (!previewUrl) return alert('Please add a photo first')
    if (!newItem.name.trim()) return alert('Please enter a name for this item')
    addWardrobeItem({
      id: Date.now().toString(),
      name: newItem.name.trim(),
      category: newItem.category,
      colors: newItem.colors.split(',').map(c => c.trim()).filter(Boolean),
      pattern: 'solid',
      style: newItem.style.split(',').map(s => s.trim()).filter(Boolean),
      season: ['all_season'],
      imageUrl: previewUrl,
      lastWorn: 'Never',
      timesWorn: 0,
    })
    setShowAddModal(false)
    setNewItem({ name: '', category: 'top', colors: '', style: '' })
    setPreviewUrl(null)
  }

  const canTryOn = (item) => ['top', 'bottom', 'dress', 'outerwear'].includes(item.category)

  return (
    <div className="page-enter" style={{ padding: '0 0 16px' }}>
      <div style={{ padding: '60px 24px 20px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>My Wardrobe</h1>
        <p style={{ fontSize: 14, color: 'rgba(26,26,26,0.5)' }}>{wardrobe.length} items catalogued</p>
      </div>

      <div style={{ padding: '0 24px 16px', position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 40, top: '50%', transform: 'translateY(-50%)', color: 'rgba(26,26,26,0.35)' }} />
        <input className="input-field" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
        {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 38, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>}
      </div>

      <div className="filter-scroll" style={{ padding: '0 24px 20px' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: activeCategory === cat ? '#1A1A1A' : 'rgba(26,26,26,0.06)', color: activeCategory === cat ? '#F7F4EF' : 'rgba(26,26,26,0.6)', transition: 'all 0.2s' }}>
            {CATEGORY_EMOJI[cat.toLowerCase()] || ''} {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 24px' }}>
        <div className="wardrobe-grid">
          <button onClick={() => setShowAddModal(true)} style={{ aspectRatio: '3/4', borderRadius: 12, border: '2px dashed rgba(139,115,85,0.3)', background: 'rgba(139,115,85,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
            <Plus size={24} style={{ color: '#8B7355' }} />
            <span style={{ fontSize: 11, color: '#8B7355', fontWeight: 500 }}>Add Item</span>
          </button>
          {filtered.map((item) => (
            <div key={item.id} onClick={() => setSelectedItem(item)} style={{ aspectRatio: '3/4', borderRadius: 12, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
              <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(26,26,26,0.8))', padding: '24px 8px 8px' }}>
                <p style={{ fontSize: 10, color: 'white', fontWeight: 500, lineHeight: 1.2 }}>{item.name}</p>
              </div>
              {canTryOn(item) && (
                <button onClick={e => { e.stopPropagation(); setTryOnItem(item) }} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(26,26,26,0.8)', border: 'none', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Sparkles size={10} style={{ color: '#E8C5B0' }} />
                  <span style={{ fontSize: 9, color: 'white', fontWeight: 700 }}>TRY</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: 'rgba(26,26,26,0.15)', borderRadius: 2, margin: '12px auto 0' }} />
            <img src={selectedItem.imageUrl} alt={selectedItem.name} style={{ width: '100%', height: 280, objectFit: 'cover' }} />
            <div style={{ padding: '20px 24px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700 }}>{selectedItem.name}</h3>
                <span className="chip chip-charcoal">{selectedItem.category}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {selectedItem.colors.map(c => <span key={c} className="chip chip-mink">{c}</span>)}
                {selectedItem.style.map(s => <span key={s} className="chip chip-sage">{s}</span>)}
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div><p className="section-label">Last Worn</p><p style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{selectedItem.lastWorn}</p></div>
                <div><p className="section-label">Times Worn</p><p style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{selectedItem.timesWorn}×</p></div>
              </div>
              {canTryOn(selectedItem) && (
                <button className="btn-primary" onClick={() => { setSelectedItem(null); setTryOnItem(selectedItem) }} style={{ width: '100%', padding: '14px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Sparkles size={16} /> Try This On Me
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ padding: 24 }}>
            <div style={{ width: 36, height: 4, background: 'rgba(26,26,26,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Add to Wardrobe</h3>
            <p style={{ fontSize: 13, color: 'rgba(26,26,26,0.45)', marginBottom: 16 }}>Upload a photo of your clothing item</p>

            {/* Preview */}
            {previewUrl && (
              <div style={{ width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 16, position: 'relative' }}>
                <img src={previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => setPreviewUrl(null)} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(26,26,26,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} style={{ color: 'white' }} />
                </button>
                {isTagging && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(247,244,239,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <div className="spinner" />
                    <p style={{ fontSize: 13, color: '#8B7355', fontWeight: 500 }}>Processing image...</p>
                  </div>
                )}
              </div>
            )}

            {/* Two upload buttons — camera and gallery */}
            {!previewUrl && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <button
                  onClick={() => cameraRef.current?.click()}
                  style={{ padding: '20px 12px', borderRadius: 14, border: '2px dashed rgba(139,115,85,0.3)', background: 'rgba(139,115,85,0.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                >
                  <span style={{ fontSize: 28 }}>📷</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#8B7355' }}>Take Photo</span>
                  <span style={{ fontSize: 11, color: 'rgba(26,26,26,0.4)' }}>Use camera</span>
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{ padding: '20px 12px', borderRadius: 14, border: '2px dashed rgba(139,115,85,0.3)', background: 'rgba(139,115,85,0.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                >
                  <span style={{ fontSize: 28 }}>🖼️</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#8B7355' }}>From Gallery</span>
                  <span style={{ fontSize: 11, color: 'rgba(26,26,26,0.4)' }}>Browse files</span>
                </button>
              </div>
            )}

            {/* Hidden file inputs - separate for camera vs gallery */}
            <input type="file" accept="image/*" capture="camera" ref={cameraRef} onChange={handleImageSelect} style={{ display: 'none' }} />
            <input type="file" accept="image/*" ref={fileRef} onChange={handleImageSelect} style={{ display: 'none' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <input className="input-field" placeholder="Item name e.g. Blue Linen Shirt *" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
              <select className="input-field" value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}>
                {['top', 'bottom', 'outerwear', 'shoes', 'dress', 'accessory'].map(c => (
                  <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <input className="input-field" placeholder="Color e.g. navy, white" value={newItem.colors} onChange={e => setNewItem(p => ({ ...p, colors: e.target.value }))} />
              <input className="input-field" placeholder="Style e.g. casual, formal" value={newItem.style} onChange={e => setNewItem(p => ({ ...p, style: e.target.value }))} />
            </div>

            <button
              className="btn-primary"
              onClick={handleAdd}
              disabled={!previewUrl || isTagging || !newItem.name.trim()}
              style={{ width: '100%', padding: '15px', fontSize: 15, opacity: (!previewUrl || isTagging || !newItem.name.trim()) ? 0.5 : 1 }}
            >
              {!previewUrl ? '📷 Add a photo first' : !newItem.name.trim() ? 'Enter a name' : 'Add to Wardrobe ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
