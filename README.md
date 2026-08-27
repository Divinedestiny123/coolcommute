# 🌡️ CoolRoute: Urban Heat Island Navigation

**Winner / Submission for the FortyGuard Hackathon**

CoolRoute is an intelligent navigation application designed to combat Urban Heat Islands (UHI). While traditional GPS apps route you based on the *fastest* path, CoolRoute leverages **FortyGuard's advanced temperature API** and **Mapbox Directions** to calculate the *coolest* path, protecting pedestrians, cyclists, and outdoor workers from extreme thermal exposure.

## 🚀 The Problem
Urban Heat Islands cause cities to be significantly hotter than surrounding rural areas due to concrete and lack of greenery. During heatwaves, walking or biking through specific "micro-climate hotspots" can be dangerous. Standard navigation apps do not take environmental temperature into account.

## 💡 Our Solution
CoolRoute dynamically analyzes your route against live temperature data. If your fastest route intersects with a high-risk thermal zone (e.g., a massive sun-baked parking lot or an unshaded industrial district), CoolRoute will automatically generate an alternative path that avoids the worst of the heat—trading a few extra minutes of travel time for a significantly safer thermal experience.

## ✨ Features
- **Thermal-Aware Routing**: Calculates a "Heat Penalty" for every route option based on intersection with heat zones.
- **FortyGuard API Integration**: Pulls live temperature micro-climate data for your city (Demo locked to Los Angeles, CA).
- **Fallback Engine**: Automatically falls back to live Open-Meteo data to simulate hotspots if FortyGuard data is sparse.
- **Smart Autocomplete**: Mapbox geocoding bounded specifically to the target region.
- **Premium Glassmorphism UI**: Stunning, responsive dark-mode dashboard with live statistics.
- **Interactive Maps**: Toggle between Dark Mode and high-res Satellite imagery.

## 🛠️ Tech Stack
- **Frontend**: Next.js 14, React, Mapbox GL JS, CSS Modules (Glassmorphism)
- **Backend**: Next.js App Router API Routes
- **Database**: SQLite (better-sqlite3) for storing route statistics and synced heat zones
- **APIs**: 
  - FortyGuard API (Micro-climate temperature data)
  - Mapbox Directions API (Routing and geometry)
  - Mapbox Geocoding API (Autocomplete)
  - Open-Meteo API (Live weather fallback)

## 🚦 Getting Started

### Prerequisites
You will need API keys from Mapbox and FortyGuard.

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
   FORTYGUARD_API_KEY=your_fortyguard_key_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) and click **"Go to Dashboard"** to sync your initial heat data!

---
*Built with ❤️ for the FortyGuard Hackathon.*
