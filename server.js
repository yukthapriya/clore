import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.join(__dirname, 'dist')
const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:3002'
const port = Number(process.env.PORT || 3001)
const rateLimitWindowMs = 60_000
const rateLimitMaxRequests = 120
const requestCounts = new Map()

function rateLimit(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const entry = requestCounts.get(key)

  if (!entry || now - entry.startedAt >= rateLimitWindowMs) {
    requestCounts.set(key, { count: 1, startedAt: now })
    return next()
  }

  if (entry.count >= rateLimitMaxRequests) {
    return res.status(429).json({ error: 'Too many requests. Please try again shortly.' })
  }

  entry.count += 1
  return next()
}

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.static(distPath))

app.post('/api/tryon', rateLimit, async (req, res) => {
  try {
    console.log(`Forwarding try-on request to ${pythonServiceUrl}...`)
    const r = await fetch(`${pythonServiceUrl}/api/tryon`, {
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

app.get('*', rateLimit, (_, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(port, () => console.log(`✅ Node server listening on http://localhost:${port}`))
