'use client';

/**
 * CategoryManager
 * ───────────────
 * Full CRUD for 3-level category hierarchy.
 * - Add root (L1) via top button
 * - Add L2 child inline from any L1 row
 * - Add L3 child inline from any L2 row
 * - Edit name + slug at any level via inline form
 * - Delete any node (confirms, cascades on backend)
 * - All mutations hit the same endpoints your backend already exposes
 */

import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import axiosInstance from '../../../utils/axiosInstance'; // adjust path

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
  level: number;
  parentId: string | null;
  children: Category[];
}

type FormMode = 'add-l1' | 'add-child' | 'edit';

interface ActiveForm {
  mode: FormMode;
  targetId?: string;   // parentId for add-child, categoryId for edit
  level?: number;      // level of the NEW child (2 or 3)
  defaults?: { name: string; slug: string };
}

interface FormValues {
  name: string;
  slug: string;
}

// ─── API helpers ───────────────────────────────────────────────────────────────

const api = {
  getAll: async (): Promise<Category[]> => {
    const res = await axiosInstance.get('/api/categories/all');
    return res.data.categories || [];
  },

  // Create a standalone single category (used for inline child adds)
  createSingle: async (data: {
    name: string;
    slug: string;
    level: number;
    parentId: string | null;
  }) => {
    // Reuse the hierarchy endpoint with just level1 for root,
    // or POST to a direct /categories/single endpoint if you have one.
    // Adjust to match your backend:
    const res = await axiosInstance.post('/api/categories', data);
    return res.data;
  },

  // Create full hierarchy (L1 + optional L2/L3) – kept for bulk seed
  createHierarchy: async (data: {
    level1: { name: string; slug: string };
    level2?: { name: string; slug: string; level3?: { name: string; slug: string }[] }[];
  }) => {
    const res = await axiosInstance.post('/api/categories', data);
    return res.data;
  },

  update: async (id: string, data: { name: string; slug: string }) => {
    const res = await axiosInstance.patch(`/api/categories/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await axiosInstance.delete(`/api/categories/${id}`);
    return res.data;
  },
};

// ─── Slug auto-generator ───────────────────────────────────────────────────────

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[\u0600-\u06FF\s]+/g, '-') // Arabic → hyphens
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

// ─── Inline Form ───────────────────────────────────────────────────────────────

function InlineForm({
  defaults,
  onSave,
  onCancel,
  isPending,
  placeholder,
}: {
  defaults?: { name: string; slug: string };
  onSave: (values: FormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
  placeholder?: string;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: defaults ?? { name: '', slug: '' } });

  const nameVal = watch('name');
  const slugTouched = useRef(!!defaults?.slug);

  useEffect(() => {
    if (!slugTouched.current && nameVal) {
      setValue('slug', toSlug(nameVal));
    }
  }, [nameVal, setValue]);

  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="flex flex-wrap items-start gap-2 py-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
        <input
          {...register('name', { required: 'Name required' })}
          ref={(el) => {
            (register('name').ref as any)(el);
            (nameRef as any).current = el;
          }}
          placeholder={placeholder ?? 'Category name'}
          className="px-2.5 py-1.5 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {errors.name && (
          <span className="text-xs text-red-500">{errors.name.message}</span>
        )}
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
        <input
          {...register('slug', {
            required: 'Slug required',
            pattern: { value: /^[a-z0-9-]+$/, message: 'a-z, 0-9, hyphens only' },
          })}
          placeholder="url-slug"
          className="px-2.5 py-1.5 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
          onFocus={() => { slugTouched.current = true; }}
        />
        {errors.slug && (
          <span className="text-xs text-red-500">{errors.slug.message}</span>
        )}
      </div>
      <div className="flex gap-1.5 mt-0.5">
        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? '…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-semibold border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Delete confirm inline ─────────────────────────────────────────────────────

function ConfirmDelete({
  name,
  hasChildren,
  onConfirm,
  onCancel,
  isPending,
}: {
  name: string;
  hasChildren: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="text-red-600 font-medium">
        Delete "{name}"{hasChildren ? ' + all children?' : '?'}
      </span>
      <button
        onClick={onConfirm}
        disabled={isPending}
        className="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
      >
        {isPending ? '…' : 'Yes'}
      </button>
      <button
        onClick={onCancel}
        className="px-2 py-0.5 border border-gray-300 text-gray-600 rounded text-xs hover:bg-gray-50"
      >
        No
      </button>
    </span>
  );
}

// ─── Row action buttons ────────────────────────────────────────────────────────

function RowActions({
  onEdit,
  onDelete,
  onAddChild,
  canAddChild,
  addChildLabel,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onAddChild?: () => void;
  canAddChild?: boolean;
  addChildLabel?: string;
}) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {canAddChild && onAddChild && (
        <button
          onClick={(e) => { e.stopPropagation(); onAddChild(); }}
          title={addChildLabel}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors border border-emerald-200"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {addChildLabel ?? 'Add child'}
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        title="Edit"
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete"
        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

// ─── Level badges ──────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<number, string> = {
  1: 'bg-blue-100 text-blue-700 border-blue-200',
  2: 'bg-violet-100 text-violet-700 border-violet-200',
  3: 'bg-amber-100 text-amber-700 border-amber-200',
};

// ─── Main component ────────────────────────────────────────────────────────────

export default function CategoryManager() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeForm, setActiveForm] = useState<ActiveForm | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: rawCategories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: api.getAll,
    staleTime: 5 * 60 * 1000,
  });

  // Only L1 nodes (children are already nested from backend)
  const roots = rawCategories.filter((c) => c.level === 1);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-categories'] });

  const createMut = useMutation({
    mutationFn: api.createSingle,
    onSuccess: () => { invalidate(); setActiveForm(null); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormValues }) =>
      api.update(id, data),
    onSuccess: () => { invalidate(); setActiveForm(null); },
  });

  const deleteMut = useMutation({
    mutationFn: api.delete,
    onSuccess: () => { invalidate(); setConfirmDelete(null); },
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const openAddChild = (parentId: string, childLevel: number) => {
    setExpanded((prev) => new Set([...prev, parentId]));
    setActiveForm({ mode: 'add-child', targetId: parentId, level: childLevel });
  };

  const openEdit = (cat: Category) =>
    setActiveForm({ mode: 'edit', targetId: cat.id, defaults: { name: cat.name, slug: cat.slug } });

  const openAddL1 = () => setActiveForm({ mode: 'add-l1' });

  const handleSave = (values: FormValues) => {
    if (!activeForm) return;
    if (activeForm.mode === 'edit') {
      updateMut.mutate({ id: activeForm.targetId!, data: values });
    } else if (activeForm.mode === 'add-l1') {
      createMut.mutate({ ...values, level: 1, parentId: null });
    } else {
      createMut.mutate({
        ...values,
        level: activeForm.level!,
        parentId: activeForm.targetId!,
      });
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  // ── Render helpers ────────────────────────────────────────────────────────────

  const renderL3 = (nodes: Category[], parentId: string) => (
    <div className="border-l-2 border-amber-200 ml-10 mt-1 space-y-0.5">
      {nodes.map((cat) => (
        <div key={cat.id}>
          <div className="group flex items-center justify-between px-3 py-2 rounded-md hover:bg-amber-50/60 transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${LEVEL_STYLES[3]}`}>L3</span>
              <span className="text-sm text-gray-700 truncate">{cat.name}</span>
              <code className="text-xs text-gray-400 font-mono truncate hidden sm:block">{cat.slug}</code>
            </div>
            {confirmDelete === cat.id ? (
              <ConfirmDelete
                name={cat.name}
                hasChildren={false}
                onConfirm={() => deleteMut.mutate(cat.id)}
                onCancel={() => setConfirmDelete(null)}
                isPending={deleteMut.isPending}
              />
            ) : activeForm?.mode === 'edit' && activeForm.targetId === cat.id ? null : (
              <RowActions
                onEdit={() => openEdit(cat)}
                onDelete={() => setConfirmDelete(cat.id)}
              />
            )}
          </div>
          {activeForm?.mode === 'edit' && activeForm.targetId === cat.id && (
            <div className="pl-10 pr-3 pb-2">
              <InlineForm
                defaults={activeForm.defaults}
                onSave={handleSave}
                onCancel={() => setActiveForm(null)}
                isPending={isPending}
              />
            </div>
          )}
        </div>
      ))}

      {/* Add L3 inline form */}
      {activeForm?.mode === 'add-child' && activeForm.targetId === parentId && activeForm.level === 3 && (
        <div className="px-3 pb-2">
          <InlineForm
            onSave={handleSave}
            onCancel={() => setActiveForm(null)}
            isPending={isPending}
            placeholder="New subcategory name"
          />
        </div>
      )}
    </div>
  );

  const renderL2 = (nodes: Category[], parentId: string) => (
    <div className="border-l-2 border-violet-200 ml-5 mt-1 space-y-0.5">
      {nodes.map((cat) => (
        <div key={cat.id}>
          <div
            className="group flex items-center justify-between px-3 py-2 rounded-md hover:bg-violet-50/50 cursor-pointer transition-colors"
            onClick={() => cat.children?.length > 0 && toggle(cat.id)}
          >
            <div className="flex items-center gap-2 min-w-0">
              {/* Chevron */}
              <span className="w-4 shrink-0">
                {cat.children?.length > 0 && (
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded.has(cat.id) ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </span>
              <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${LEVEL_STYLES[2]}`}>L2</span>
              <span className="text-sm font-medium text-gray-800 truncate">{cat.name}</span>
              <code className="text-xs text-gray-400 font-mono truncate hidden sm:block">{cat.slug}</code>
              {cat.children?.length > 0 && (
                <span className="text-xs text-gray-400">({cat.children.length})</span>
              )}
            </div>
            {confirmDelete === cat.id ? (
              <ConfirmDelete
                name={cat.name}
                hasChildren={(cat.children?.length ?? 0) > 0}
                onConfirm={() => deleteMut.mutate(cat.id)}
                onCancel={() => setConfirmDelete(null)}
                isPending={deleteMut.isPending}
              />
            ) : activeForm?.mode === 'edit' && activeForm.targetId === cat.id ? null : (
              <RowActions
                onEdit={() => openEdit(cat)}
                onDelete={() => setConfirmDelete(cat.id)}
                canAddChild
                addChildLabel="+ Subcategory"
                onAddChild={() => openAddChild(cat.id, 3)}
              />
            )}
          </div>

          {activeForm?.mode === 'edit' && activeForm.targetId === cat.id && (
            <div className="pl-12 pr-3 pb-2">
              <InlineForm
                defaults={activeForm.defaults}
                onSave={handleSave}
                onCancel={() => setActiveForm(null)}
                isPending={isPending}
              />
            </div>
          )}

          {expanded.has(cat.id) && renderL3(cat.children ?? [], cat.id)}
        </div>
      ))}

      {/* Add L2 inline form */}
      {activeForm?.mode === 'add-child' && activeForm.targetId === parentId && activeForm.level === 2 && (
        <div className="px-3 pb-2">
          <InlineForm
            onSave={handleSave}
            onCancel={() => setActiveForm(null)}
            isPending={isPending}
            placeholder="New subcategory name"
          />
        </div>
      )}
    </div>
  );

  const renderL1 = (cats: Category[]) =>
    cats.map((cat) => (
      <div
        key={cat.id}
        className="border border-gray-200 rounded-xl overflow-hidden"
      >
        {/* L1 row */}
        <div
          className="group flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => toggle(cat.id)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <svg
              className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expanded.has(cat.id) ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${LEVEL_STYLES[1]}`}>L1</span>
            <span className="font-semibold text-gray-900 truncate">{cat.name}</span>
            <code className="text-xs text-gray-400 font-mono truncate hidden sm:block">{cat.slug}</code>
            <span className="text-xs text-gray-400 shrink-0">
              ({cat.children?.length ?? 0} subcategories)
            </span>
          </div>
          {confirmDelete === cat.id ? (
            <ConfirmDelete
              name={cat.name}
              hasChildren={(cat.children?.length ?? 0) > 0}
              onConfirm={() => deleteMut.mutate(cat.id)}
              onCancel={() => setConfirmDelete(null)}
              isPending={deleteMut.isPending}
            />
          ) : activeForm?.mode === 'edit' && activeForm.targetId === cat.id ? null : (
            <RowActions
              onEdit={() => openEdit(cat)}
              onDelete={() => setConfirmDelete(cat.id)}
              canAddChild
              addChildLabel="+ Sub"
              onAddChild={() => openAddChild(cat.id, 2)}
            />
          )}
        </div>

        {/* L1 edit form */}
        {activeForm?.mode === 'edit' && activeForm.targetId === cat.id && (
          <div className="px-4 py-3 border-t border-gray-200 bg-white">
            <InlineForm
              defaults={activeForm.defaults}
              onSave={handleSave}
              onCancel={() => setActiveForm(null)}
              isPending={isPending}
            />
          </div>
        )}

        {/* L2 children */}
        {expanded.has(cat.id) && (
          <div className="px-4 py-2 bg-white">
            {renderL2(cat.children ?? [], cat.id)}
          </div>
        )}
      </div>
    ));

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Category Hierarchy
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Click any row to expand · hover to reveal actions</p>
        </div>
        <button
          onClick={openAddL1}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Root Category
        </button>
      </div>

      {/* Add L1 form */}
      {activeForm?.mode === 'add-l1' && (
        <div className="px-6 py-3 border-b border-blue-100 bg-blue-50/40">
          <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">New Root Category</p>
          <InlineForm
            onSave={handleSave}
            onCancel={() => setActiveForm(null)}
            isPending={isPending}
            placeholder="e.g. إلكترونيات"
          />
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 px-6 py-2 bg-gray-50/70 border-b border-gray-100 text-xs">
        {[1, 2, 3].map((l) => (
          <span key={l} className={`px-1.5 py-0.5 rounded border font-bold ${LEVEL_STYLES[l]}`}>
            L{l}
          </span>
        ))}
        <span className="text-gray-400 ml-1">= hierarchy depth</span>
      </div>

      {/* Tree */}
      <div className="p-4 max-h-[600px] overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : roots.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm">No categories yet.</p>
            <p className="text-xs mt-1">Click "Add Root Category" to get started.</p>
          </div>
        ) : (
          renderL1(roots)
        )}
      </div>
    </div>
  );
}
