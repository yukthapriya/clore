import React, { useState, useRef } from 'react'
import { X, Sparkles, RefreshCw } from 'lucide-react'
import { useApp } from '../App.jsx'

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

async function fetchImageAsBase64(url) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    return url // return as-is if fetch fails
  }
}

export default function TryOnPage({ item, onClose }) {
  const { wardrobe } = useApp()
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('clore_avatar') || null)
  const [avatarB64, setAvatarB64] = useState(() => localStorage.getItem('clore_avatar') || null)
  const [selectedItem, setSelectedItem] = useState(item || null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState(null)
  const avatarFileRef = useRef()
  const garmentFileRef = useRef()

  const tryOnItems = wardrobe.filter(i => ['top','bottom','dress','outerwear'].includes(i.category))

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const b64 = await toBase64(file)
    localStorage.setItem('clore_avatar', b64)
    setAvatarUrl(b64)
    setAvatarB64(b64)
    e.target.value = ''
  }

  const handleGarmentUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const b64 = await toBase64(file)
    setSelectedItem({
      id: Date.now().toString(),
      name: file.name.replace(/\.[^/.]+$/, '') || 'Uploaded Item',
      category: 'top',
      imageUrl: b64,
      imageB64: b64,
    })
    e.target.value = ''
  }

  const handleTryOn = async () => {
    if (!avatarB64) return setError('Please upload your photo first')
    if (!selectedItem) return setError('Please select or upload a garment')
    setLoading(true)
    setError(null)
    setResult(null)
    const msgs = ['Uploading images...','Analyzing your photo...','Fitting the garment...','Rendering your look...','Almost ready...']
    let mi = 0
    setLoadingMsg(msgs[0])
    const interval = setInterval(() => {
      mi = Math.min(mi+1, msgs.length-1)
      setLoadingMsg(msgs[mi])
    }, 8000)

    try {
      // Get garment as base64 — if it's a URL, convert it
      let garmentB64 = selectedItem.imageB64 || selectedItem.imageUrl
      if (garmentB64 && !garmentB64.startsWith('data:')) {
        console.log('Converting garment URL to base64...')
        garmentB64 = await fetchImageAsBase64(garmentB64)
      }

      console.log('Person image starts with:', avatarB64?.slice(0, 30))
      console.log('Garment image starts with:', garmentB64?.slice(0, 30))

      // Call Python server directly — bypass Node
      const res = await fetch('http://localhost:3002/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelImage: avatarB64,
          garmentImage: garmentB64,
          category: selectedItem.category || 'top',
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Try-on failed')
      setResult(data.output)
    } catch(e) {
      setError(e.message)
    } finally {
      clearInterval(interval)
      setLoading(false)
      setLoadingMsg('')
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'#F7F4EF', zIndex:300, overflowY:'auto', maxWidth:430, margin:'0 auto', left:'50%', transform:'translateX(-50%)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'56px 24px 20px', borderBottom:'1px solid rgba(139,115,85,0.1)' }}>
        <div>
          <h1 style={{ fontFamily:'Georgia, serif', fontSize:26, fontWeight:700 }}>Virtual Try-On</h1>
          <p style={{ fontSize:12, color:'rgba(26,26,26,0.45)' }}>AI powered • Runs on your Mac</p>
        </div>
        <button onClick={onClose} style={{ width:36, height:36, borderRadius:'50%', background:'rgba(26,26,26,0.08)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ padding:'24px 24px 80px' }}>

        <div style={{ marginBottom:20, padding:'12px 16px', background:'rgba(122,140,110,0.1)', borderRadius:12, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>✓</span>
          <div>
            <p style={{ fontSize:13, fontWeight:600, color:'#7A8C6E' }}>Running locally on your Mac</p>
            <p style={{ fontSize:11, color:'rgba(26,26,26,0.5)' }}>No API key needed — completely free</p>
          </div>
        </div>

        {/* Your Photo */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <p className="section-label">Step 1 — Your Photo</p>
            {avatarUrl && <button onClick={() => avatarFileRef.current?.click()} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#8B7355', fontWeight:600 }}>↺ Change</button>}
          </div>
          <div onClick={() => avatarFileRef.current?.click()} style={{ width:'100%', height: avatarUrl ? 300 : 200, borderRadius:20, overflow:'hidden', border: avatarUrl ? '2px solid rgba(122,140,110,0.3)' : '2px dashed rgba(139,115,85,0.3)', background:'rgba(139,115,85,0.04)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="You" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <div style={{ textAlign:'center', padding:24 }}>
                  <div style={{ fontSize:52, marginBottom:12 }}>🧍</div>
                  <p style={{ fontSize:15, fontWeight:700, color:'#8B7355', marginBottom:8 }}>Upload your full-body photo</p>
                  <p style={{ fontSize:12, color:'rgba(26,26,26,0.4)', lineHeight:1.8 }}>
                    ✓ Stand straight, face camera<br/>
                    ✓ Full body — head to toe<br/>
                    ✓ Plain background works best
                  </p>
                </div>
            }
          </div>
          <input type="file" accept="image/*" ref={avatarFileRef} onChange={handleAvatarUpload} style={{ display:'none' }} />
        </div>

        {/* Garment */}
        <div style={{ marginBottom:24 }}>
          <p className="section-label" style={{ marginBottom:10 }}>Step 2 — Clothing Item</p>
          <button onClick={() => garmentFileRef.current?.click()} style={{ width:'100%', padding:'16px', borderRadius:14, border:'2px dashed rgba(139,115,85,0.3)', background:'rgba(139,115,85,0.04)', cursor:'pointer', marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:28 }}>👗</span>
            <div style={{ textAlign:'left' }}>
              <p style={{ fontSize:13, fontWeight:700, color:'#8B7355' }}>Upload clothing photo</p>
              <p style={{ fontSize:11, color:'rgba(26,26,26,0.4)' }}>Best: flat lay on white background</p>
            </div>
          </button>
          <input type="file" accept="image/*" ref={garmentFileRef} onChange={handleGarmentUpload} style={{ display:'none' }} />

          {selectedItem?.imageB64 && (
            <div style={{ borderRadius:14, overflow:'hidden', height:180, marginBottom:14, border:'2px solid rgba(122,140,110,0.3)' }}>
              <img src={selectedItem.imageB64} alt="Garment" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </div>
          )}

          {tryOnItems.length > 0 && (
            <>
              <p style={{ fontSize:11, color:'rgba(26,26,26,0.4)', textAlign:'center', marginBottom:12 }}>— or pick from wardrobe —</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
                {tryOnItems.map(wItem => (
                  <div key={wItem.id} onClick={() => { setSelectedItem(wItem); setResult(null) }} style={{ cursor:'pointer' }}>
                    <div style={{ aspectRatio:'3/4', borderRadius:12, overflow:'hidden', border: selectedItem?.id === wItem.id ? '3px solid #1A1A1A' : '3px solid transparent', transition:'border 0.15s', position:'relative' }}>
                      <img src={wItem.imageUrl} alt={wItem.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      {selectedItem?.id === wItem.id && (
                        <div style={{ position:'absolute', top:6, right:6, width:20, height:20, borderRadius:'50%', background:'#1A1A1A', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontSize:10, color:'white' }}>✓</span>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize:10, color:'rgba(26,26,26,0.55)', marginTop:5, textAlign:'center', lineHeight:1.2 }}>{wItem.name}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <button className="btn-primary" onClick={handleTryOn} disabled={!avatarB64 || !selectedItem || loading} style={{ width:'100%', padding:'18px', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:10 }}>
          {loading ? <><div className="spinner" style={{ borderTopColor:'#F7F4EF' }} />{loadingMsg}</> : <><Sparkles size={20} />Try It On Me</>}
        </button>

        {loading && <p style={{ textAlign:'center', fontSize:12, color:'rgba(26,26,26,0.4)', marginBottom:20 }}>Running AI on your Mac — takes 1-3 minutes ☕</p>}

        {error && (
          <div style={{ padding:'14px 16px', background:'rgba(192,57,43,0.08)', borderRadius:12, border:'1px solid rgba(192,57,43,0.2)', marginBottom:20 }}>
            <p style={{ fontSize:13, color:'#c0392b', lineHeight:1.5 }}>⚠️ {error}</p>
          </div>
        )}

        {result && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <p className="section-label">Your Look ✨</p>
              <button onClick={() => setResult(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'rgba(26,26,26,0.4)' }}>Try another</button>
            </div>
            <div style={{ borderRadius:20, overflow:'hidden', border:'2px solid rgba(122,140,110,0.2)', marginBottom:14 }}>
              <img src={result} alt="Try-on result" style={{ width:'100%', display:'block' }} />
            </div>
            <div style={{ padding:'14px 18px', background:'rgba(122,140,110,0.1)', borderRadius:14, textAlign:'center' }}>
              <p style={{ fontSize:14, fontWeight:700, color:'#7A8C6E' }}>✓ Wearing: {selectedItem?.name}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
