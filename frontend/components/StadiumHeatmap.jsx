'use client';

import { useState, useEffect, useRef } from 'react';
import useCrowdData from '@/hooks/useCrowdData';

/**
 * Full interactive stadium heatmap with Google Maps integration.
 * Narendra Modi Stadium (Ahmedabad) layout mapped to real coordinates.
 */
export default function StadiumHeatmap() {
  const { crowdData, loading, getDensityColor, getDensityStatus, isConnected } = useCrowdData();
  const [selectedZone, setSelectedZone] = useState(null);
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef([]);

  // Narendra Modi Stadium Anchor
  const STADIUM_CENTER = { lat: 23.0919, lng: 72.5975 };

  // Map 100x100 grid to Lat/Lng offsets
  // This is a rough estimation for the stadium oval
  const mapGridToLatLng = (pos) => {
    const latScale = 0.002; // degrees per 100 units
    const lngScale = 0.0025;
    return {
      lat: STADIUM_CENTER.lat + (pos.y - 50) * (latScale / 100),
      lng: STADIUM_CENTER.lng + (pos.x - 50) * (lngScale / 100)
    };
  };

  useEffect(() => {
    // Dynamically load Google Maps script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=initMap`;
      script.async = true;
      script.defer = true;
      window.initMap = () => setMap(true); // Signal script loaded
      document.head.appendChild(script);
    } else {
      setMap(true);
    }
  }, []);

  useEffect(() => {
    if (map === true && mapRef.current) {
      const gMap = new window.google.maps.Map(mapRef.current, {
        center: STADIUM_CENTER,
        zoom: 18,
        mapTypeId: 'satellite',
        disableDefaultUI: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
        ]
      });
      setMap(gMap);
    }
  }, [map === true]);

  // Update Markers when crowdData changes
  useEffect(() => {
    if (!map || map === true || !crowdData) return;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const zones = crowdData.zones || [];
    
    zones.forEach(zone => {
      const pos = mapGridToLatLng(zone.position);
      const color = getDensityColor(zone.density);
      
      const marker = new window.google.maps.Marker({
        position: pos,
        map,
        title: zone.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 0.7,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
          scale: zone.type === 'gate' ? 10 : 8
        }
      });

      marker.addListener('click', () => {
        setSelectedZone(zone);
        map.panTo(pos);
      });

      markersRef.current.push(marker);
    });

  }, [map, crowdData, getDensityColor]);

  if (loading || !crowdData) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: 'var(--muted)' }}>Loading stadium data...</span>
        </div>
      </div>
    );
  }

  const summary = crowdData.summary || {};

  const facilityIcons = {
    washroom: '🚻',
    food: '🍔',
    medical: '🏥',
    vip: '⭐',
    gate: '🚪',
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Google Map Display */}
      <div className="flex-1">
        <div className="relative mx-auto rounded-3xl overflow-hidden border border-[var(--border)]" style={{ width: '100%', height: 500, background: 'var(--surface)' }}>
          <div ref={mapRef} className="w-full h-full" id="google-map" role="img" aria-label="Interactive Stadium Heatmap on Google Maps" />
          
          {/* Legend Overlay */}
          <div className="absolute bottom-4 left-4 p-3 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 pointer-events-none">
             <div className="flex flex-col gap-1.5">
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#10b981]" /> <span className="text-[10px] text-white/80">Low</span></div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#f59e0b]" /> <span className="text-[10px] text-white/80">Moderate</span></div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ef4444]" /> <span className="text-[10px] text-white/80">High</span></div>
             </div>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="lg:w-80 flex flex-col gap-4">
        {/* Summary Stats */}
        <div className="glass-card p-4" role="region" aria-label="Stadium Summary">
          <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--foreground)' }}>Stadium Overview</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl" style={{ background: 'var(--surface)' }}>
              <div className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{Math.round((summary.averageDensity || 0) * 100)}%</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Average Load</div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'var(--surface)' }}>
              <div className="text-xl font-bold" style={{ color: summary.hotspotCount > 3 ? '#ef4444' : '#f59e0b' }}>{summary.hotspotCount || 0}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Active Hotspots</div>
            </div>
          </div>
        </div>

        {/* Selected Zone Detail */}
        {selectedZone ? (
          <div className="glass-card p-4 slide-up" role="region" aria-label="Zone Details">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{selectedZone.name}</h3>
              <button 
                onClick={() => setSelectedZone(null)} 
                className="text-xs px-2 py-1 rounded-lg" 
                style={{ background: 'var(--surface)', color: 'var(--muted)' }}
                aria-label="Close details"
              >✕</button>
            </div>

            <div className="space-y-3">
              {/* Density Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--muted)' }}>Crowd Density</span>
                  <span className="font-semibold" style={{ color: getDensityColor(selectedZone.density) }}>
                    {Math.round(selectedZone.density * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }} role="progressbar" aria-valuenow={Math.round(selectedZone.density * 100)} aria-valuemin="0" aria-valuemax="100">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${selectedZone.density * 100}%`,
                      background: getDensityColor(selectedZone.density),
                    }}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: getDensityColor(selectedZone.density) }} />
                <span className="text-sm font-medium capitalize" style={{ color: 'var(--foreground)' }}>
                  {getDensityStatus(selectedZone.density).replace('_', ' ')}
                </span>
              </div>

              {/* Queue time */}
              {selectedZone.queueTime && (
                <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--surface)' }}>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>Est. Queue Time</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{selectedZone.queueTime} min</span>
                </div>
              )}

              {/* Zone type */}
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                <span>{facilityIcons[selectedZone.type] || '📍'}</span>
                <span className="capitalize">{selectedZone.type}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-4 text-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Click a marker on the map to see details</p>
          </div>
        )}

        {/* Hotspots List */}
        {summary.hotspots?.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="font-semibold text-sm mb-3" style={{ color: '#ef4444' }}>⚠ Active Hotspots</h3>
            <div className="space-y-2">
              {summary.hotspots.map((h) => (
                <div 
                  key={h.id} 
                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:opacity-80" 
                  style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                  onClick={() => {
                    const zone = crowdData.zones.find(z => z.id === h.id);
                    if (zone) {
                       setSelectedZone(zone);
                       map?.panTo(mapGridToLatLng(zone.position));
                    }
                  }}
                  role="button"
                  aria-label={`View hotspot ${h.name}`}
                >
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>{h.name}</span>
                  <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>{Math.round(h.density * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
