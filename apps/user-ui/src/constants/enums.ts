// Single-vendor storefront route constants.
// Matches the shop navigation in the shared header.
export const Routes = {
  Home: '/',
  Products: '/products',
  Brands: '/brands',
  Offers: '/offers',
  Orders: '/profile/orders',
} as const;

export const RoutesExternal = {
  // Multi-vendor links are intentionally removed for this single-vendor app.
  BecomeSeller: '/become-seller',
} as const;