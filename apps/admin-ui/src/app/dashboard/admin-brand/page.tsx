'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import axiosInstance from '../../../utils/axiosInstance';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Plus, X, Upload } from 'lucide-react';
import Image from 'next/image';
import { ImageModal } from '../../../components/ImageModal';
import {
  useBrandLogoManagement,
  toBrandLogo,
} from '../../../hooks/useBrandLogoManagement';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  logoR2Key: string | null;
  verified: boolean;
  createdAt: string;
}

interface BrandFormData {
  name: string;
  verified: boolean;
}

// ─── Column helper ────────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<Brand>();

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrandsPage() {
  const qc = useQueryClient();
  const [globalFilter, setGlobalFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editBrand, setEditBrand] = useState<Brand | null>(null);
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: '' });

  const { logo, setLogo, uploadLogo, removeLogo, uploading } =
    useBrandLogoManagement(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BrandFormData>({ defaultValues: { verified: true } });

  // ── Queries & mutations ──────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () =>
      axiosInstance
        .get('/api/brands')
        .then(r => r.data.brands as Brand[]),
  });

  const createMutation = useMutation({
    mutationFn: (payload: object) =>
      axiosInstance.post('/api/brands', payload),
    onSuccess: () => {
      toast.success('Brand created');
      qc.invalidateQueries({ queryKey: ['admin-brands'] });
      closeModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: object }) =>
      axiosInstance.patch(`/api/brands/${id}`, payload),
    onSuccess: () => {
      toast.success('Brand updated');
      qc.invalidateQueries({ queryKey: ['admin-brands'] });
      closeModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      axiosInstance.delete(`/api/brands/${id}`),
    onSuccess: () => {
      toast.success('Brand deleted');
      qc.invalidateQueries({ queryKey: ['admin-brands'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  // ── Modal helpers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditBrand(null);
    setLogo(null);
    reset({ name: '', verified: true });
    setModalOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditBrand(brand);
    // toBrandLogo returns null when either field is missing (legacy records)
    setLogo(toBrandLogo(brand.logo, brand.logoR2Key));
    reset({ name: brand.name, verified: brand.verified });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditBrand(null);
    setLogo(null);
    reset();
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const onSubmit = (formData: BrandFormData) => {
    const payload = {
      name: formData.name,
      verified: formData.verified,
      // Always send both fields together so the backend never gets a mismatched pair
      logo: logo?.url ?? null,
      logoR2Key: logo?.r2Key ?? null,
    };

    if (editBrand) {
      updateMutation.mutate({ id: editBrand.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // ── Table columns ────────────────────────────────────────────────────────

  const columns = [
    columnHelper.accessor('logo', {
      header: 'Logo',
      cell: info => (
        <div className="w-10 h-10 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
          {info.getValue() ? (
            <Image
              src={info.getValue()!}
              alt="logo"
              width={40}
              height={40}
              className="object-contain"
            />
          ) : (
            <span className="text-sm font-medium text-gray-400">
              {info.row.original.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      ),
      size: 60,
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: info => (
        <span className="font-medium text-white">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('slug', {
      header: 'Slug',
      cell: info => (
        <span className="text-gray-400 font-mono text-sm">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('verified', {
      header: 'Status',
      cell: info => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            info.getValue()
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
          }`}
        >
          {info.getValue() ? 'Verified' : 'Unverified'}
        </span>
      ),
      size: 100,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(info.row.original)}
            className="p-1.5 rounded-md hover:bg-[#2a2a2a] text-gray-400 hover:text-white transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete "${info.row.original.name}"?`)) {
                deleteMutation.mutate(info.row.original.id);
              }
            }}
            className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
      size: 80,
    }),
  ];

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Brands</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data?.length ?? 0} brands
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          <Plus size={15} />
          Add brand
        </button>
      </div>

      {/* Search */}
      <input
        value={globalFilter}
        onChange={e => setGlobalFilter(e.target.value)}
        placeholder="Search brands..."
        className="w-full max-w-sm h-9 px-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:border-[#3a3a3a]"
      />

      {/* Table */}
      <div className="border border-[#2a2a2a] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-[#2a2a2a] bg-[#141414]">
                {hg.headers.map(h => (
                  <th
                    key={h.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{
                      width: h.getSize() !== 150 ? h.getSize() : undefined,
                    }}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-gray-500 text-sm"
                >
                  Loading...
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-gray-500 text-sm"
                >
                  No brands found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className="border-b border-[#1e1e1e] hover:bg-[#141414] transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-white">
                {editBrand ? 'Edit brand' : 'New brand'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Logo upload */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Logo</label>
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div className="w-16 h-16 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logo?.url ? (
                      <Image
                        src={logo.url}
                        alt="logo preview"
                        width={64}
                        height={64}
                        className="object-contain cursor-pointer"
                        onClick={() =>
                          setImageModal({ isOpen: true, imageUrl: logo.url })
                        }
                      />
                    ) : uploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400" />
                    ) : (
                      <Upload size={20} className="text-gray-600" />
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer">
                      <div className="h-9 px-3 border border-dashed border-[#2a2a2a] rounded-lg flex items-center justify-center text-sm text-gray-500 hover:border-[#3a3a3a] hover:text-gray-400 transition-colors">
                        {uploading
                          ? 'Uploading...'
                          : logo?.url
                          ? 'Change logo'
                          : 'Upload logo'}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) uploadLogo(file);
                          // Reset input so the same file can be re-selected after removal
                          e.target.value = '';
                        }}
                      />
                    </label>

                    {logo?.url && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Brand name */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  Brand name *
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  placeholder="e.g. Samsung"
                  className="w-full h-9 px-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-gray-600 outline-none focus:border-[#3a3a3a]"
                />
                {errors.name && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Verified toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-white">Verified</p>
                  <p className="text-xs text-gray-500">
                    Shows as verified to sellers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('verified', !watch('verified'))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    watch('verified') ? 'bg-emerald-500' : 'bg-[#2a2a2a]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      watch('verified') ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 h-9 border border-[#2a2a2a] rounded-lg text-sm text-gray-400 hover:text-white hover:border-[#3a3a3a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 h-9 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {isPending
                    ? 'Saving...'
                    : editBrand
                    ? 'Save changes'
                    : 'Create brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image preview modal */}
      <ImageModal
        selectedImage={imageModal.imageUrl}
        onClose={() => setImageModal({ isOpen: false, imageUrl: '' })}
      />
    </div>
  );
}
