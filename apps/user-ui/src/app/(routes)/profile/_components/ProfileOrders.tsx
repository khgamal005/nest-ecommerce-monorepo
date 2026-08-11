'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/utils/axiosInstance';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Eye,
  Package,
  Store,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { formatEGP } from '@/utils/formatEGP';

interface OrderItem {
  id: string;
  productId: string | { name?: string; _id?: string };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  _id: string;
  total: number;
  status: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  createdAt: string;
  updatedAt: string;
  paymentType?: string;
  items: OrderItem[];
  shop?: {
    id: string;
    name: string;
    logo?: string;
  };
}

interface ProfileOrdersProps {
  user: {
    id: string;
  };
}

const fetchUserOrders = async () => {
  const response = await axiosInstance.get('/api/orders/mine');
  return response.data.orders || [];
};

const ProfileOrders: React.FC<ProfileOrdersProps> = ({ user }) => {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-orders'],
    queryFn: fetchUserOrders,
    enabled: !!user?.id,
  });

  const getPaymentStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { bg: string; text: string; border: string }
    > = {
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
      REFUNDED: {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
      },
      default: {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
      },
    };
    return configs[status] || configs.default;
  };

  const formatPaymentStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      PAID: 'تم الدفع',
      PENDING: 'قيد الانتظار',
      FAILED: 'فشل الدفع',
      REFUNDED: 'مسترد',
    };
    return statusMap[status] || status;
  };

  const truncateOrderId = (id: string) => {
    return `#${id.slice(-8).toUpperCase()}`;
  };

  const columnHelper = createColumnHelper<Order>();

  const columns = React.useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'رقم الطلب',
        cell: ({ row }) => {
          const id = row.original._id || row.original.id;
          return (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-400" />
              <span className="font-mono text-sm">{truncateOrderId(id)}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor('shop', {
        header: 'المتجر',
        cell: ({ row }) => {
          const shop = row.original.shop;
          return (
            <div className="flex items-center gap-2 text-gray-700">
              <Store className="h-4 w-4 text-gray-400 shrink-0" />
              <span
                className="font-medium truncate max-w-[120px] text-sm"
                title={shop?.name}
              >
                {shop?.name || 'غير متوفر'}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor('items', {
        header: 'المنتجات',
        cell: ({ row }) => {
          const items = row.original.items || [];
          const totalItems = items.reduce(
            (sum, item) => sum + (item.quantity || 0),
            0
          );
          return (
            <span className="text-sm text-gray-600">
              {totalItems} {totalItems === 1 ? 'منتج' : 'منتجات'}
            </span>
          );
        },
      }),
      columnHelper.accessor('total', {
        header: 'الإجمالي',
        cell: ({ row }) => (
          <span className="font-semibold text-gray-900 text-sm">
            {formatEGP(row.original.total || 0)}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'الحالة',
        cell: ({ row }) => {
          const paymentStatus = row.original.paymentStatus;
          const config = getPaymentStatusConfig(paymentStatus || 'PENDING');
          return (
            <div className="flex flex-col gap-1">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}
              >
                {formatPaymentStatus(paymentStatus || 'PENDING')}
              </span>
              {row.original.deliveryStatus && (
                <span className="text-xs text-gray-500 truncate">
                  {row.original.deliveryStatus}
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('createdAt', {
        header: 'التاريخ',
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          return (
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {format(date, 'dd MMM yyyy', { locale: ar })}
              </span>
              <span className="text-xs text-gray-500">
                {format(date, 'hh:mm a', { locale: ar })}
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'الإجراءات',
        cell: ({ row }) => {
          const order = row.original;
          const orderId = order._id || order.id;

          const handleViewDetails = () => {
            router.push(`/profile/orders/${orderId}`);
          };

          return (
            <button
              onClick={handleViewDetails}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
              title="عرض تفاصيل الطلب"
            >
              <Eye className="h-4 w-4" />
              عرض
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
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 bg-white rounded-lg border">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="mr-3 text-gray-600">جاري تحميل الطلبات...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500 bg-white rounded-lg border">
        <Package className="h-12 w-12 mx-auto mb-4 text-red-300" />
        <p className="text-lg font-medium">حدث خطأ في تحميل الطلبات</p>
        <p className="text-sm mt-2">يرجى المحاولة مرة أخرى</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">لا توجد طلبات بعد</p>
        <p className="text-sm mt-2">ابدأ التسوق لترى طلباتك هنا</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-lg font-semibold">
          لديك {orders.length} {orders.length === 1 ? 'طلب' : 'طلبات'}
        </p>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="البحث في الطلبات..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Mobile-only Card View */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {table.getRowModel().rows.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500">لا توجد طلبات مطابقة للبحث.</p>
          </div>
        ) : (
          table.getRowModel().rows.map((row) => {
            const order = row.original;
            const orderId = order._id || order.id;
            const date = new Date(order.createdAt);
            const config = getPaymentStatusConfig(order.paymentStatus || 'PENDING');
            const totalItems = (order.items || []).reduce(
              (sum, item) => sum + (item.quantity || 0),
              0
            );

            return (
              <div
                key={row.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 active:scale-[0.98] transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Package className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        رقم الطلب
                      </p>
                      <p className="font-mono text-sm font-bold text-gray-900">
                        {truncateOrderId(orderId)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${config.bg} ${config.text} border ${config.border}`}
                  >
                    {formatPaymentStatus(order.paymentStatus || 'PENDING')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">
                      المتجر
                    </p>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Store className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <p className="text-sm font-bold text-gray-700 truncate">
                        {order.shop?.name || 'غير متوفر'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">
                      التاريخ
                    </p>
                    <p className="text-sm font-bold text-gray-700">
                      {format(date, 'dd MMM yyyy', { locale: ar })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">
                      المنتجات
                    </p>
                    <p className="text-sm font-bold text-gray-700">
                      {totalItems} {totalItems === 1 ? 'منتج' : 'منتجات'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">
                      الإجمالي
                    </p>
                    <p className="text-sm font-extrabold text-blue-600">
                      {formatEGP(order.total || 0)}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => router.push(`/profile/orders/${orderId}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Eye className="h-4 w-4" />
                    عرض تفاصيل الطلب
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        cursor: header.column.getCanSort()
                          ? 'pointer'
                          : 'default',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getIsSorted() === 'asc' && (
                          <span className="text-blue-500">↑</span>
                        )}
                        {header.column.getIsSorted() === 'desc' && (
                          <span className="text-blue-500">↓</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-50">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
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

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>صفحة {table.getState().pagination.pageIndex + 1} من </span>
            {table.getPageCount()}
            <span className="text-gray-400">|</span>
            <span>{table.getFilteredRowModel().rows.length} طلب</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="الصفحة الأولى"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="الصفحة السابقة"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm text-gray-600 px-2">
              {table.getState().pagination.pageIndex + 1}
            </span>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="الصفحة التالية"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="الصفحة الأخيرة"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileOrders;
