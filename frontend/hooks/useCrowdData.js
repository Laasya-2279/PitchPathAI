'use client';

import { useState, useEffect, useCallback } from 'react';
import useSocket from './useSocket';
import { getCrowdData } from '@/services/api';

/**
 * Hook for real-time crowd data management.
 * Fetches initial data via REST, then subscribes to Socket.io updates.
 */
export default function useCrowdData() {
  const [crowdData, setCrowdData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { on, isConnected } = useSocket();

  // Initial fetch
  useEffect(() => {
    async function fetchInitial() {
      try {
        const data = await getCrowdData();
        setCrowdData(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch crowd data:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    fetchInitial();
  }, []);

  // Firebase Realtime Database Sync
  useEffect(() => {
    const { ref, onValue } = require('firebase/database');
    const { db } = require('@/lib/firebase');

    const crowdRef = ref(db, 'crowds');
    const simRef = ref(db, 'simulation');

    // Subscribe to crowd data
    const unsubscribeCrowd = onValue(crowdRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCrowdData(prev => {
          const densityMap = data; // simplified map
          const zones = prev?.zones?.map(zone => ({
            ...zone,
            density: data[zone.id]?.density ?? zone.density,
            queueTime: data[zone.id]?.queueTime ?? zone.queueTime,
            status: data[zone.id]?.status ?? zone.status,
          })) || [];

          return {
            ...prev,
            densityMap: Object.keys(data).reduce((acc, key) => {
              acc[key] = data[key].density;
              return acc;
            }, {}),
            queueMap: Object.keys(data).reduce((acc, key) => {
              acc[key] = data[key].queueTime;
              return acc;
            }, {}),
            zones,
            timestamp: Date.now()
          };
        });
      }
    });

    // Subscribe to simulation metadata
    const unsubscribeSim = onValue(simRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCrowdData(prev => ({
          ...prev,
          mode: data.mode,
          tick: data.tick,
          summary: {
            ...prev?.summary,
            mode: data.mode
          }
        }));
      }
    });

    return () => {
      unsubscribeCrowd();
      unsubscribeSim();
    };
  }, []);

  /**
   * Get density for a specific zone
   */
  const getZoneDensity = useCallback((zoneId) => {
    if (!crowdData?.densityMap) return 0;
    return crowdData.densityMap[zoneId] || 0;
  }, [crowdData]);

  /**
   * Get zone info
   */
  const getZone = useCallback((zoneId) => {
    if (!crowdData?.zones) return null;
    return crowdData.zones.find(z => z.id === zoneId);
  }, [crowdData]);

  /**
   * Get density status label
   */
  const getDensityStatus = useCallback((density) => {
    if (density < 0.3) return 'low';
    if (density < 0.5) return 'moderate';
    if (density < 0.7) return 'high';
    return 'very_high';
  }, []);

  /**
   * Get color for density level
   */
  const getDensityColor = useCallback((density) => {
    if (density < 0.3) return '#10b981';
    if (density < 0.5) return '#f59e0b';
    if (density < 0.7) return '#f97316';
    return '#ef4444';
  }, []);

  return {
    crowdData,
    loading,
    error,
    isConnected,
    getZoneDensity,
    getZone,
    getDensityStatus,
    getDensityColor,
  };
}
