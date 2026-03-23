import React, { useState } from 'react'
import { Sparkles, Heart, Sun, Coffee, Briefcase, Music } from 'lucide-react'
import { useApp } from '../App.jsx'

const OCCASIONS = [
  { id: 'casual', label: 'Casual', icon: '☕' },
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'date', label: 'Date Night', icon: '💫' },
  { id: 'outdoor', label: 'Outdoors', icon: '🌤️' },
  { id: 'party', label: 'Night Out', icon: '🎵' },
]

const MOODS = ['Minimalist', 'Bold', 'Classic', 'Playful', 'Cozy', 'Sharp']

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY

async function callGroq(wardrobeJson, occasion, mood) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are a chic personal stylist. Given this wardrobe:\n${wardrobeJson}\n\nOccasion: ${occasion}\nMood: ${mood}\n\nSuggest 3 complete outfit combinations using ONLY items from this wardrobe.\nFor each outfit return a JSON object with:\n- name: creative outfit name (2-4 words)\n- items: array of exact item names from the wardrobe (2-4 items)\n- vibe: one sentence on the overall look\n- tip: one specific styling tip\n- colorStory: brief note on why the colors work\n\nReturn ONLY a JSON array of 3 outfit objects, no explanation, no markdown.`
      }]
    })
  })
  if (!response.ok) throw new Error(`Groq error: ${response.status}`)
  const data = await response.json()
  const text = data.choices[0]?.message?.content || '[]'
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}

function OutfitCard({ outfit, wardrobe, onSave, saved }) {
  const items = outfit.items.map(name =>
    wardrobe.find(w => w.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(w.name.toLowerCase()))
  ).filter(Boolean)

  return (
    <div className="outfit-card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', height: 120, overflow: 'hidden' }}>
        {items.slice(0, 3).map((item, i) => (
          <div key={i} style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {i < items.length - 1 && <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, background: 'rgba(247,244,239,0.6)' }} />}
          </div>
        ))}
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, flex: 1 }}>{outfit.name}</h3>
          <button onClick={onSave} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: saved ? '#c0392b' : 'rgba(26,26,26,0.3)' }}>
            <Heart size={20} fill={saved ? '#c0392b' : 'none'} />
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(26,26,26,0.6)', lineHeight: 1.5, marginBottom: 12 }}>{outfit.vibe}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {outfit.items.map((item, i) => <span key={i} className="chip chip-charcoal">{item}</span>)}
        </div>
        <div style={{ background: 'rgba(139,115,85,0.08)', borderRadius: 10, padding: '10px 12px', borderLeft: '3px solid #8B7355' }}>
          <p style={{ fontSize: 11, color: '#8B7355', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Stylist Tip</p>
          <p style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.4 }}>{outfit.tip}</p>
        </div>
        {outfit.colorStory && <p style={{ fontSize: 12, color: 'rgba(26,26,26,0.45)', marginTop: 10, lineHeight: 1.4, fontStyle: 'italic' }}>🎨 {outfit.colorStory}</p>}
      </div>
    </div>
  )
}

export default function OutfitsPage() {
  const { wardrobe, savedOutfits, saveOutfit } = useApp()
  const [occasion, setOccasion] = useState('casual')
  const [mood, setMood] = useState('Classic')
  const [outfits, setOutfits] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [savedIds, setSavedIds] = useState(new Set())

  const wardrobeJson = JSON.stringify(wardrobe.map(({ id, name, category, colors, style, season }) => ({ id, name, category, colors, style, season })), null, 2)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await callGroq(wardrobeJson, occasion, mood)
      setOutfits(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = (outfit, idx) => {
    if (!savedIds.has(idx)) {
      saveOutfit({ ...outfit, id: Date.now() })
      setSavedIds(prev => new Set([...prev, idx]))
    }
  }

  return (
    <div className="page-enter" style={{ padding: '0 0 16px' }}>
      <div style={{ padding: '60px 24px 24px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Style Me</h1>
        <p style={{ fontSize: 14, color: 'rgba(26,26,26,0.5)' }}>Free AI outfit suggestions • Powered by Groq</p>
      </div>

      <div style={{ padding: '0 24px 16px' }}>
        <p className="section-label" style={{ marginBottom: 12 }}>Occasion</p>
        <div className="filter-scroll">
          {OCCASIONS.map(occ => (
            <button key={occ.id} onClick={() => setOccasion(occ.id)} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: occasion === occ.id ? '#1A1A1A' : 'rgba(26,26,26,0.06)', color: occasion === occ.id ? '#F7F4EF' : 'rgba(26,26,26,0.6)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
              {occ.icon} {occ.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        <p className="section-label" style={{ marginBottom: 12 }}>Mood</p>
        <div className="filter-scroll">
          {MOODS.map(m => (
            <button key={m} onClick={() => setMood(m)} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 100, border: `1.5px solid ${mood === m ? '#8B7355' : 'rgba(139,115,85,0.2)'}`, cursor: 'pointer', fontSize: 13, fontWeight: 500, background: mood === m ? 'rgba(139,115,85,0.1)' : 'transparent', color: mood === m ? '#8B7355' : 'rgba(26,26,26,0.6)', transition: 'all 0.2s' }}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px 28px' }}>
        <button className="btn-primary" onClick={generate} disabled={loading} style={{ width: '100%', padding: '16px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <><div className="spinner" style={{ borderTopColor: '#F7F4EF' }} />Styling...</> : <><Sparkles size={18} />{outfits.length ? 'Regenerate Outfits' : 'Generate Outfits'}</>}
        </button>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(26,26,26,0.4)', marginTop: 8 }}>✓ Free — powered by Groq AI</p>
      </div>

      {loading && (
        <div style={{ padding: '0 24px' }}>
          {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 240, borderRadius: 20, marginBottom: 16 }} />)}
        </div>
      )}

      {error && <div style={{ margin: '0 24px 20px', padding: '14px 16px', background: 'rgba(192,57,43,0.08)', borderRadius: 12, border: '1px solid rgba(192,57,43,0.2)' }}><p style={{ fontSize: 13, color: '#c0392b' }}>{error}</p></div>}

      {!loading && outfits.length > 0 && (
        <div style={{ padding: '0 24px' }}>
          <p className="section-label" style={{ marginBottom: 16 }}>{outfits.length} outfits suggested</p>
          {outfits.map((outfit, i) => <OutfitCard key={i} outfit={outfit} wardrobe={wardrobe} saved={savedIds.has(i)} onSave={() => handleSave(outfit, i)} />)}
        </div>
      )}

      {!loading && outfits.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: 'rgba(26,26,26,0.4)' }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>✨</p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1A1A1A', marginBottom: 8 }}>Ready to style you</p>
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>Pick an occasion and mood, then tap Generate.</p>
        </div>
      )}
    </div>
  )
}
