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
  Eye,
  User,
  Mail,
  Calendar,
  Shield,
  Users,
  UserCheck,
  Crown,
  Filter,
  Plus,
  Edit,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import axiosInstance from '../../../utils/axiosInstance';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type Admin = {
  id: string;
  name: string;
  email: string;
  role: string;
  images: string | null;
  createdAt: string;
};

const ManagementPage = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newRole, setNewRole] = useState('admin');
  const router = useRouter();
  const queryClient = useQueryClient();

  const fetchAdmins = async (): Promise<Admin[]> => {
    const res = await axiosInstance.get('/api/admin/admins');
    return res.data.admins;
  };

  const {
    data: admins = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin-admins'],
    queryFn: fetchAdmins,
    staleTime: 5 * 60 * 1000,
  });

  const addAdminMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const res = await axiosInstance.put('/api/admin/add-admin', {
        email,
        role,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-admins'] });
      setShowAddModal(false);
      setNewAdminEmail('');
      setNewRole('admin');
      toast('Admin added successfully!');
    },
    onError: (error: any) => {
      console.error('Add admin error:', error);
      toast.error(error.response?.data?.message || 'Failed to add admin');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const res = await axiosInstance.put('/api/admin/add-admin', {
        email,
        role,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-admins'] });
      setShowRoleModal(false);
      setSelectedAdmin(null);
      setNewRole('admin');
      toast('Role updated successfully!');
    },
    onError: (error: any) => {
      console.error('Update role error:', error);
      toast.error(error.response?.data?.message || 'Failed to update role');
    },
  });

  const handleAddAdmin = () => {
    if (!newAdminEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    addAdminMutation.mutate({ email: newAdminEmail, role: newRole });
  };

  const handleUpdateRole = () => {
    if (!selectedAdmin) return;
    updateRoleMutation.mutate({ email: selectedAdmin.email, role: newRole });
  };

  const openRoleModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setNewRole(admin.role);
    setShowRoleModal(true);
  };

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

  const columnHelper = createColumnHelper<Admin>();

  const columns = useMemo(
    () => [
      // 1. Avatar/Initial
      columnHelper.display({
        id: 'avatar',
        header: 'Avatar',
        cell: ({ row }) => (
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            {row.original.images ? (
              <img
                src={row.original.images}
                alt={row.original.name}
                className="h-full w-full object-cover"
              />
            ) : (
              row.original.name?.charAt(0)?.toUpperCase() || 'A'
            )}
          </div>
        ),
      }),
      // 2. Name & ID
      columnHelper.accessor('name', {
        header: 'Admin',
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
      // 5. Created Date
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: ({ row }) => (
          <div className="flex flex-col text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
            </span>
          </div>
        ),
      }),
      // 6. Actions
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => openRoleModal(row.original)}
              className="p-1.5 hover:bg-orange-50 text-orange-600 rounded-lg transition-colors border border-transparent hover:border-orange-100"
              title="Update Role"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() =>
                router.push(`/dashboard/users/${row.original.id}`)
              }
              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-100"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        ),
      }),
    ],
    [router]
  );

  const table = useReactTable({
    data: admins,
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-600" />
            Admin Management
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Manage administrator accounts and role assignments
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search admins..."
              className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm outline-none focus:border-red-500 sm:w-64 transition-all"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Admin
          </button>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-widest">
              Total Admins
            </p>
            <p className="text-xl font-bold text-gray-900">{admins.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-widest">
              Super Admins
            </p>
            <p className="text-xl font-bold text-gray-900">
              {admins.filter(admin => admin.role === 'admin').length}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-widest">
              Active Today
            </p>
            <p className="text-xl font-bold text-gray-900">
              {admins.length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-red-500">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 md:px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-red-600 transition-colors whitespace-nowrap"
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
                    className="hover:bg-red-50/30 transition-colors group relative"
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
                        <Shield className="h-10 w-10 text-gray-200" />
                      </div>
                      <p className="font-semibold text-gray-700">
                        No admins found
                      </p>
                      <p className="text-xs text-gray-400">
                        No admin records match your current search.
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
            / <span className="text-gray-900">{admins.length}</span>
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

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Admin</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="Enter user email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAdmin}
                disabled={addAdminMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {addAdminMutation.isPending ? 'Adding...' : 'Add Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Role Modal */}
      {showRoleModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Update Role</h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{selectedAdmin.name}</p>
                  <p className="text-sm text-gray-600">{selectedAdmin.email}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={updateRoleMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementPage;