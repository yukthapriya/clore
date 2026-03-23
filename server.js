import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.post('/api/tryon', async (req, res) => {
  try {
    console.log('Forwarding to Python server on port 3002...')
    const r = await fetch('http://localhost:3002/api/tryon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })
    const data = await r.json()
    console.log('Python response:', JSON.stringify(data).slice(0, 100))
    res.status(r.status).json(data)
  } catch (e) {
    console.error('Error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

app.get('/health', (_, res) => res.json({ ok: true }))
app.listen(3001, () => console.log('✅ Node server forwarding to Python on http://localhost:3001'))
