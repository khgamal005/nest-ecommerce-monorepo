'use client';

import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { formatEGP } from '../../../utils/formatEGP';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  Store,
  Package,
  Star,
  Layers,
  Filter,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import axiosInstance from '../../../utils/axiosInstance';
import { useRouter } from 'next/navigation';

interface ProductVariant {
  id: string;
  price: number;
  salePrice?: number;
  stock: number;
}

type Product = {
  id: string;
  title: string;
  slug: string;
  sale_price: number;
  regular_price: number;
  stock: number;
  rating: number;
  category: string;
  createdAt: string;
  starting_date: string | null;
  ending_date: string | null;
  images: { url: string }[];
  hasVariants?: boolean;
  variants?: ProductVariant[];
  shop: {
    id: string;
    name: string;
  };
};

const EventsPage = () => {
  const userUILink = process.env.NEXT_PUBLIC_USER_UI_LINK || 'http://localhost:3000';
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const router = useRouter();

  const fetchProducts = async (): Promise<Product[]> => {
    const res = await axiosInstance.get('/admin/api/events', {
      params: {
        limit: 100,
      },
    });
    return res.data.products;
  };

  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin-events'],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ['All', ...Array.from(cats)];
  }, [products]);

  const filteredData = useMemo(() => {
    let data = products;
    if (categoryFilter !== 'All') {
      data = data.filter((p) => p.category === categoryFilter);
    }
    return data;
  }, [products, categoryFilter]);

  const columnHelper = createColumnHelper<Product>();

  const columns = useMemo(
    () => [
      // 1. Image
      columnHelper.accessor('images', {
        header: 'Image',
        cell: ({ row }) => (
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shadow-sm shrink-0">
            {row.original.images?.[0] ? (
              <img
                src={row.original.images[0].url}
                alt={row.original.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <Package className="h-full w-full p-2 text-gray-300" />
            )}
          </div>
        ),
      }),
      // 2. Title
      columnHelper.accessor('title', {
        header: 'Title',
        cell: ({ row }) => (
          <div className="flex flex-col min-w-[150px] max-w-[200px]">
            <span className="font-semibold text-gray-900 truncate">
              {row.original.title}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              #{row.original.id.slice(-6).toUpperCase()}
            </span>
          </div>
        ),
      }),
      // 3. Price
      columnHelper.accessor('sale_price', {
        header: 'Price',
        cell: ({ row }) => {
          const { hasVariants, variants, sale_price, regular_price } = row.original;
          
          // Get price from first variant if has variants
          let displayPrice = sale_price;
          let regularPrice = regular_price;
          let hasSale = false;
          const hasProductVariants = hasVariants || (variants && variants.length > 0);
          
          if (hasProductVariants && variants && variants.length > 0) {
            const firstVariant = variants[0];
            displayPrice = firstVariant.salePrice || firstVariant.price;
            regularPrice = firstVariant.price;
            hasSale = !!(firstVariant.salePrice && firstVariant.salePrice < firstVariant.price);
          } else {
            hasSale = sale_price > 0 && sale_price < regular_price;
          }
          
          return (
            <div className="flex flex-col">
              <span className="text-green-600 font-semibold">
                {formatEGP(displayPrice || 0)}
              </span>
              {hasSale && (
                <span className="text-xs text-gray-400 line-through">
                  {formatEGP(regularPrice || 0)}
                </span>
              )}
            </div>
          );
        },
      }),
      // 4. Stock
      columnHelper.accessor('stock', {
        header: 'Stock',
        cell: ({ row }) => {
          const { hasVariants, variants, stock } = row.original;
          
          // Calculate total stock from all variants if has variants
          let displayStock = stock || 0;
          const hasProductVariants = hasVariants || (variants && variants.length > 0);
          
          if (hasProductVariants && Array.isArray(variants) && variants.length > 0) {
            displayStock = variants.reduce((total, variant) => total + (variant?.stock || 0), 0);
          }
          
          return (
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  displayStock > 10
                    ? 'bg-green-100 text-green-700'
                    : displayStock > 0
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {displayStock > 0 ? `${displayStock} units` : 'Out of stock'}
              </span>
              {hasProductVariants && Array.isArray(variants) && variants.length > 0 && (
                <span className="text-xs text-gray-500">
                  ({variants.length} {variants.length > 1 ? 'variants' : 'variant'})
                </span>
              )}
            </div>
          );
        },
      }),
      // 5. Category
      columnHelper.accessor('category', {
        header: 'Category',
        cell: ({ row }) => (
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-tight">
            {row.original.category}
          </span>
        ),
      }),
      // 6. Rating
      columnHelper.accessor('rating', {
        header: 'Rating',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-semibold text-gray-700">
              {row.original.rating?.toFixed(1) || '0.0'}
            </span>
          </div>
        ),
      }),
      // 7. Shop
      columnHelper.accessor('shop.name', {
        header: 'Shop',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 max-w-[120px]">
            <Store className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-700 truncate font-medium">
              {row.original.shop?.name || 'N/A'}
            </span>
          </div>
        ),
      }),
      // 7. Starting Date
      columnHelper.accessor('starting_date', {
        header: 'Start Date',
        cell: ({ row }) => (
          <div className="flex flex-col text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-green-500" />
              {row.original.starting_date
                ? format(new Date(row.original.starting_date), 'MMM dd, yyyy')
                : 'Not set'}
            </span>
          </div>
        ),
      }),
      // 8. Ending Date
      columnHelper.accessor('ending_date', {
        header: 'End Date',
        cell: ({ row }) => (
          <div className="flex flex-col text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-red-500" />
              {row.original.ending_date
                ? format(new Date(row.original.ending_date), 'MMM dd, yyyy')
                : 'Not set'}
            </span>
          </div>
        ),
      }),
      // 9. View
      columnHelper.display({
        id: 'actions',
        header: 'View',
        cell: ({ row }) => (
          <button
            onClick={() =>
              window.open(`${userUILink}/product/${row.original.slug}`, '_blank')
            }
            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-100"
            title="View Product"
          >
            <Eye className="h-4 w-4" />
          </button>
        ),
      }),
    ],
    [router]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Events Database
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Browse and manage event products across all merchant shops
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search events..."
              className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-64 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm transition-all focus-within:border-blue-300">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm text-gray-700 outline-none bg-transparent cursor-pointer font-medium"
            >
              {categories.map((cat, index) => (
                <option key={`${cat}-${index}`} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-widest">
              Database Size
            </p>
            <p className="text-xl font-bold text-gray-900">{products.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-widest">
              Total SPU
            </p>
            <p className="text-xl font-bold text-gray-900">
              {categories.length - 1}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-widest">
              Recent Skus
            </p>
            <p className="text-xl font-bold text-gray-900">
              {
                products.filter(
                  (p) =>
                    new Date(p.createdAt) >
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length
              }
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-blue-500">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 md:px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors whitespace-nowrap"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: ' ↑',
                          desc: ' ↓',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-50">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-blue-50/30 transition-colors group relative"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 md:px-6 py-4 text-xs md:text-sm"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-24 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-5 bg-gray-50 rounded-full">
                        <Package className="h-10 w-10 text-gray-200" />
                      </div>
                      <p className="font-semibold text-gray-700">
                        No events found
                      </p>
                      <p className="text-xs text-gray-400">
                        No event records match your current parameters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-5 bg-gray-50/40 border-t border-gray-100">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
            Scan result:{' '}
            <span className="text-gray-900">
              {table.getRowModel().rows.length}
            </span>{' '}
            / <span className="text-gray-900">{filteredData.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 disabled:opacity-20 transition-all text-gray-500"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="hidden sm:flex items-center gap-1.5">
              {[...Array(table.getPageCount())]
                .map((_, i) => (
                  <button
                    key={i}
                    onClick={() => table.setPageIndex(i)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                      table.getState().pagination.pageIndex === i
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105'
                        : 'hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))
                .slice(0, 5)}
              {table.getPageCount() > 5 && (
                <span className="px-2 text-gray-300 font-bold">...</span>
              )}
            </div>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 disabled:opacity-20 transition-all text-gray-500"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
