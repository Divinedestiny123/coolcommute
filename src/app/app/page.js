'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Navigation, MapPin, Loader2 } from 'lucide-react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

// Use public token from environment variables
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function AppRoute() {
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/dark-v11');
  
  const [viewState, setViewState] = useState({
    longitude: -118.2437, // Los Angeles, CA
    latitude: 34.0522,
    zoom: 12
  });

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeCalculated, setRouteCalculated] = useState(false);
  const [routes, setRoutes] = useState(null);
  const [heatData, setHeatData] = useState(null);

  let searchTimeout;
  
  const fetchSuggestions = async (query, isOrigin) => {
    if (query.length < 3) {
      if (isOrigin) { setOriginSuggestions([]); setShowOriginDropdown(false); }
      else { setDestSuggestions([]); setShowDestDropdown(false); }
      return;
    }
    
    try {
      // California Bounding Box: [minX, minY, maxX, maxY]
      const CALIFORNIA_BBOX = '-124.4,32.5,-114.1,42.0';
      
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&bbox=${CALIFORNIA_BBOX}`);
      const data = await res.json();
      
      if (isOrigin) {
        setOriginSuggestions(data.features || []);
        setShowOriginDropdown(true);
      } else {
        setDestSuggestions(data.features || []);
        setShowDestDropdown(true);
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    }
  };

  const handleOriginChange = (e) => {
    const val = e.target.value;
    setOrigin(val);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => fetchSuggestions(val, true), 300);
  };

  const handleDestChange = (e) => {
    const val = e.target.value;
    setDestination(val);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => fetchSuggestions(val, false), 300);
  };

  const calculateHeatScore = (route, heatZones) => {
    let penalty = 0;
    route.geometry.coordinates.forEach(coord => {
      const [lng, lat] = coord;
      heatZones.forEach(zone => {
        const dist = Math.sqrt(Math.pow(zone.lng - lng, 2) + Math.pow(zone.lat - lat, 2));
        if (dist < 0.005) {
           if (zone.risk === 'extreme') penalty += 10;
           else if (zone.risk === 'high') penalty += 5;
           else if (zone.risk === 'moderate') penalty += 1;
        }
      });
    });
    return penalty;
  };

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    if (!origin || !destination) return;
    
    setIsCalculating(true);
    setRouteCalculated(false);
    
    try {
      // California Bounding Box
      const CALIFORNIA_BBOX = '-124.4,32.5,-114.1,42.0';

      // 1. Geocode Origin and Destination (Restricted to California zone)
      const originUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(origin)}.json?access_token=${MAPBOX_TOKEN}&bbox=${CALIFORNIA_BBOX}`;
      const destUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination)}.json?access_token=${MAPBOX_TOKEN}&bbox=${CALIFORNIA_BBOX}`;
      
      console.log('Fetching Origin URL:', originUrl);
      console.log('Fetching Dest URL:', destUrl);

      let originRes, destRes;
      try {
        originRes = await fetch(originUrl);
        destRes = await fetch(destUrl);
      } catch (fetchErr) {
        console.error("Fetch Network Error:", fetchErr);
        alert(`Network Error when contacting Mapbox. URL: ${originUrl}\nCheck your ad-blocker or internet connection.`);
        setIsCalculating(false);
        return;
      }

      if (!originRes.ok || !destRes.ok) {
        alert("Mapbox Geocoding API returned an error status.");
        setIsCalculating(false);
        return;
      }

      const originData = await originRes.json();
      const destData = await destRes.json();

      if (!originData.features.length || !destData.features.length) {
        alert("Could not find locations");
        setIsCalculating(false);
        return;
      }

      const oCoords = originData.features[0].center; // [lng, lat]
      const dCoords = destData.features[0].center;

      // 2. Fetch Heat Data based on Origin
      const polygon = {
        type: 'Polygon',
        coordinates: [[
          [oCoords[0] - 0.02, oCoords[1] - 0.02],
          [dCoords[0] + 0.02, oCoords[1] - 0.02],
          [dCoords[0] + 0.02, dCoords[1] + 0.02],
          [oCoords[0] - 0.02, dCoords[1] + 0.02],
          [oCoords[0] - 0.02, oCoords[1] - 0.02]
        ]]
      };

      const fgRes = await fetch('/api/fortyguard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: origin, polygon })
      });
      const fgData = await fgRes.json();
      setHeatData(fgData);

      // 3. Fetch Mapbox Directions
      const dirRes = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${oCoords[0]},${oCoords[1]};${dCoords[0]},${dCoords[1]}?alternatives=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`);
      const dirData = await dirRes.json();
      
      if (dirData.routes && dirData.routes.length > 0) {
        // Calculate scores
        let bestRoute = null;
        let lowestPenalty = Infinity;
        let fastestRoute = dirData.routes[0]; // Mapbox sorts by fastest by default

        dirData.routes.forEach((rt, idx) => {
          const penalty = calculateHeatScore(rt, fgData.heat_zones || []);
          rt.heatScore = penalty;
          rt.isFastest = (idx === 0);
          
          if (penalty < lowestPenalty) {
            lowestPenalty = penalty;
            bestRoute = rt;
          }
        });

        bestRoute.isCoolest = true;

        setRoutes(dirData.routes);
        
        // Update view to fit route
        setViewState({
          longitude: (oCoords[0] + dCoords[0]) / 2,
          latitude: (oCoords[1] + dCoords[1]) / 2,
          zoom: 11
        });
        
        setRouteCalculated(true);

        // Notify dashboard stats
        fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'increment_routes' })
        }).catch(console.error);
      }
    } catch (error) {
      console.error("Routing error", error);
    }

    setIsCalculating(false);
  };

  const getHeatColor = (temp) => {
    if (temp > 110) return 'rgba(244, 63, 94, 0.6)'; // Extreme (Red)
    if (temp > 100) return 'rgba(245, 158, 11, 0.6)'; // High (Orange)
    return 'rgba(59, 130, 246, 0.6)'; // Moderate (Blue)
  };

  return (
    <div className="app-layout">
      
      {/* Sidebar UI */}
      <div className="app-sidebar">
        
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <h2 className="heading-2" style={{ fontSize: '1.5rem' }}>Plan Route</h2>
        </div>

        {/* Form */}
        <div style={{ padding: '1.5rem' }}>
          
          <button 
            type="button" 
            onClick={() => {
              setOrigin('Santa Monica Pier, California');
              setDestination('Crypto.com Arena, Los Angeles');
            }}
            style={{ width: '100%', marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', border: '1px dashed var(--accent-primary)', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            ✨ Try Demo Route (Los Angeles)
          </button>

          <form onSubmit={handleRouteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <Navigation size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Starting Point (e.g. Times Square)"
                value={origin}
                onChange={handleOriginChange}
                onFocus={() => originSuggestions.length > 0 && setShowOriginDropdown(true)}
                onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)', color: 'white', outline: 'none', fontFamily: 'inherit' }}
              />
              {showOriginDropdown && originSuggestions.length > 0 && (
                <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)', listStyle: 'none', padding: 0, margin: '4px 0 0 0', overflow: 'hidden', boxShadow: 'var(--glass-shadow)' }}>
                  {originSuggestions.map(sug => (
                    <li 
                      key={sug.id} 
                      style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)', fontSize: '0.875rem', color: 'var(--text-primary)' }}
                      onMouseDown={() => { setOrigin(sug.place_name); setShowOriginDropdown(false); }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {sug.place_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-secondary)' }}>
                <MapPin size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Destination (e.g. Central Park)"
                value={destination}
                onChange={handleDestChange}
                onFocus={() => destSuggestions.length > 0 && setShowDestDropdown(true)}
                onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)', color: 'white', outline: 'none', fontFamily: 'inherit' }}
              />
              {showDestDropdown && destSuggestions.length > 0 && (
                <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)', listStyle: 'none', padding: 0, margin: '4px 0 0 0', overflow: 'hidden', boxShadow: 'var(--glass-shadow)' }}>
                  {destSuggestions.map(sug => (
                    <li 
                      key={sug.id} 
                      style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)', fontSize: '0.875rem', color: 'var(--text-primary)' }}
                      onMouseDown={() => { setDestination(sug.place_name); setShowDestDropdown(false); }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {sug.place_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={isCalculating}>
              {isCalculating ? <><Loader2 size={18} className="animate-spin" /> Calculating...</> : 'Find Coolest Route'}
            </button>
          </form>
        </div>

        {/* Results Area */}
        <div className="results-area" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-primary)' }}>
          {routeCalculated && routes && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {routes.map((rt, idx) => {
                const isBest = rt.isCoolest;
                const minutes = Math.round(rt.duration / 60);
                const score = rt.heatScore;
                
                return (
                  <div key={idx} className="glass-card" style={{ padding: '1rem', border: isBest ? '1px solid var(--accent-primary)' : 'none', position: 'relative', overflow: 'hidden', opacity: isBest ? 1 : 0.7 }}>
                    {isBest && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: 'var(--accent-primary)' }}></div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.25rem' }}>{isBest ? 'Coolest Route' : (rt.isFastest ? 'Fastest Route' : 'Alternative')}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Via {rt.legs?.[0]?.summary || 'Alternative Path'}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{minutes} min</div>
                        <div style={{ color: isBest ? 'var(--accent-success)' : 'var(--accent-secondary)', fontSize: '0.875rem' }}>Heat Penalty: {score}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {!routeCalculated && !isCalculating && (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
              <MapPin size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>Type any location, or use the Demo button above!</p>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="app-map-container">
        
        {/* Map Style Toggle */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)', overflow: 'hidden', boxShadow: 'var(--glass-shadow)' }}>
          <button 
            type="button" 
            onClick={() => setMapStyle('mapbox://styles/mapbox/dark-v11')}
            style={{ padding: '0.5rem 1.5rem', background: mapStyle.includes('dark') ? 'rgba(255,255,255,0.1)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
          >
            Dark Map
          </button>
          <div style={{ width: '1px', backgroundColor: 'var(--glass-border)' }}></div>
          <button 
            type="button" 
            onClick={() => setMapStyle('mapbox://styles/mapbox/satellite-streets-v12')}
            style={{ padding: '0.5rem 1.5rem', background: mapStyle.includes('satellite') ? 'rgba(255,255,255,0.1)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
          >
            Satellite
          </button>
        </div>

        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle={mapStyle}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          transformRequest={(url, resourceType) => {
            if (resourceType === 'Font' && url.includes(' ')) {
              return { url: url.replace(/ /g, '%20') };
            }
            return { url };
          }}
        >
          {routes && routes.map((rt, idx) => (
            <Source key={`src-${idx}`} id={`route-${idx}`} type="geojson" data={rt.geometry}>
              <Layer
                id={`route-layer-${idx}`}
                type="line"
                source={`route-${idx}`}
                layout={{
                  'line-join': 'round',
                  'line-cap': 'round'
                }}
                paint={{
                  'line-color': rt.isCoolest ? '#3b82f6' : (rt.isFastest ? '#f43f5e' : '#9ca3af'),
                  'line-width': rt.isCoolest ? 8 : 4,
                  'line-opacity': rt.isCoolest ? 1 : 0.5
                }}
              />
            </Source>
          ))}

          {heatData && heatData.heat_zones && heatData.heat_zones.map((zone, i) => (
            <Marker key={i} longitude={zone.lng} latitude={zone.lat}>
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: getHeatColor(zone.temp),
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                border: '2px solid rgba(255,255,255,0.2)'
              }}>
                {zone.temp}°
              </div>
            </Marker>
          ))}
        </Map>
      </div>
      
    </div>
  );
}
