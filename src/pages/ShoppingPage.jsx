import React, { useState } from 'react'
import { Sparkles, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import { useApp } from '../App.jsx'

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY

async function analyzeItem(itemDescription, wardrobeJson) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `You are a personal stylist. The user is considering buying:\n"${itemDescription}"\n\nTheir wardrobe:\n${wardrobeJson}\n\nReturn ONLY a JSON object (no markdown) with:\n- score: compatibility score 0-100 (integer)\n- verdict: one of "Great Buy", "Good Addition", "Situational", "Already Covered", "Style Clash"\n- pairsWell: array of up to 4 exact wardrobe item names it pairs well with\n- whyItWorks: 2 sentences on why it fits their wardrobe\n- gaps: one sentence on what gap it fills (or null)\n- caution: one potential concern (or null)\n- outfitCount: estimated new outfits this unlocks (integer)`
      }]
    })
  })
  if (!response.ok) throw new Error(`Groq error: ${response.status}`)
  const data = await response.json()
  const text = data.choices[0]?.message?.content || '{}'
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}

const SCORE_COLOR = (score) => score >= 75 ? '#7A8C6E' : score >= 50 ? '#8B7355' : '#c0392b'

export default function ShoppingPage() {
  const { wardrobe } = useApp()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [inputItem, setInputItem] = useState('')

  const wardrobeJson = JSON.stringify(wardrobe.map(({ name, category, colors, style }) => ({ name, category, colors, style })), null, 2)

  const analyze = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setInputItem(input)
    try {
      setResult(await analyzeItem(input, wardrobeJson))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const pairedItems = result?.pairsWell?.map(name =>
    wardrobe.find(w => w.name === name || w.name.toLowerCase().includes(name.toLowerCase()))
  ).filter(Boolean) || []

  return (
    <div className="page-enter" style={{ padding: '0 0 16px' }}>
      <div style={{ padding: '60px 24px 24px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Should I Buy It?</h1>
        <p style={{ fontSize: 14, color: 'rgba(26,26,26,0.5)' }}>Free AI compatibility check • Powered by Groq</p>
      </div>

      <div style={{ padding: '0 24px 16px' }}>
        <textarea className="input-field" placeholder={"Describe the item you're considering...\n\ne.g. 'Forest green corduroy overshirt, slightly oversized'"} value={input} onChange={e => setInput(e.target.value)} rows={4} style={{ resize: 'none', lineHeight: 1.6 }} />
        <p style={{ fontSize: 12, color: 'rgba(26,26,26,0.4)', lineHeight: 1.4, margin: '8px 0 12px' }}>💡 Be specific about color, style, and fit.</p>
        <button className="btn-primary" onClick={analyze} disabled={loading || !input.trim()} style={{ width: '100%', padding: '16px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <><div className="spinner" style={{ borderTopColor: '#F7F4EF' }} />Analyzing...</> : <><Sparkles size={18} />Analyze Compatibility</>}
        </button>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(26,26,26,0.4)', marginTop: 8 }}>✓ Free — powered by Groq AI</p>
      </div>

      {loading && (
        <div style={{ padding: '8px 24px' }}>
          {[160, 80, 120].map((h, i) => <div key={i} className="skeleton" style={{ height: h, borderRadius: 20, marginBottom: 12 }} />)}
        </div>
      )}

      {error && <div style={{ margin: '0 24px', padding: '14px 16px', background: 'rgba(192,57,43,0.08)', borderRadius: 12, border: '1px solid rgba(192,57,43,0.2)' }}><p style={{ fontSize: 13, color: '#c0392b' }}>{error}</p></div>}

      {result && !loading && (
        <div style={{ padding: '8px 24px' }}>
          <div className="card-elevated" style={{ padding: 24, marginBottom: 16 }}>
            <p className="section-label" style={{ marginBottom: 12 }}>"{inputItem}"</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', border: `4px solid ${SCORE_COLOR(result.score)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${SCORE_COLOR(result.score)}12` }}>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: SCORE_COLOR(result.score) }}>{result.score}</span>
                <span style={{ fontSize: 9, color: 'rgba(26,26,26,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>score</span>
              </div>
              <div>
                <div style={{ display: 'inline-flex', padding: '6px 14px', borderRadius: 100, marginBottom: 8, background: `${SCORE_COLOR(result.score)}15` }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: SCORE_COLOR(result.score) }}>{result.verdict}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={14} style={{ color: '#8B7355' }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Unlocks ~{result.outfitCount} new outfits</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 18px', marginBottom: 12 }}>
            <p className="section-label" style={{ marginBottom: 8 }}>Why it works</p>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>{result.whyItWorks}</p>
          </div>

          {pairedItems.length > 0 && (
            <div className="card" style={{ padding: '16px 18px', marginBottom: 12 }}>
              <p className="section-label" style={{ marginBottom: 12 }}>Pairs well with</p>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
                {pairedItems.map((item, i) => (
                  <div key={i} style={{ flexShrink: 0, width: 80, textAlign: 'center' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', marginBottom: 6 }}>
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <p style={{ fontSize: 10, color: 'rgba(26,26,26,0.6)', lineHeight: 1.3 }}>{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {result.gaps && (
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(122,140,110,0.1)', borderLeft: '3px solid #7A8C6E', display: 'flex', gap: 10 }}>
                <CheckCircle size={16} style={{ color: '#7A8C6E', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, lineHeight: 1.5 }}>{result.gaps}</p>
              </div>
            )}
            {result.caution && (
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(139,115,85,0.08)', borderLeft: '3px solid #8B7355', display: 'flex', gap: 10 }}>
                <AlertTriangle size={16} style={{ color: '#8B7355', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, lineHeight: 1.5 }}>{result.caution}</p>
              </div>
            )}
          </div>

          <button className="btn-secondary" onClick={() => { setResult(null); setInput(''); setInputItem('') }} style={{ width: '100%', padding: '14px', fontSize: 14 }}>
            Analyze another item
          </button>
        </div>
      )}

      {!result && !loading && (
        <div style={{ padding: '20px 24px' }}>
          <p className="section-label" style={{ marginBottom: 14 }}>Your wardrobe ({wardrobe.length} items)</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {wardrobe.slice(0, 8).map((item) => (
              <div key={item.id} style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1' }}>
                <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'rgba(26,26,26,0.4)', marginTop: 12, textAlign: 'center' }}>Describe a new piece above to check if it works</p>
        </div>
      )}
    </div>
  )
}
