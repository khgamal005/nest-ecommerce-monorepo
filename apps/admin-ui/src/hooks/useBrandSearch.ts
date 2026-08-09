// hooks/useBrandSearch.ts
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../utils/axiosInstance';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  verified: boolean;
}

export const useBrandSearch = () => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Brand | null>(null);
  const [freeText, setFreeText] = useState('');
  const [mode, setMode] = useState<'search' | 'free'>('search');
  const [open, setOpen] = useState(false);

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () =>
      axiosInstance
        .get('/api/brands?verified=true')
        .then(r => r.data.brands as Brand[]),
    staleTime: 1000 * 60 * 5, // cache 5 min — list rarely changes
  });

  const filtered = brands.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectBrand = (brand: Brand) => {
    setSelected(brand);
    setFreeText('');
    setMode('search');
    setOpen(false);
    setSearch('');
  };

  const switchToFree = () => {
    setSelected(null);
    setMode('free');
    setOpen(false);
    setSearch('');
  };

  const clear = () => {
    setSelected(null);
    setFreeText('');
    setMode('search');
    setSearch('');
  };

  // Payload shape ready to spread into form submit
  const brandPayload = selected
    ? { brandId: selected.id, brandName: undefined }
    : freeText.trim()
    ? { brandId: undefined, brandName: freeText.trim() }
    : { brandId: undefined, brandName: undefined };

  return {
    search, setSearch,
    selected, freeText, setFreeText,
    mode, open, setOpen,
    filtered,
    selectBrand, switchToFree, clear,
    brandPayload,
  };
};
