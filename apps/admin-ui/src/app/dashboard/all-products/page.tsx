'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import axiosInstance from '../../../utils/axiosInstance';
import { formatEGP } from '../../../utils/formatEGP';
import Box from '../../../shared/components/Box';

interface ProductImage {
  id: string;
  imageUrl: string;
}

interface Variant {
  id: string;
  price: number;
  salePrice?: number;
  stock: number;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  status: string;
  hasVariants: boolean;
  isDeleted: boolean;
  createdAt: string;
  regular_price: number;
  sale_price: number;
  stock: number;
  images: ProductImage[];
  variants: Variant[];
  brand?: Brand | null;
  category?: Category | null;
}

interface ProductsResponse {
  success: boolean;
  products: Product[];
  pagination: {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
  };
}

const fetchProducts = async (): Promise<Product[]> => {
  const res = await axiosInstance.get('/api/products/admin/all', {
    params: { page: 1, limit: 1000 },
  });
  const data: ProductsResponse = res.data;
  return (data.products ?? []).map((p) => ({
    ...p,
    regular_price: Number(p.regular_price) || 0,
    sale_price: Number(p.sale_price) || 0,
    stock: Number(p.stock) || 0,
  }));
};

const deleteProduct = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/products/${id}`);
};

const AllProductsPage = () => {
  const queryClient = useQueryClient();
  const [globalFilter, setGlobalFilter] = useState('');

  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: fetchProducts,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'all'] });
      toast.success('Product deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete product');
    },
  });

  const handleDelete = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.title}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Product',
        cell: ({ row }: { row: any }) => {
          const product = row.original as Product;
          const imageUrl = product.images?.[0]?.imageUrl;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package size={20} className="text-slate-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="max-w-[280px] truncate text-sm font-medium text-slate-900">
                  {product.title}
                </p>
                <p className="truncate text-xs text-slate-500">
                  #{product.id.slice(-6)} · /{product.slug}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }: { row: any }) => {
          const product = row.original as Product;
          return (
            <div>
              <p className="text-sm text-slate-700">
                {product.category?.name ?? '—'}
              </p>
              <p className="text-xs text-slate-500">
                {product.brand?.name ?? ''}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'regular_price',
        header: 'Price',
        cell: ({ row }: { row: any }) => {
          const product = row.original as Product;
          const hasSale =
            typeof product.sale_price === 'number' && product.sale_price > 0;
          return (
            <div className="text-sm">
              {hasSale && (
                <span className="mr-2 text-xs text-slate-400 line-through">
                  {formatEGP(product.regular_price)}
                </span>
              )}
              <span className="font-medium text-slate-900">
                {formatEGP(hasSale ? product.sale_price : product.regular_price)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'stock',
        header: 'Stock',
        cell: ({ row }: { row: any }) => {
          const product = row.original as Product;
          const stock = product.stock ?? 0;
          return (
            <span
              className={
                stock === 0
                  ? 'text-sm font-medium text-red-600'
                  : 'text-sm font-medium text-slate-700'
              }
            >
              {stock === 0 ? 'Out of stock' : `${stock} in stock`}
            </span>
          );
        },
      },
      {
        accessorKey: 'hasVariants',
        header: 'Type',
        cell: ({ row }: { row: any }) => {
          const product = row.original as Product;
          return product.hasVariants ? (
            <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
              Variants ({product.variants?.length ?? 0})
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              Simple
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }: { row: any }) => {
          const product = row.original as Product;
          return (
            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              {product.status}
            </span>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }: { row: any }) => {
          const product = row.original as Product;
          return (
            <span className="text-sm text-slate-600">
              {new Date(product.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          );
        },
      },
      {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }: { row: any }) => {
          const product = row.original as Product;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/update-product/${product.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Pencil size={14} />
                Edit
              </Link>
              <button
                onClick={() => handleDelete(product)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: products,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const total = products.length;
  const activeCount = products.filter(
    (p) => p.status?.toUpperCase() === 'ACTIVE' && !p.isDeleted
  ).length;
  const outOfStock = products.filter((p) => (p.stock ?? 0) === 0).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            All Products
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage all your store products
          </p>
        </div>
        <Link
          href="/dashboard/create-product"
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          <Plus size={18} />
          Create Product
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Box className="p-5">
          <p className="text-sm text-slate-500">Total Products</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{total}</p>
        </Box>
        <Box className="p-5">
          <p className="text-sm text-slate-500">Active</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {activeCount}
          </p>
        </Box>
        <Box className="p-5">
          <p className="text-sm text-slate-500">Out of Stock</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">
            {outOfStock}
          </p>
        </Box>
      </div>

      <Box className="p-0">
        <div className="border-b border-slate-100 p-4">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-slate-400"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          </div>
        ) : isError ? (
          <div className="py-24 text-center text-sm text-red-600">
            Failed to load products. Please try again.
          </div>
        ) : table.getFilteredRowModel().rows.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-sm text-slate-500">No products found</p>
            <Link
              href="/dashboard/create-product"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 hover:underline"
            >
              <Plus size={16} />
              Create your first product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500"
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            className="inline-flex items-center gap-1 hover:text-slate-700"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && (
                              <ArrowUpDown size={12} />
                            )}
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 align-middle"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && table.getFilteredRowModel().rows.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing{' '}
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              {'–'}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              of {table.getFilteredRowModel().rows.length} products
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page{' '}
                {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Box>
    </div>
  );
};

export default AllProductsPage;
