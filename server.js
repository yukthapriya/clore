import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TRYON_URL = process.env.TRYON_URL || 'http://localhost:3002'

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.post('/api/tryon', async (req, res) => {
  try {
    console.log(`Forwarding to Python server at ${TRYON_URL}...`)
    const r = await fetch(`${TRYON_URL}/api/tryon`, {
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

// Serve built React app in production
const distPath = join(__dirname, 'dist')
if (existsSync(distPath)) {
  const { default: sirv } = await import('sirv')
  app.use(sirv(distPath, { single: true }))
  console.log(`Serving static files from ${distPath}`)
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`✅ Node server listening on port ${PORT}, forwarding try-on to ${TRYON_URL}`))
