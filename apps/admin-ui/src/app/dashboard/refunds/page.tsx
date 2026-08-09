'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatEGP } from '../../../utils/formatEGP';
import axiosInstance from '../../../utils/axiosInstance';
import RefundDetailsModal from './_components/RefundDetailsModal';

interface Refund {
  id: string;
  orderId: string;
  userId: string;
  shopId: string;
  amount: number;
  reason: string;
  status:
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED';
  adminId?: string;
  adminNotes?: string;
  userNotes?: string;
  requestedAt: string;
  reviewedAt?: string;
  completedAt?: string;
  createdAt: string;
  order: {
    id: string;
    total: number;
    paymentType: string;
    status: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  shop: {
    id: string;
    name: string;
  };
}

const fetchRefunds = async (params: {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}) => {
  const { data } = await axiosInstance.get('/api/orders/refunds/all', { params });
  return data;
};

const approveRefund = async (refundId: string, adminNotes: string) => {
  const { data } = await axiosInstance.patch(
    `/api/orders/refunds/${refundId}/approve`,
    {
      adminNotes,
    }
  );
  return data;
};

const rejectRefund = async (refundId: string, adminNotes: string) => {
  const { data } = await axiosInstance.patch(
    `/api/orders/refunds/${refundId}/reject`,
    {
      adminNotes,
    }
  );
  return data;
};

export default function AdminRefundsPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-refunds', pageIndex, pageSize, statusFilter, searchQuery],
    queryFn: () =>
      fetchRefunds({
        page: pageIndex + 1,
        limit: pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: ({
      refundId,
      adminNotes,
    }: {
      refundId: string;
      adminNotes: string;
    }) => approveRefund(refundId, adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      refundId,
      adminNotes,
    }: {
      refundId: string;
      adminNotes: string;
    }) => rejectRefund(refundId, adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
    },
  });

  const handleApprove = (refundId: string) => {
    const adminNotes = prompt('Enter admin notes (optional):') || '';
    approveMutation.mutate({ refundId, adminNotes });
  };

  const handleReject = (refundId: string) => {
    const adminNotes = prompt('Enter rejection reason (required):');
    if (adminNotes) {
      rejectMutation.mutate({ refundId, adminNotes });
    }
  };

  const columnHelper = createColumnHelper<Refund>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('orderId', {
        header: 'Order ID',
        cell: (info) => (
          <span className="text-sm font-mono text-gray-900">
            {info.getValue().slice(-8)}
          </span>
        ),
      }),
      columnHelper.accessor('user', {
        header: 'User',
        cell: (info) => (
          <div>
            <p className="text-sm font-medium text-gray-900">
              {info.getValue().name}
            </p>
            <p className="text-xs text-gray-500">{info.getValue().email}</p>
          </div>
        ),
      }),
      columnHelper.accessor('shop.name', {
        header: 'Shop',
        cell: (info) => (
          <p className="text-sm text-gray-900">{info.getValue()}</p>
        ),
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: (info) => (
          <p className="text-sm font-medium text-gray-900">
            {formatEGP(info.getValue())}
          </p>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          const configs = {
            PENDING: {
              bg: 'bg-yellow-50',
              text: 'text-yellow-700',
              border: 'border-yellow-200',
              icon: Clock,
              label: 'Pending',
            },
            APPROVED: {
              bg: 'bg-blue-50',
              text: 'text-blue-700',
              border: 'border-blue-200',
              icon: CheckCircle,
              label: 'Approved',
            },
            REJECTED: {
              bg: 'bg-red-50',
              text: 'text-red-700',
              border: 'border-red-200',
              icon: XCircle,
              label: 'Rejected',
            },
            PROCESSING: {
              bg: 'bg-purple-50',
              text: 'text-purple-700',
              border: 'border-purple-200',
              icon: RefreshCw,
              label: 'Processing',
            },
            COMPLETED: {
              bg: 'bg-green-50',
              text: 'text-green-700',
              border: 'border-green-200',
              icon: CheckCircle,
              label: 'Completed',
            },
            FAILED: {
              bg: 'bg-red-50',
              text: 'text-red-700',
              border: 'border-red-200',
              icon: XCircle,
              label: 'Failed',
            },
          };
          const config = configs[status] || configs.PENDING;
          const Icon = config.icon;
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}
            >
              <Icon className="h-3 w-3" />
              {config.label}
            </span>
          );
        },
      }),
      columnHelper.accessor('createdAt', {
        header: 'Date',
        cell: (info) => (
          <p className="text-sm text-gray-900">
            {format(new Date(info.getValue()), 'dd/MM/yyyy')}
          </p>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const refund = info.row.original;
          return (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedRefund(refund);
                  setShowDetailsModal(true);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <Eye className="h-4 w-4" />
              </button>
              {refund.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleApprove(refund.id)}
                    disabled={approveMutation.isPending}
                    className="text-green-600 hover:text-green-800 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleReject(refund.id)}
                    disabled={rejectMutation.isPending}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          );
        },
      }),
    ],
    [approveMutation.isPending, rejectMutation.isPending]
  );

  const table = useReactTable({
    data: data?.refunds || [],
    columns,
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: data?.pagination?.totalPages || 0,
  });

  const pagination = data?.pagination || { total: 0, totalPages: 0 };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Refund Management
        </h1>
        <p className="text-gray-600">
          Manage and process refund requests from users
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID, user email, or shop name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Refunds Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 text-gray-400 animate-spin" />
            <p className="text-gray-600">Loading refunds...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-400" />
            <p className="text-red-600">Error loading refunds</p>
          </div>
        ) : (data?.refunds || []).length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No refunds found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
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

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-700">
              Showing {pageIndex * pageSize + 1} to{' '}
              {Math.min((pageIndex + 1) * pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </p>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="ml-4 px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {[10, 20, 30, 40, 50].map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-1 border border-gray-300 rounded disabled:opacity-50"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPageIndex((prev) => prev - 1)}
              disabled={!table.getCanPreviousPage()}
              className="p-1 border border-gray-300 rounded disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-700">
              Page {pageIndex + 1} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPageIndex((prev) => prev + 1)}
              disabled={
                !table.getCanNextPage() ||
                pageIndex + 1 >= pagination.totalPages
              }
              className="p-1 border border-gray-300 rounded disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPageIndex(pagination.totalPages - 1)}
              disabled={
                !table.getCanNextPage() ||
                pageIndex + 1 >= pagination.totalPages
              }
              className="p-1 border border-gray-300 rounded disabled:opacity-50"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Refund Details Modal */}
      {showDetailsModal && selectedRefund && (
        <RefundDetailsModal
          refund={selectedRefund}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRefund(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          isApproving={approveMutation.isPending}
          isRejecting={rejectMutation.isPending}
        />
      )}
    </div>
  );
}
