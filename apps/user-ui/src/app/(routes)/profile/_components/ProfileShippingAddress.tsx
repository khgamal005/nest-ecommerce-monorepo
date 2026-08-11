import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/utils/axiosInstance';
import { countries } from '@/utils/countries';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type AddressForm = {
  label: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  isDefault: string | boolean;
};

const ProfileShippingAddress = () => {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressForm>({
    defaultValues: {
      label: 'Home',
      street: '',
      city: '',
      zipCode: '',
      country: 'Egypt',
      isDefault: 'false',
    },
  });

  /* ==================== ADD ADDRESS ==================== */
  const { mutate: addUserAddress, isPending } = useMutation({
    mutationFn: async (data: AddressForm) => {
      const response = await axiosInstance.post('/api/users/addresses', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Address added successfully!');
      queryClient.invalidateQueries({ queryKey: ['shippingAddress'] });
      reset();
      setShowModal(false);
    },
    onError: () => {
      toast.error('Failed to add address. Please try again.');
    },
  });
  /* ==================== ADD ADDRESS ==================== */
  const { mutate: deleteAddress, isPending: deletePending } = useMutation({
    mutationFn: async (addressId: string) => {
      const response = await axiosInstance.delete(
        `/api/users/addresses/${addressId}`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Address deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['shippingAddress'] });
    },
    onError: () => {
      toast.error('Failed to delete address. Please try again.');
    },
  });

  /* ==================== GET ADDRESSES ==================== */
  const { data: addresses, isLoading } = useQuery({
    queryKey: ['shippingAddress'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/users/addresses');
      return response.data;
    },
  });

  /* ==================== SUBMIT ==================== */
  const onSubmit = (data: AddressForm) => {
    addUserAddress({
      ...data,
      isDefault: data.isDefault === 'true',
    });
  };

  return (
    <div>
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold">Saved Addresses</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 w-full sm:w-auto transition-colors"
        >
          <Plus size={18} /> Add New Address
        </button>
      </div>

      {/* Address List - Responsive Grid */}
      <div className="space-y-4 mb-8">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading addresses...</p>
          </div>
        ) : addresses?.addresses?.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 mb-4">No addresses saved yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md inline-flex items-center gap-2"
            >
              <Plus size={18} /> Add your first address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {addresses?.addresses?.map((address: any) => (
              <div
                key={address.id}
                className={`border border-gray-200 p-4 rounded-md ${
                  address.isDefault ? 'bg-blue-50 border-blue-200' : ''
                } hover:shadow-md transition-shadow`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{address.label}</h3>
                      {address.isDefault && (
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-gray-600">
                      <p className="flex items-start gap-1">
                        <span className="text-gray-400">📍</span>
                        <span>{address.street}</span>
                      </p>
                      <p>
                        {address.city}, {address.zipCode}
                      </p>
                      <p>{address.country}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:w-auto">
                    <button
                      onClick={() => deleteAddress(address.id)}
                      disabled={deletePending}
                      className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      {deletePending ? (
                        <>
                          <svg
                            className="animate-spin h-3 w-3"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <span>🗑️</span>
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal - Optimized for large screens */}
{showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Backdrop */}
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm"
      onClick={() => setShowModal(false)}
    />

    {/* Modal Content - Larger on big screens */}
    <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Add New Address
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Save a new delivery location
            </p>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>
      </div>

      {/* Scrollable Form Area */}
      <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-6 py-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
<div>
  <label className="block text-sm font-medium mb-1 text-gray-700">
    Address Type *
  </label>

  <select
    {...register("label", { required: true })}
    className="w-full px-4 py-3 border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    defaultValue=""
  >
    <option value="" disabled>
      Select address type
    </option>
    <option value="Home">Home</option>
    <option value="Work">Work</option>
    <option value="Other">Other</option>
  </select>

  {errors.label && (
    <p className="text-xs text-red-500 mt-1">
      Address type is required
    </p>
  )}
</div>


            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                ZIP Code
              </label>
              <input
                {...register("zipCode")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                placeholder="12345 (Optional)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Street Address *
            </label>
            <input
              {...register("street", { required: true })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
              placeholder="123 Main Street, Apt 4B"
            />
            {errors.street && (
              <p className="text-xs text-red-500 mt-1">
                Street address is required
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                City *
              </label>
              <input
                {...register("city", { required: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                placeholder="New York"
              />
              {errors.city && (
                <p className="text-xs text-red-500 mt-1">
                  City is required
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Country *
              </label>
              <select
                {...register("country", { required: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base bg-white"
              >
                <option value="">Select a country</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pb-4 mb-4 "> 
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Set as default address?
            </label>
            <div className="flex flex-row items-center gap-3 mb-6 ">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  {...register("isDefault")}
                  value="false"
                  className="h-4 w-4 text-blue-600"
                  defaultChecked
                />
                <span className="ml-2 text-sm text-gray-700">No</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  {...register("isDefault")}
                  value="true"
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Yes, set as default
                </span>
              </label>
            </div>
          </div>
        </form>
      </div>

      {/* Sticky Footer - Now outside the form scroll area */}
      <div className="sticky bottom-0 bg-white border-t m-2">
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            disabled={isPending}
            type="submit"
            onClick={handleSubmit(onSubmit)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base w-full sm:w-auto flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>

                Saving...
              </>
            ) : (
              "Save Address"
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default ProfileShippingAddress;
