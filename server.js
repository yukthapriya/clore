import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const port = Number(process.env.PORT) || 3001
const rawPythonTryOnUrl = process.env.PYTHON_TRYON_URL || 'http://localhost:3002'
const pythonTryOnUrl = /^https?:\/\//.test(rawPythonTryOnUrl)
  ? rawPythonTryOnUrl
  : `http://${rawPythonTryOnUrl}`
app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.post('/api/tryon', async (req, res) => {
  try {
    const endpoint = `${pythonTryOnUrl.replace(/\/$/, '')}/api/tryon`
    console.log(`Forwarding to Python server: ${endpoint}`)
    const r = await fetch(endpoint, {
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

const distPath = path.join(__dirname, 'dist')
if (fs.existsSync(distPath)) {
  const indexPath = path.join(distPath, 'index.html')
  const indexHtml = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : null
  app.use(express.static(distPath))
  if (indexHtml) app.get('*', (_, res) => res.type('html').send(indexHtml))
}

app.listen(port, () => console.log(`✅ Node server running on http://localhost:${port}`))
