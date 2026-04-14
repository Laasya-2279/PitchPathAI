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

  // Subscribe to real-time updates
  useEffect(() => {
    const cleanup = on('crowd:update', (data) => {
      setCrowdData(data);
      setLoading(false);
    });

    return cleanup;
  }, [on]);

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
