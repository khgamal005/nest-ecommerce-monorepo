'use client';

import { useEffect, useState } from "react";

interface LocationInfo {
  ip: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
}

const LOCATION_STORAGE_KEY = "user_location";
const LOCATION_EXPIRY_DAYS = 20;

// Load cached location if valid
const getLocationFromStorage = () => {
  const location = localStorage.getItem(LOCATION_STORAGE_KEY);
  const parsed = location ? JSON.parse(location) : null;

  const expiryTime = LOCATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const isExpired = Date.now() - (parsed?.timestamp || 0) > expiryTime;

  return isExpired ? null : parsed;
};

const useLocationTracking = (): LocationInfo => {
  const [data, setData] = useState<LocationInfo>({
    ip: null,
    city: null,
    country: null,
    latitude: null,
    longitude: null,
    loading: true,
  });

  // Fetch new location
  const fetchLocation = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const json = await res.json();

      const newLocation = {
        ip: json.ip || null,
        city: json.city || null,
        country: json.country_name || null,
        latitude: json.latitude || null,
        longitude: json.longitude || null,
        loading: false,
      };

      setData(newLocation);

      // Save to storage
      localStorage.setItem(
        LOCATION_STORAGE_KEY,
        JSON.stringify({ ...newLocation, timestamp: Date.now() })
      );

    } catch (error) {
      console.error("Location Error:", error);
      setData((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    // Try using cached location
    const cached = getLocationFromStorage();
    if (cached) {
      setData({
        ip: cached.ip,
        city: cached.city,
        country: cached.country,
        latitude: cached.latitude,
        longitude: cached.longitude,
        loading: false,
      });
      return; // stop, no need to call API
    }

    // No cache → fetch
    fetchLocation();
  }, []);

  return data;
};

export default useLocationTracking;
