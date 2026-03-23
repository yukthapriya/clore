# Cloré — AI Personal Stylist 

> A mobile-first web app that acts as your personal stylist — AI-powered outfit suggestions, wardrobe management, shopping compatibility checks, and virtual try-on, all running from your local machine.

---

## What It Does

**Home** — Dashboard showing wardrobe stats, a daily "What should I wear today?" prompt, and quick actions to navigate the app.

**Wardrobe** — Digital closet seeded with 12 sample items (tops, bottoms, outerwear, shoes, dresses), each tagged with category, colors, style, and season. Tracks last worn dates and times worn.

**Style Me** — Pick an occasion (Casual, Work, Date Night, Outdoors, Night Out) and a mood (Minimalist, Bold, Classic, Playful, Cozy, Sharp), then get 3 AI-generated outfit combinations built from your actual wardrobe items. Each outfit includes a creative name, vibe description, stylist tip, and color story. Save favourites with the heart button.

**Should I Buy It?** — Describe any clothing item you're considering. Get a 0–100 compatibility score, a verdict (Great Buy / Good Addition / Situational / Already Covered / Style Clash), which wardrobe items it pairs with, how many new outfits it unlocks, what wardrobe gap it fills, and any style cautions.

**Virtual Try-On** — Upload a full-body photo of yourself, then select any garment from your wardrobe or upload a new one. A local Python ML server composites the garment onto your photo using the IDM-VTON diffusion model. Runs entirely on your machine — no paid API needed.

---

## Architecture
```
Browser (React/Vite :5173)
    │
    ├── Groq API (cloud) ← outfit suggestions + shopping analysis
    │
    └── Node.js server (:3001) ← CORS proxy for try-on
            │
            └── Python Flask server (:3002) ← IDM-VTON inference
```

**Why two servers for try-on?** The Node server (`server.js`) handles CORS and acts as a lightweight proxy. The Python server does the actual ML work — IDM-VTON requires PIL and `gradio_client`, which only exist in Python.

**Two Python servers:**
- `vton_server.py` — primary server using `gradio_client` to call `yisol/IDM-VTON` on Hugging Face. Runs 30 denoising steps at seed 42.
- `tryon_server.py` — REST fallback that tries three HF Spaces in sequence (`represents-virtual-try-on`, `fakezeta-i2vton`, `yisol-idm-vton`) via direct HTTP upload and SSE event polling. Falls through to the next space on any failure.

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| Vite | 5.1 | Dev server and bundler |
| React Router | 6.22 | 4-tab client-side routing |
| Tailwind CSS | 4.0 | Utility styling |
| Lucide React | 0.577 | Icons |

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Express | Proxy on :3001, forwards `/api/tryon` to Python :3002 |
| Python + Flask | ML inference server on :3002 |
| flask-cors | Cross-origin support for the Python server |

### AI & ML

| Technology | What It Does |
|---|---|
| **Groq API** (`llama-3.3-70b-versatile`) | Powers outfit generation and shopping analysis. Called directly from the browser — no backend needed. The full wardrobe is serialised to JSON and injected as context on every request so the LLM picks combinations using exact item names. |
| **IDM-VTON** via `gradio_client` | State-of-the-art diffusion-based virtual try-on model hosted at `yisol/IDM-VTON` on Hugging Face. Takes a person image + garment image, runs 30 denoising steps at seed 42, returns the garment composited onto the person. |
| **HF Spaces REST fallback** | `tryon_server.py` uploads images to 3 Gradio Spaces via `/upload`, calls `/call/{endpoint}`, then polls the SSE stream for the result image. Falls through to the next space on failure. |

---

## How the AI Prompts Work

**Outfit generation** — the wardrobe is serialised as a JSON array of `{id, name, category, colors, style, season}` objects and injected directly into the Groq prompt. The model is instructed to return only a raw JSON array of 3 outfit objects with fields: `name`, `items` (exact wardrobe item names), `vibe`, `tip`, `colorStory`. Parsed directly — no post-processing needed.

**Shopping analysis** — the same wardrobe JSON is passed alongside the new item description. The model returns a single JSON object with `score`, `verdict`, `pairsWell`, `whyItWorks`, `gaps`, `caution`, and `outfitCount`. The `pairsWell` array contains exact wardrobe item names, which the frontend fuzzy-matches to look up and display the actual wardrobe photos.

