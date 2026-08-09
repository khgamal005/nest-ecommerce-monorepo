'use client';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState, useRef, useEffect } from 'react';
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
  MoreHorizontal,
  Search,
  Eye,
  Copy,
  FileText,
  Truck,
  Store,
} from 'lucide-react';
import { format } from 'date-fns';
import axiosInstance from '../../../utils/axiosInstance';
import { useRouter } from 'next/navigation';
import { formatEGP } from '../../../utils/formatEGP';

// Define the Order type based on your API response
type Order = {
  _id: string;
  id: string;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  deliveryStatus?: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  shop: {
    id: string;
    name: string;
    logo?: string;
  };
  paymentSessionId?: string;
};

// Dropdown component for actions
const OrderActionsDropdown = ({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) => {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const orderId = order._id || order.id;

  const handleViewDetails = () => {
    router.push(`/dashboard/orders/${orderId}`);
    onClose();
  };

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      // You could add a toast notification here
      console.log('Order ID copied to clipboard');
      onClose();
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleUpdateStatus = () => {
    // Implement update status logic
    console.log('Update status for order:', orderId);
    onClose();
  };

  const handleSendInvoice = () => {
    // Implement send invoice logic
    onClose();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-gray-200 bg-white shadow-lg"
    >
      <div className="py-1">
        {/* Order header */}
        <div className="px-4 py-2 border-b">
          <p className="text-sm font-semibold text-gray-900 truncate">
            Order #{orderId.slice(-8)}
          </p>
          <p className="text-xs text-gray-500 truncate">{order.user?.name || 'Unknown User'}</p>
        </div>

        {/* Action items */}
        <button
          onClick={handleViewDetails}
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Eye className="h-4 w-4" />
          View Details
        </button>

        <button
          onClick={handleCopyOrderId}
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Copy className="h-4 w-4" />
          Copy Order ID
        </button>

        <button
          onClick={handleUpdateStatus}
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Truck className="h-4 w-4" />
          Update Status
        </button>

        <button
          onClick={handleSendInvoice}
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FileText className="h-4 w-4" />
          Send Invoice
        </button>

        {/* Quick status actions */}
        <div className="border-t border-gray-100 mt-1 pt-1">
          <div className="px-3 py-1 text-xs font-medium text-gray-500">
            Quick Actions
          </div>
          <div className="grid grid-cols-2 gap-1 px-2 pb-2">
            <button
              onClick={() => {
                console.log('Mark as shipped:', orderId);
                onClose();
              }}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
            >
              Ship
            </button>
            <button
              onClick={() => {
                console.log('Mark as delivered:', orderId);
                onClose();
              }}
              className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
            >
              Deliver
            </button>
            <button
              onClick={() => {
                console.log('Cancel order:', orderId);
                onClose();
              }}
              className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                console.log('Print invoice:', orderId);
                onClose();
              }}
              className="px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
            >
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrdersTable = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const router = useRouter();

  const fetchOrders = async (): Promise<Order[]> => {
    const res = await axiosInstance.get('/api/orders');
    return res.data;
  };

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['seller-orders'],
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
            <div className="flex items-center gap-2">
              <span className="font-mono">#{id.slice(-8).toUpperCase()}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(id);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy Order ID"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          );
        },
      }),
      columnHelper.accessor('user', {
        header: 'Customer',
        cell: ({ row }) => {
          const user = row.original.user;
          return (
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'User'}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900">
                  {user?.name || 'Unknown User'}
                </div>
                <div className="text-sm text-gray-500">
                  {user?.email || 'No email'}
                </div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('shop', {
        header: 'Shop',
        cell: ({ row }) => {
          const shop = row.original.shop;
          return (
            <div className="flex items-center gap-2 text-gray-700">
              <Store className="h-4 w-4 text-gray-400 shrink-0" />
              <span
                className="font-medium truncate max-w-[120px]"
                title={shop?.name}
              >
                {shop?.name || 'N/A'}
              </span>
            </div>
          );
        },
      }),

      columnHelper.accessor('total', {
        header: 'Order Total',
        cell: ({ row }) => (
          <span className="font-semibold text-gray-900">
            {formatEGP(row.original.total)}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const getStatusConfig = (status: string) => {
            const configs = {
              PAID: {
                bg: 'bg-green-50',
                text: 'text-green-700',
                border: 'border-green-200',
              },
              PENDING: {
                bg: 'bg-yellow-50',
                text: 'text-yellow-700',
                border: 'border-yellow-200',
              },
              FAILED: {
                bg: 'bg-red-50',
                text: 'text-red-700',
                border: 'border-red-200',
              },
              CANCELLED: {
                bg: 'bg-gray-50',
                text: 'text-gray-700',
                border: 'border-gray-200',
              },
              COMPLETED: {
                bg: 'bg-blue-50',
                text: 'text-blue-700',
                border: 'border-blue-200',
              },
              PROCESSING: {
                bg: 'bg-purple-50',
                text: 'text-purple-700',
                border: 'border-purple-200',
              },
              default: {
                bg: 'bg-gray-50',
                text: 'text-gray-700',
                border: 'border-gray-200',
              },
            };
            return configs[status as keyof typeof configs] || configs.default;
          };

          const config = getStatusConfig(status);
          return (
            <div className="flex flex-col gap-1">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}
              >
                {status}
              </span>
              {row.original.deliveryStatus && (
                <span className="text-xs text-gray-500 truncate">
                  {row.original.deliveryStatus}
                </span>
              )}
            </div>
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Date',
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          return (
            <div className="flex flex-col">
              <span className="font-medium">
                {format(date, 'MMM dd, yyyy')}
              </span>
              <span className="text-sm text-gray-500">
                {format(date, 'hh:mm a')}
              </span>
            </div>
          );
        },
        enableSorting: true,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const order = row.original;
          const orderId = order._id || order.id;
          const isOpen = openDropdownId === orderId;

          // Direct navigation function
          const handleViewDetails = () => {
            router.push(`/dashboard/orders/${orderId}`);
          };

          return (
            <div className="relative">
              <div className="flex items-center gap-2">
                {/* Quick View button - no dropdown */}
                <button
                  onClick={handleViewDetails}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                  title="View Order Details"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>

                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(isOpen ? null : orderId);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
                    title="More Actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {isOpen && (
                    <OrderActionsDropdown
                      order={order}
                      onClose={() => setOpenDropdownId(null)}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        },
      }),
    ],
    [openDropdownId, router]
  );

  const table = useReactTable({
    data: orders,
    columns,
    state: {
      globalFilter,
      rowSelection,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Close dropdown when clicking anywhere else
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-10 w-64 bg-gray-200 rounded" />
          <div className="h-10 w-40 bg-gray-200 rounded" />
        </div>
        <div className="rounded-md border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border-b">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="h-4 flex-1 bg-gray-200 rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-red-100 p-3 mb-4">
          <div className="text-red-600">⚠️</div>
        </div>
        <h3 className="text-lg font-semibold mb-2">Error loading orders</h3>
        <p className="text-gray-500 mb-4">
          {(error as Error)?.message || 'Failed to load orders'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search orders by ID, buyer name, or email..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-10 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={table.getState().pagination.pageSize.toString()}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="rounded-lg border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize.toString()}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-gray-50/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-1 ${
                          header.column.getCanSort()
                            ? 'cursor-pointer select-none hover:text-gray-900 transition-colors'
                            : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="group hover:bg-gray-50/80 transition-all duration-200"
                  onClick={() => {
                    const orderId = row.original._id || row.original.id;
                    router.push(`/dashboard/orders/${orderId}`);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap"
                      onClick={(e) => {
                        if (cell.column.id === 'actions') {
                          e.stopPropagation();
                        }
                      }}
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
                  className="h-64 px-4 py-3 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="rounded-full bg-gray-50 p-6 mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-semibold text-lg">
                      No orders found
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      No matching records found for your search.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const order = row.original;
            const orderId = order._id || order.id;
            const date = new Date(order.createdAt);

            // Re-using the status config logic from columns if needed,
            // but here we can just simplify for mobile
            return (
              <div
                key={row.id}
                onClick={() => router.push(`/dashboard/orders/${orderId}`)}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-tight">
                      #{orderId.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatEGP(order.total)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold ring-1 ring-blue-100">
                      {order.status}
                    </span>
                    {order.deliveryStatus && (
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">
                        {order.deliveryStatus}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 py-3 border-y border-gray-50 mb-3">
                  {order.user?.avatar ? (
                    <img
                      src={order.user?.avatar}
                      className="h-10 w-10 rounded-full object-cover shadow-sm"
                      alt=""
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                      {order.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-sm">
                      {order.user?.name || 'Unknown User'}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Store className="h-3 w-3" />
                      <span>{order.shop?.name || 'Unknown Shop'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <div className="flex flex-col">
                    <span>{format(date, 'MMM dd, yyyy')}</span>
                    <span>{format(date, 'hh:mm a')}</span>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(
                          openDropdownId === orderId ? null : orderId
                        );
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="h-5 w-5 text-gray-400" />
                    </button>
                    {openDropdownId === orderId && (
                      <div className="absolute right-0 bottom-full mb-2">
                        <OrderActionsDropdown
                          order={order}
                          onClose={() => setOpenDropdownId(null)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-200">
            <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium tracking-tight">
              No orders matched your search
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-500">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="rounded-md border border-gray-300 p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="First Page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-md border border-gray-300 p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm px-3 py-1 bg-gray-50 rounded-md">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount() || 1}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-md border border-gray-300 p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="rounded-md border border-gray-300 p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Last Page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const OrdersPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
          Orders
        </h1>
        <p className="text-gray-500 mt-1">
          Manage and track your customer orders
        </p>
      </div>
      <OrdersTable />
    </div>
  );
};

export default OrdersPage;
