'use client';

import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  User,
  Mail,
  Calendar,
  Shield,
  Users,
  UserCheck,
  Crown,
  Filter,
  Ban,
  UserX,
} from 'lucide-react';
import { format } from 'date-fns';
import axiosInstance from '../../../utils/axiosInstance';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  images: string | null;
  isBanned: boolean;
  bannedAt: string | null;
};

const UsersPage = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const router = useRouter();
  const queryClient = useQueryClient();

  const fetchUsers = async (): Promise<User[]> => {
    const res = await axiosInstance.get('/api/admin/users', {
      params: {
        limit: 100,
      },
    });
    return res.data.users;
  };

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, isBanned }: { userId: string; isBanned: boolean }) => {
      const res = await axiosInstance.put(`/api/admin/users/${userId}/ban`, {
        isBanned,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      console.error('Ban user error:', error);
      alert('Failed to update user status');
    },
  });

  const handleBanUser = (userId: string, currentBanStatus: boolean) => {
    const action = currentBanStatus ? 'unban' : 'ban';
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      banUserMutation.mutate({ userId, isBanned: !currentBanStatus });
    }
  };

  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000,
  });

  const roles = useMemo(() => {
    const roleSet = new Set(users.map((u) => u.role));
    return ['All', ...Array.from(roleSet)];
  }, [users]);

  const filteredData = useMemo(() => {
    let data = users;
    if (roleFilter !== 'All') {
      data = data.filter((u) => u.role === roleFilter);
    }
    return data;
  }, [users, roleFilter]);

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <Crown className="h-3.5 w-3.5" />;
      case 'seller':
        return <UserCheck className="h-3.5 w-3.5" />;
      default:
        return <User className="h-3.5 w-3.5" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-600';
      case 'seller':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const columnHelper = createColumnHelper<User>();

  const columns = useMemo(
    () => [
      // 1. Initial
      columnHelper.display({
        id: 'initial',
        header: 'User',
        cell: ({ row }) => (
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            {row.original.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        ),
      }),
      // 2. Name & ID
      columnHelper.accessor('name', {
        header: 'User',
        cell: ({ row }) => (
          <div className="flex flex-col min-w-[150px] max-w-[200px]">
            <span className="font-semibold text-gray-900 truncate">
              {row.original.name}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              #{row.original.id.slice(-6).toUpperCase()}
            </span>
          </div>
        ),
      }),
      // 3. Email
      columnHelper.accessor('email', {
        header: 'Email',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 max-w-[200px]">
            <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-700 truncate">
              {row.original.email}
            </span>
          </div>
        ),
      }),
      // 4. Role
      columnHelper.accessor('role', {
        header: 'Role',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${getRoleColor(row.original.role)}`}>
              {getRoleIcon(row.original.role)}
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${getRoleColor(
                row.original.role
              )}`}
            >
              {row.original.role}
            </span>
          </div>
        ),
      }),
      // 5. Status
      columnHelper.display({
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
              row.original.isBanned
                ? 'bg-red-100 text-red-600'
                : 'bg-green-100 text-green-600'
            }`}
          >
            {row.original.isBanned ? 'Banned' : 'Active'}
          </span>
        ),
      }),
      // 6. Actions
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                router.push(`/dashboard/users/${row.original.id}`)
              }
              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-100"
              title="View User Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            {row.original.role !== 'admin' && (
              <button
                onClick={() =>
                  handleBanUser(row.original.id, row.original.isBanned)
                }
                disabled={banUserMutation.isPending}
                className={`p-1.5 rounded-lg transition-colors border border-transparent ${
                  row.original.isBanned
                    ? 'hover:bg-green-50 text-green-600 hover:border-green-100'
                    : 'hover:bg-red-50 text-red-600 hover:border-red-100'
                } disabled:opacity-50`}
                title={row.original.isBanned ? 'Unban User' : 'Ban User'}
              >
                {row.original.isBanned ? (
                  <UserCheck className="h-4 w-4" />
                ) : (
                  <UserX className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
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

  const adminUsers = users.filter((user) => user.role === 'admin');
  const sellerUsers = users.filter((user) => user.role === 'seller');
  const bannedUsers = users.filter((user) => user.isBanned);

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Users Management
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Manage and monitor all registered users across different roles
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search users..."
              className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-64 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm transition-all focus-within:border-blue-300">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-sm text-gray-700 outline-none bg-transparent cursor-pointer font-medium"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
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
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-widest">
              Total Users
            </p>
            <p className="text-xl font-bold text-gray-900">{users.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-widest">
              Admins
            </p>
            <p className="text-xl font-bold text-gray-900">
              {adminUsers.length}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <UserX className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-widest">
              Banned Users
            </p>
            <p className="text-xl font-bold text-gray-900">
              {bannedUsers.length}
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
                        <Users className="h-10 w-10 text-gray-200" />
                      </div>
                      <p className="font-semibold text-gray-700">
                        No users found
                      </p>
                      <p className="text-xs text-gray-400">
                        No user records match your current search.
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
            Showing:{' '}
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

export default UsersPage;
