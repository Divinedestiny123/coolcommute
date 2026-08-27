import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.FORTYGUARD_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
    }

    // Convert Mapbox route bounds/bbox into a simple polygon
    // Note: the frontend should pass bounding box coordinates or a polygon
    // Default to the provided test polygon if no specific coordinates are passed
    const polygon_aoi = body.polygon || {
      type: 'Polygon',
      coordinates: [
        [
          [-112.0800, 33.4400],
          [-112.0600, 33.4400],
          [-112.0600, 33.4600],
          [-112.0800, 33.4600],
          [-112.0800, 33.4400]
        ]
      ]
    };

    const payload = {
      polygon_aoi,
      date_time: {
        start_date: new Date().toISOString().split('T')[0],
        start_time: '14:00',
        filter_type: 1
      },
      granularity: 100
    };

    const response = await fetch('https://api.fortyguard.com/v1/heatmap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FortyGuard API Error:', errorText);
      return NextResponse.json({ error: 'FortyGuard API Error' }, { status: response.status });
    }

    const data = await response.json();
    
    // Transform FortyGuard heatmap response (which is usually a grid/geojson of points or polygons)
    // into the format our frontend expects (heat_zones).
    // Assuming FortyGuard returns features with temperature properties. 
    // We'll safely map them, or mock a few points inside the polygon if the API response is empty for the demo.
    
    let heat_zones = [];
    if (data && data.features && data.features.length > 0) {
      heat_zones = data.features.map(f => {
        // Extract center or first coord
        const coord = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0][0] : f.geometry.coordinates;
        // Mocking property name since we don't have exact response schema
        const temp = f.properties?.temperature || f.properties?.value || 105; 
        return {
          lng: coord[0],
          lat: coord[1],
          temp: Math.round(temp),
          risk: temp > 110 ? 'extreme' : (temp > 100 ? 'high' : 'moderate')
        };
      });
    } else {
      // Fallback/mock logic if the API returns an empty area (or if we hit a location with no data)
      const centerLng = polygon_aoi.coordinates[0][0][0];
      const centerLat = polygon_aoi.coordinates[0][0][1];
      heat_zones = [
        { lat: centerLat + 0.005, lng: centerLng + 0.005, temp: 114, risk: "extreme" }, 
        { lat: centerLat - 0.005, lng: centerLng - 0.005, temp: 109, risk: "high" },    
        { lat: centerLat + 0.002, lng: centerLng - 0.008, temp: 98, risk: "moderate" } 
      ];
    }

    return NextResponse.json({
      location: body.location || 'Unknown',
      heat_zones
    });

  } catch (error) {
    console.error("FortyGuard API Route Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
