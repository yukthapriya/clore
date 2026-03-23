import React, { useState } from 'react'
import { ChevronRight, Key, Eye, EyeOff } from 'lucide-react'

export default function OnboardingPage({ onComplete }) {
  const [step, setStep] = useState(0)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)

  const steps = [
    { title: 'Meet Cloré.', subtitle: 'Your AI-powered personal stylist that knows your wardrobe inside out.', cta: 'Get Started' },
    { title: 'Your digital closet.', subtitle: "We've pre-loaded a sample wardrobe so you can explore right away.", description: 'Add your own clothes with the camera, and AI will tag everything automatically.', cta: 'Nice, continue' },
    { title: 'Add your Claude API key', subtitle: 'Cloré uses Claude AI for styling advice and outfit suggestions.', description: 'Your key is stored locally in your browser only. Get a free key at console.anthropic.com', cta: 'Enter the app', hasInput: true },
  ]

  const current = steps[step]

  const illustrations = [
    <div key="0" style={{ position: 'relative', width: 200, height: 200, margin: '0 auto' }}>
      <div style={{ width: 200, height: 200, borderRadius: '50%', background: 'linear-gradient(135deg, #1A1A1A 0%, #8B7355 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 72, color: '#F7F4EF', fontStyle: 'italic' }}>D</span>
      </div>
    </div>,
    <div key="1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 240, margin: '0 auto' }}>
      {[
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200&q=80',
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200&q=80',
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&q=80',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200&q=80',
        'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=200&q=80',
      ].map((url, i) => (
        <div key={i} style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden' }}>
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}
    </div>,
    <div key="2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(139,115,85,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Key size={40} style={{ color: '#8B7355' }} />
      </div>
    </div>
  ]

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: '0 24px', background: '#F7F4EF' }}>
      <div style={{ display: 'flex', gap: 6, padding: '60px 0 40px', justifyContent: 'center' }}>
        {steps.map((_, i) => (
          <div key={i} style={{ width: i === step ? 24 : 6, height: 6, borderRadius: 3, background: i <= step ? '#1A1A1A' : 'rgba(26,26,26,0.15)', transition: 'all 0.3s' }} />
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
        {illustrations[step]}
      </div>
      <div style={{ paddingBottom: 48 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 700, lineHeight: 1.1, marginBottom: 12, letterSpacing: '-0.02em' }}>{current.title}</h1>
        <p style={{ fontSize: 17, lineHeight: 1.5, color: 'rgba(26,26,26,0.65)', marginBottom: 8 }}>{current.subtitle}</p>
        {current.description && <p style={{ fontSize: 14, lineHeight: 1.5, color: 'rgba(26,26,26,0.45)', marginBottom: 24 }}>{current.description}</p>}
        {current.hasInput && (
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <input type={showKey ? 'text' : 'password'} className="input-field" placeholder="sk-ant-api03-..." value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ paddingRight: 48, fontFamily: 'monospace', fontSize: 13 }} />
            <button onClick={() => setShowKey(!showKey)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(26,26,26,0.4)' }}>
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        )}
        <button className="btn-primary" onClick={() => step < steps.length - 1 ? setStep(step + 1) : onComplete(apiKey)} style={{ width: '100%', padding: '16px 24px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {current.cta} <ChevronRight size={18} />
        </button>
        {step === 2 && (
          <button onClick={() => onComplete('')} style={{ width: '100%', marginTop: 12, padding: '14px 24px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(26,26,26,0.45)', fontSize: 14 }}>
            Skip for now (limited AI features)
          </button>
        )}
      </div>
    </div>
  )
}
