'use client';

import { threeLevelCategories, type CategoryNode } from '@/data/categories';

interface UseLayoutResult {
  categories: CategoryNode[];
}

// Placeholder layout data source — swap the categories array with the real
// API query once the categories endpoint is implemented.
export function useLayout(): UseLayoutResult {
  return { categories: threeLevelCategories };
}
