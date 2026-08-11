import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../utils/axiosInstance';

interface RichBanner {
  fileId: string;
  file_Url: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  textPosition: 'left' | 'center' | 'right';
  textColor: string;
  overlayOpacity: number;
  order: number;
  isActive: boolean;
}

interface Logo {
  fileId: string;
  file_Url: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  level: number;
  parentId: string | null;
  children?: Category[];
}

interface SiteConfig {
  banners: RichBanner[];
  logo: Logo | string;
  categories: Category[];
}

const fetchConfig = async () => {
  try {
    const response = await axiosInstance.get('/api/categories/site-config', {
      requiresAuth: false,
    });
    const banners = Array.isArray(response.data.banners)
      ? response.data.banners
      : [];
    return {
      banners,
      logo: response.data.logo || null,
    };
  } catch (error) {
    console.error('Error fetching config:', error);
    return {
      banners: [],
      logo: null,
    };
  }
};

const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await axiosInstance.get('/api/categories/all', {
      requiresAuth: false,
    });
    return response.data.categories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

const flattenCategories = (categories: Category[]): Category[] => {
  const flat: Category[] = [];
  const visit = (items: Category[]) => {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      flat.push(item);
      if (item.children && item.children.length > 0) {
        visit(item.children);
      }
    });
  };
  visit(categories);
  return flat;
};

const useLayout = () => {
  const {
    data: config,
    isLoading: isConfigLoading,
    isError: isConfigError,
    error: configError,
    refetch: refetchConfig,
  } = useQuery({
    queryKey: ['config'],
    queryFn: fetchConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const hierarchicalCategories = useMemo(
    () =>
      (categories || []).filter(
        (category) => category.parentId === null || category.level === 1
      ),
    [categories]
  );

  const allCategories = useMemo(
    () => flattenCategories(hierarchicalCategories),
    [hierarchicalCategories]
  );

  return {
    config,
    banners: config?.banners || [],
    logo: config?.logo || null,
    categories: hierarchicalCategories,
    allCategories,
    isLoading: isConfigLoading || isCategoriesLoading,
    isError: isConfigError || isCategoriesError,
    error: configError || categoriesError,
    refetch: () => {
      refetchConfig();
      refetchCategories();
    },
  };
};

export default useLayout;
