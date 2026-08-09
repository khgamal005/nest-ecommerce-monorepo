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
  ChevronsLeft,
  ChevronsRight,
  Search,
  Eye,
  Store,
  DollarSign,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';
import axiosInstance from '../../../utils/axiosInstance';
import { useRouter } from 'next/navigation';

type Order = {
  _id: string;
  id: string;
  total: number;
  status: string;
  createdAt: string;
  adminFee?: number;
  sellerAmount?: number;
  user: {
    name: string;
    email: string;
  };
  shop: {
    name: string;
  };
};

const PaymentsPage = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const router = useRouter();

  const fetchOrders = async (): Promise<Order[]> => {
    const res = await axiosInstance.get('/api/orders');
    return res.data;
  };

  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: fetchOrders,
    staleTime: 5 * 60 * 1000,
  });

  const columnHelper = createColumnHelper<Order>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Order ID',
        cell: ({ row }) => {
          const id = row.original._id || row.original.id;
          return (
            <span className="font-mono text-xs text-gray-600">
              #{id.slice(-8).toUpperCase()}
            </span>
          );
        },
      }),
      columnHelper.accessor('shop.name', {
        header: 'Shop Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-700">
              {row.original.shop?.name || 'N/A'}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('user.name', {
        header: 'Buyer',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">
              {row.original.user?.name}
            </span>
            <span className="text-xs text-gray-500">
              {row.original.user?.email}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('total', {
        header: 'Order Total',
        cell: ({ row }) => (
          <span className="font-semibold text-gray-900">
            {formatEGP(row.original.total)}
          </span>
        ),
      }),
      columnHelper.accessor('sellerAmount', {
        header: 'Seller Earning',
        cell: ({ row }) => {
          const earning = row.original.sellerAmount;

          return (
            <span className="font-medium text-green-600">
              +{formatEGP(earning || 0)}
            </span>
          );
        },
      }),

      columnHelper.accessor('adminFee', {
        header: 'Admin Fee',
        cell: ({ row }) => {
          const fee = row.original.adminFee;

          return (
            <span className="font-medium text-blue-600">{formatEGP(fee || 0)}</span>
          );
        },
      }),

      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                status === 'PAID'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {status}
            </span>
          );
        },
      }),
      columnHelper.accessor('createdAt', {
        header: 'Date',
        cell: ({ row }) => (
          <div className="flex flex-col text-xs text-gray-500">
            <span>
              {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
            </span>
            <span>{format(new Date(row.original.createdAt), 'hh:mm a')}</span>
          </div>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'View',
        cell: ({ row }) => {
          const id = row.original._id || row.original.id;
          return (
            <button
              onClick={() => router.push(`/dashboard/orders/${id}`)}
              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
              title="View Order"
            >
              <Eye className="h-4 w-4" />
            </button>
          );
        },
      }),
    ],
    [router]
  );

  const table = useReactTable({
    data: orders,
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
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Payment Transactions
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Overview of all orders and platform commission
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search payments..."
              className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-64 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <CreditCard className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-gray-500 truncate">
              Total Transactions
            </p>
            <p className="text-lg md:text-xl font-bold text-gray-900">
              {orders.length}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg shrink-0">
            <DollarSign className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-gray-500 truncate">
              Gross Volume
            </p>
            <p className="text-lg md:text-xl font-bold text-gray-900 truncate">
              {formatEGP(orders.reduce((acc, curr) => acc + curr.total, 0))}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg shrink-0">
            <DollarSign className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-gray-500 truncate">
              Admin Revenue
            </p>
            <p className="text-lg md:text-xl font-bold text-gray-900 truncate">
              {formatEGP(
                orders.reduce((acc, curr) => acc + (curr.adminFee || 0), 0)
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors whitespace-nowrap"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/dashboard/orders/${
                          row.original._id || row.original.id
                        }`
                      )
                    }
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
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="h-8 w-8 text-gray-300" />
                      <p>No payment records found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50/30 border-t border-gray-100">
          <div className="text-[10px] md:text-sm text-gray-500">
            Showing{' '}
            <span className="font-medium text-gray-900">
              {table.getRowModel().rows.length}
            </span>{' '}
            of{' '}
            <span className="font-medium text-gray-900">{orders.length}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1 mx-2">
              {[...Array(table.getPageCount())]
                .map((_, i) => (
                  <button
                    key={i}
                    onClick={() => table.setPageIndex(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      table.getState().pagination.pageIndex === i
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))
                .slice(0, 5)}
            </div>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