**Virtual try-on image pipeline** — images are converted to base64 in the browser via `FileReader`. The Python server decodes them with PIL, saves to `/tmp/person.jpg` and `/tmp/garment.jpg`, passes the paths to the IDM-VTON Gradio client, then re-encodes the result as a base64 JPEG and returns it to the frontend.

---

## Project Structure
```
clore/
├── src/
│   ├── App.jsx               # Root — routing, global state (wardrobe, saved outfits,
│   │                         # API key), bottom nav, TryOnPage modal overlay
│   │                         # Contains the 12-item seed wardrobe with Unsplash images
│   └── pages/
│       ├── HomePage.jsx      # Time-based greeting, wardrobe stats cards, quick actions,
│       │                     # recent item grid, Groq API key modal (localStorage)
│       ├── OnboardingPage.jsx # 3-step flow: intro → wardrobe preview → API key input
│       ├── OutfitsPage.jsx   # Occasion + mood selectors → Groq → 3 outfit cards
│       │                     # OutfitCard: item photo strip, heart save, stylist tip block
│       ├── ShoppingPage.jsx  # Text description → Groq → score ring, verdict badge,
│       │                     # paired item photos, gap/caution callouts
│       └── TryOnPage.jsx     # Full-screen modal — avatar upload + wardrobe garment grid
│                             # → POST to :3002 → result image, loading message cycling
├── server.js                 # Express proxy :3001 → forwards all try-on POST to :3002
├── vton_server.py            # Primary Python server — gradio_client → yisol/IDM-VTON
├── tryon_server.py           # Fallback Python server — REST polling across 3 HF Spaces
├── local_tryon.py            # Standalone local try-on script (non-server)
├── index.html                # Google Fonts: Playfair Display + DM Sans + DM Mono
├── package.json              # express, cors, react, react-router-dom, lucide-react
├── vite.config.js
├── tailwind.config.js
└── .env                      # VITE_GROQ_KEY — never committed
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Free Groq API key from [console.groq.com](https://console.groq.com)

### 1. Clone and install
```bash
git clone https://github.com/yukthapriya/clore.git
cd clore
npm install
pip install flask flask-cors pillow gradio-client
```

### 2. Add your Groq key
```bash
echo "VITE_GROQ_KEY=gsk_your_key_here" > .env
```

You can also add the key inside the app via the key icon on the Home screen after launch.

### 3. Start all three processes
```bash
# Terminal 1 — React frontend
npm run dev

# Terminal 2 — Node proxy server  
node server.js

# Terminal 3 — Python ML server
python vton_server.py
```

Open `http://localhost:5173`.

Outfit suggestions and shopping analysis work immediately. Virtual try-on requires all three servers running and takes **1–3 minutes** per render depending on Hugging Face queue load.

> **No Groq key?** You can skip it during onboarding. The wardrobe and virtual try-on work fully without it — only the AI features require the key.

---

## Design Decisions

**Groq over OpenAI** — near-instant LLM responses on a generous free tier. The API is called directly from the browser so no AI backend is needed at all.

**Local try-on over a paid API** — IDM-VTON on Hugging Face is completely free. The tradeoff is a 1–3 minute generation time and the requirement to run a Python server locally. The fallback REST server handles cases where the primary Gradio space is overloaded or sleeping.

**Seed wardrobe on first launch** — 12 pre-loaded items with real Unsplash photos mean outfit generation works immediately, with no upload required to see the app's value.

**API key stored locally** — the Groq key lives in `localStorage` only and is never sent to any backend. Onboarding explains this and lets users skip the key entirely.

---

## Roadmap

- [ ] Camera upload → AI auto-tagging (Google Vision / CLIP)
- [ ] Supabase integration — persistent wardrobe, user auth, cloud image storage
- [ ] OpenWeatherMap API for weather-aware daily outfit suggestions
- [ ] Product URL scraping for shopping mode (paste a link, not just a description)
- [ ] Wardrobe analytics — cost-per-wear tracking, wear frequency heatmap
- [ ] Save and share virtual try-on results

---

## Author

**Yuktha Priya** — [github.com/yukthapriya](https://github.com/yukthapriya)

---

*Cloré — dress like the main character.*
