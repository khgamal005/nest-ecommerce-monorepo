'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '@/utils/axiosInstance';

interface SiteLogo {
  fileId?: string;
  file_Url?: string;
}

interface SiteConfig {
  logo: SiteLogo | string | null;
  banners: any[];
}

// Fetches the publically exposed site config (admin-uploaded logo/banners).
export function useSiteConfig(): SiteConfig {
  const [config, setConfig] = useState<SiteConfig>({
    logo: null,
    banners: [],
  });

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get('/api/categories/site-config', { requiresAuth: false })
      .then((res) => {
        if (!cancelled) {
          setConfig({
            logo: res?.data?.logo ?? null,
            banners: res?.data?.banners ?? [],
          });
        }
      })
      .catch(() => {
        // ignore; fall back to the default text logo
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}

export function siteLogoUrl(logo: SiteConfig['logo']): string | null {
  if (typeof logo === 'string') return logo || null;
  if (logo && typeof logo.file_Url === 'string' && logo.file_Url.trim()) {
    return logo.file_Url;
  }
  return null;
}