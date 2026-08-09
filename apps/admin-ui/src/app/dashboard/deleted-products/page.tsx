'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
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
  Store,
  Package,
  Calendar,
  Trash2,
  Loader2,
  Image,
  Filter,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import axiosInstance from '../../../utils/axiosInstance';

// ─── Types ────────────────────────────────────────────────────────────────────

type DeletedProduct = {
  id: string;
  title: string;
  slug: string;
  isDeleted: boolean;
  deletedAt: string;
  createdAt: string;
  images: { url: string; r2_key?: string }[];
  videos: { url: string; r2_key?: string }[];
  hasVariants: boolean;
  variants: {
    id: string;
    images: { url: string; r2_key?: string }[];
    videos: { url: string; r2_key?: string }[];
  }[];
  shop: { id: string; name: string; avatar: string };
  sellerId: string;
  status: string;
};

type RowFeedback = { type: 'success' | 'error'; message: string };

// ─── Page ─────────────────────────────────────────────────────────────────────

const DeletedProductsPage = () => {
  const queryClient = useQueryClient();
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateFilter, setDateFilter] = useState<'7' | '30' | 'all'>('all');
  const [rowFeedback, setRowFeedback] = useState<Record<string, RowFeedback>>({});

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchDeletedProducts = async (): Promise<DeletedProduct[]> => {
    const res = await axiosInstance.get('/api/products/deleted', {
      params: { limit: 100 },
    });
    return res.data.data;
  };

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-deleted-products'],
    queryFn: fetchDeletedProducts,
    staleTime: 5 * 60 * 1000,
  });

  // ─── Hard Delete Mutation ────────────────────────────────────────────────────

  const { mutate: hardDelete, isPending: isDeleting } = useMutation({
    mutationFn: async (productId: string) => {
      const res = await axiosInstance.delete(`/api/products/${productId}/hard`);
      return { productId, data: res.data };
    },
    onSuccess: ({ productId, data }) => {
      setRowFeedback((prev) => ({
        ...prev,
        [productId]: {
          type: 'success',
          message: `${data.data?.mediaQueued ?? 0} media queued for R2 cleanup`,
        },
      }));
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['admin-deleted-products'] });
        setRowFeedback((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
      }, 1500);
    },
    onError: (error: unknown, productId: string) => {
      console.error('Hard delete failed:', error);
      setRowFeedback((prev) => ({
        ...prev,
        [productId]: { type: 'error', message: 'Delete failed. Try again.' },
      }));
      setTimeout(() => {
        setRowFeedback((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
      }, 3000);
    },
  });

  const handleHardDelete = (product: DeletedProduct) => {
    const totalMedia =
      product.images.length +
      product.videos.length +
      product.variants.reduce(
        (acc, v) => acc + v.images.length + v.videos.length,
        0
      );

    const confirmed = window.confirm(
      `⚠️ Permanently delete "${product.title}"?\n\n` +
        `This will permanently purge ${totalMedia} media file(s) from Cloudflare R2 and CDN cache.\n\n` +
        `This action CANNOT be undone.`
    );

    if (confirmed) hardDelete(product.id);
  };

  // ─── Derived Stats ───────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalMedia = products.reduce(
      (acc, p) =>
        acc +
        p.images.length +
        p.videos.length +
        p.variants.reduce((va, v) => va + v.images.length + v.videos.length, 0),
      0
    );

    const oldestDays =
      products.length > 0
        ? Math.max(
            ...products.map((p) =>
              differenceInDays(new Date(), new Date(p.deletedAt))
            )
          )
        : 0;

    return { totalMedia, oldestDays };
  }, [products]);

  // ─── Date Filter ─────────────────────────────────────────────────────────────

  const filteredData = useMemo(() => {
    if (dateFilter === 'all') return products;
    const days = parseInt(dateFilter);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return products.filter((p) => new Date(p.deletedAt) >= cutoff);
  }, [products, dateFilter]);

  // ─── Columns ─────────────────────────────────────────────────────────────────

  const columnHelper = createColumnHelper<DeletedProduct>();

  const columns = useMemo(
    () => [
      // 1. Image
      columnHelper.accessor('images', {
        header: 'Image',
        cell: ({ row }) => {
          const { images, hasVariants, variants, title } = row.original;
          let displayImages = images;
          if (hasVariants && variants?.length > 0) {
            const variantImages = variants.flatMap((v) => v.images);
            displayImages = variantImages.length > 0 ? variantImages : images;
          }
          const firstImage = displayImages?.[0]?.url || '';

          return (
            <div className="relative h-10 w-10 md:h-12 md:w-12 rounded-lg overflow-hidden bg-gray-50 border border-red-100 shadow-sm shrink-0">
              {firstImage ? (
                <img src={firstImage} alt={title} className="h-full w-full object-cover opacity-60 grayscale" />
              ) : (
                <Package className="h-full w-full p-2 text-gray-300" />
              )}
              {/* Deleted overlay */}
              <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                <Trash2 className="h-3 w-3 text-red-400" />
              </div>
            </div>
          );
        },
      }),

      // 2. Title
      columnHelper.accessor('title', {
        header: 'Product',
        cell: ({ row }) => (
          <div className="flex flex-col min-w-[150px] max-w-[220px]">
            <span className="font-semibold text-gray-700 truncate line-through decoration-red-300">
              {row.original.title}
            </span>
            <span className="text-[10px] text-gray-400 font-mono mt-0.5">
              #{row.original.id.slice(-6).toUpperCase()}
            </span>
            <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full w-fit">
              Deleted
            </span>
          </div>
        ),
      }),

      // 3. Shop
      columnHelper.accessor('shop.name', {
        header: 'Shop',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 max-w-[130px]">
            <Store className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-600 truncate font-medium">
              {row.original.shop?.name || 'N/A'}
            </span>
          </div>
        ),
      }),

      // 4. Media Count
      columnHelper.display({
        id: 'mediaCount',
        header: 'Media',
        cell: ({ row }) => {
          const p = row.original;
          const totalImages =
            p.images.length +
            p.variants.reduce((acc, v) => acc + v.images.length, 0);
          const totalVideos =
            p.videos.length +
            p.variants.reduce((acc, v) => acc + v.videos.length, 0);
          const hasR2 =
            p.images.some((i) => i.r2_key) ||
            p.videos.some((v) => v.r2_key) ||
            p.variants.some(
              (v) =>
                v.images.some((i) => i.r2_key) || v.videos.some((vi) => vi.r2_key)
            );

          return (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-600">
                {totalImages > 0 && (
                  <span className="mr-2">🖼 {totalImages} img</span>
                )}
                {totalVideos > 0 && <span>🎬 {totalVideos} vid</span>}
                {totalImages === 0 && totalVideos === 0 && (
                  <span className="text-gray-400">No media</span>
                )}
              </span>
              {hasR2 ? (
                <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded w-fit">
                  R2 pending
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded w-fit">
                  Legacy / clean
                </span>
              )}
            </div>
          );
        },
      }),

      // 5. Deleted At
      columnHelper.accessor('deletedAt', {
        header: 'Deleted',
        cell: ({ row }) => {
          const days = differenceInDays(new Date(), new Date(row.original.deletedAt));
          return (
            <div className="flex flex-col text-[10px] text-gray-400">
              <span>{format(new Date(row.original.deletedAt), 'MMM dd, yyyy')}</span>
              <span className={`mt-0.5 font-medium ${days > 30 ? 'text-red-400' : 'text-gray-400'}`}>
                {days === 0 ? 'Today' : `${days}d ago`}
              </span>
            </div>
          );
        },
      }),

      // 6. Created At
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: ({ row }) => (
          <div className="text-[10px] text-gray-400">
            {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
          </div>
        ),
      }),

      // 7. Actions
      columnHelper.display({
        id: 'actions',
        header: 'Purge',
        cell: ({ row }) => {
          const productId = row.original.id;
          const feedback = rowFeedback[productId];
          const isPending = isDeleting;

          if (feedback?.type === 'success') {
            return (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-[10px]">{feedback.message}</span>
              </div>
            );
          }

          if (feedback?.type === 'error') {
            return (
              <div className="flex items-center gap-1 text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span className="text-[10px]">{feedback.message}</span>
              </div>
            );
          }

          return (
            <button
              onClick={() => handleHardDelete(row.original)}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-100 hover:border-red-200 disabled:opacity-40 text-xs font-medium"
              title="Permanently delete from R2"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Purge
            </button>
          );
        },
      }),
    ],
    [rowFeedback, isDeleting]
  );

  // ─── Table ───────────────────────────────────────────────────────────────────

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-6 max-w-full overflow-hidden">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-red-600" />
            Deleted Products
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Soft-deleted products pending permanent R2 media purge
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search products..."
              className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm outline-none focus:border-red-400 sm:w-64 transition-all"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm transition-all focus-within:border-red-300">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as '7' | '30' | 'all')}
              className="text-sm text-gray-700 outline-none bg-transparent cursor-pointer font-medium"
            >
              <option value="all">All time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Trash2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-widest">
              Total Deleted
            </p>
            <p className="text-xl font-bold text-gray-900">{products.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Image className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-widest">
              Total Media
            </p>
            <p className="text-xl font-bold text-gray-900">{stats.totalMedia}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-widest">
              Oldest Deleted
            </p>
            <p className="text-xl font-bold text-gray-900">
              {stats.oldestDays > 0 ? `${stats.oldestDays}d ago` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-red-500">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 md:px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-red-500 transition-colors whitespace-nowrap"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? null}
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
                    className="hover:bg-red-50/20 transition-colors group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 md:px-6 py-4 text-xs md:text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-24 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-5 bg-gray-50 rounded-full">
                        <Package className="h-10 w-10 text-gray-200" />
                      </div>
                      <p className="font-semibold text-gray-700">No deleted products</p>
                      <p className="text-xs text-gray-400">
                        All products are active or already purged.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-5 bg-gray-50/40 border-t border-gray-100">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
            Showing{' '}
            <span className="text-gray-900">{table.getRowModel().rows.length}</span>{' '}
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
                        ? 'bg-red-600 text-white shadow-lg shadow-red-100 scale-105'
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

export default DeletedProductsPage;