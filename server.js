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

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.static(distPath))

app.post('/api/tryon', async (req, res) => {
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

app.get('*', (_, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(port, () => console.log(`✅ Node server listening on http://localhost:${port}`))
