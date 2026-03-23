import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronRight, Key } from 'lucide-react'
import { useApp } from '../App.jsx'

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const getDay = () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

export default function HomePage() {
  const navigate = useNavigate()
  const { wardrobe, apiKey, setApiKey } = useApp()
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [keyInput, setKeyInput] = useState(apiKey)

  return (
    <div className="page-enter" style={{ padding: '0 0 16px' }}>
      <div style={{ padding: '60px 24px 24px', background: 'linear-gradient(180deg, rgba(232,197,176,0.3) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="section-label" style={{ marginBottom: 6 }}>{getDay()}</p>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{getGreeting()}</h1>
          </div>
          <button onClick={() => setShowKeyModal(true)} style={{ width: 40, height: 40, borderRadius: '50%', background: apiKey ? 'rgba(122,140,110,0.15)' : 'rgba(139,115,85,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
            <Key size={16} style={{ color: apiKey ? '#7A8C6E' : '#8B7355' }} />
          </button>
        </div>
      </div>

      {!apiKey && (
        <div onClick={() => setShowKeyModal(true)} style={{ margin: '0 24px 20px', padding: '12px 16px', background: 'rgba(139,115,85,0.08)', borderRadius: 12, border: '1px dashed rgba(139,115,85,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Key size={16} style={{ color: '#8B7355', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#8B7355', marginBottom: 2 }}>Add Claude API key</p>
            <p style={{ fontSize: 12, color: 'rgba(26,26,26,0.5)' }}>Unlock AI outfit suggestions & style tips</p>
          </div>
          <ChevronRight size={16} style={{ color: '#8B7355', marginLeft: 'auto' }} />
        </div>
      )}

      <div style={{ padding: '0 24px 24px' }}>
        <button onClick={() => navigate('/outfits')} style={{ width: '100%', background: '#1A1A1A', borderRadius: 20, padding: '24px 20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(247,244,239,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={24} style={{ color: '#E8C5B0' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'rgba(247,244,239,0.6)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Daily Question</p>
            <p style={{ color: '#F7F4EF', fontSize: 20, fontFamily: 'Georgia, serif', fontWeight: 700, lineHeight: 1.2 }}>What should I wear today?</p>
          </div>
          <ChevronRight size={20} style={{ color: 'rgba(247,244,239,0.4)' }} />
        </button>
      </div>

      <div style={{ padding: '0 24px 28px', display: 'flex', gap: 12 }}>
        {[
          { label: 'Items', value: wardrobe.length, color: '#8B7355' },
          { label: 'Categories', value: [...new Set(wardrobe.map(i => i.category))].length, color: '#7A8C6E' },
          { label: 'Possible outfits', value: Math.floor(wardrobe.length * 1.8), color: '#1A1A1A' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ flex: 1, padding: '14px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 26, fontFamily: 'Georgia, serif', fontWeight: 700, color: stat.color }}>{stat.value}</p>
            <p style={{ fontSize: 11, color: 'rgba(26,26,26,0.45)', marginTop: 2 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 24px 28px' }}>
        <p className="section-label" style={{ marginBottom: 14 }}>Quick Actions</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Plan an outfit', sub: 'For any occasion', emoji: '✨', path: '/outfits', color: '#E8C5B0' },
            { label: 'Browse my wardrobe', sub: `${wardrobe.length} items catalogued`, emoji: '👗', path: '/wardrobe', color: 'rgba(122,140,110,0.15)' },
            { label: 'Check a new piece', sub: 'Does it work with my style?', emoji: '🛍️', path: '/shopping', color: 'rgba(139,115,85,0.1)' },
          ].map((action, i) => (
            <button key={i} className="card" onClick={() => navigate(action.path)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>{action.emoji}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A' }}>{action.label}</p>
                <p style={{ fontSize: 12, color: 'rgba(26,26,26,0.45)', marginTop: 2 }}>{action.sub}</p>
              </div>
              <ChevronRight size={16} style={{ color: 'rgba(26,26,26,0.25)' }} />
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p className="section-label">Recent Items</p>
          <button onClick={() => navigate('/wardrobe')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#8B7355', fontWeight: 500 }}>See all</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {wardrobe.slice(0, 4).map((item) => (
            <div key={item.id} style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '3/4' }}>
              <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>

      {showKeyModal && (
        <div className="modal-overlay" onClick={() => setShowKeyModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ padding: 24 }}>
            <div style={{ width: 36, height: 4, background: 'rgba(26,26,26,0.15)', borderRadius: 2, margin: '0 auto 24px' }} />
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Claude API Key</h3>
            <p style={{ fontSize: 14, color: 'rgba(26,26,26,0.55)', marginBottom: 20, lineHeight: 1.5 }}>Stored locally in your browser. Get one free at console.anthropic.com</p>
            <input type="text" className="input-field" placeholder="sk-ant-api03-..." value={keyInput} onChange={e => setKeyInput(e.target.value)} style={{ fontFamily: 'monospace', fontSize: 13, marginBottom: 14 }} />
            <button className="btn-primary" onClick={() => { setApiKey(keyInput); localStorage.setItem('clore_api_key', keyInput); setShowKeyModal(false) }} style={{ width: '100%', padding: '14px', fontSize: 15 }}>Save Key</button>
          </div>
        </div>
      )}
    </div>
  )
}
