export interface ShopSeller {
  storeName?: string;
}

export interface Shop {
  name?: string;
  seller?: ShopSeller;
}

export function useShop() {
  return { shop: null, isLoading: false };
}
